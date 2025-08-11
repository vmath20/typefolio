import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { supabase } from '../../lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { portfolio_id, subdomain, user_id } = req.body

    if (!portfolio_id || !subdomain || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Get user email from the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', user_id)
      .single()

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if customer already exists
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user_id)
      .single()

    let customerId = existingSubscription?.stripe_customer_id

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          user_id: user_id,
          portfolio_id: portfolio_id
        }
      })
      customerId = customer.id
    }

    // Determine base URL for success/cancel URLs
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : `https://${process.env.NEXT_PUBLIC_DOMAIN}`

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Typefolio Portfolio Hosting',
              description: `Portfolio hosting for ${subdomain}.typefolio.xyz`,
            },
            unit_amount: 500, // $5.00 in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/publish`,
      metadata: {
        portfolio_id: portfolio_id,
        subdomain: subdomain,
        user_id: user_id
      },
      subscription_data: {
        metadata: {
          portfolio_id: portfolio_id,
          subdomain: subdomain,
          user_id: user_id
        }
      }
    })

    res.status(200).json({ id: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 