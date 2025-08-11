import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { supabase } from '../../../lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature'] as string
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    res.status(500).json({ error: 'Webhook handler failed' })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { portfolio_id, subdomain, user_id } = session.metadata || {}
  
  if (!portfolio_id || !subdomain || !user_id) {
    console.error('Missing metadata in checkout session')
    return
  }

  // Update portfolio to published
  const { error: portfolioError } = await supabase
    .from('portfolios')
    .update({ is_published: true })
    .eq('id', portfolio_id)

  if (portfolioError) {
    console.error('Error updating portfolio:', portfolioError)
  }

  // Create subscription record
  if (session.subscription) {
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user_id,
        portfolio_id: portfolio_id,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        stripe_price_id: session.line_items?.data[0]?.price?.id,
        status: 'active',
        current_period_start: new Date(Date.now()),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError)
    }
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const { portfolio_id, user_id } = subscription.metadata || {}
  
  if (!portfolio_id || !user_id) {
    console.error('Missing metadata in subscription')
    return
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date((subscription as any).current_period_start * 1000),
      current_period_end: new Date((subscription as any).current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date((subscription as any).current_period_start * 1000),
      current_period_end: new Date((subscription as any).current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: true
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
  }

  // Unpublish portfolio
  const { data: subscriptionData } = await supabase
    .from('subscriptions')
    .select('portfolio_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (subscriptionData?.portfolio_id) {
    const { error: portfolioError } = await supabase
      .from('portfolios')
      .update({ is_published: false })
      .eq('id', subscriptionData.portfolio_id)

    if (portfolioError) {
      console.error('Error unpublishing portfolio:', portfolioError)
    }
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if ((invoice as any).subscription) {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date(invoice.period_start * 1000),
        current_period_end: new Date(invoice.period_end * 1000)
      })
      .eq('stripe_subscription_id', (invoice as any).subscription as string)

    if (error) {
      console.error('Error updating subscription after payment:', error)
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if ((invoice as any).subscription) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', (invoice as any).subscription as string)

    if (error) {
      console.error('Error updating subscription after failed payment:', error)
    }
  }
} 