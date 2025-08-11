import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { portfolio_id } = req.query

    if (!portfolio_id || typeof portfolio_id !== 'string') {
      return res.status(400).json({ error: 'Portfolio ID is required' })
    }

    // Get latest deployment
    const { data: deployment, error: deploymentError } = await supabase
      .from('deployments')
      .select('*')
      .eq('portfolio_id', portfolio_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (deploymentError) {
      return res.status(404).json({ error: 'Deployment not found' })
    }

    // Get portfolio for subdomain
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('subdomain')
      .eq('id', portfolio_id)
      .single()

    if (portfolioError || !portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' })
    }

    const url = deployment.status === 'ready' 
      ? `https://${portfolio.subdomain}.typefolio.xyz`
      : null

    res.status(200).json({
      status: deployment.status,
      url: url,
      deployment_id: deployment.id
    })

  } catch (error) {
    console.error('Error getting deployment status:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 