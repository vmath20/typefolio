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
    const { session_id } = req.body

    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' })
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id)
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const { portfolio_id, subdomain } = session.metadata || {}
    
    if (!portfolio_id || !subdomain) {
      return res.status(400).json({ error: 'Invalid session metadata' })
    }

    // Get portfolio details
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolio_id)
      .single()

    if (portfolioError || !portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' })
    }

    // Get latest deployment
    const { data: deployment, error: deploymentError } = await supabase
      .from('deployments')
      .select('*')
      .eq('portfolio_id', portfolio_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const portfolioUrl = `https://${subdomain}.typefolio.xyz`
    const deploymentStatus = deployment?.status || 'pending'

    res.status(200).json({
      portfolio_id: portfolio_id,
      portfolio_url: portfolioUrl,
      deployment_status: deploymentStatus,
      subdomain: subdomain
    })

  } catch (error) {
    console.error('Error verifying session:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 