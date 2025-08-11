import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { portfolio_id } = req.body

    if (!portfolio_id) {
      return res.status(400).json({ error: 'Portfolio ID is required' })
    }

    // Get portfolio and resume data
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select(`
        *,
        resume_data (*)
      `)
      .eq('id', portfolio_id)
      .single()

    if (portfolioError || !portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' })
    }

    // Create deployment record
    const { data: deployment, error: deploymentError } = await supabase
      .from('deployments')
      .insert({
        portfolio_id: portfolio_id,
        status: 'pending'
      })
      .select()
      .single()

    if (deploymentError) {
      return res.status(500).json({ error: 'Failed to create deployment record' })
    }

    // For now, simulate deployment success
    // In production, this would integrate with Vercel API
    setTimeout(async () => {
      const portfolioUrl = `https://${portfolio.subdomain}.typefolio.xyz`
      
      await supabase
        .from('deployments')
        .update({
          status: 'ready',
          deployment_url: portfolioUrl,
          vercel_deployment_id: 'simulated-deployment-id',
          vercel_project_id: 'typefolio-portfolios'
        })
        .eq('id', deployment.id)
    }, 5000) // Simulate 5 second deployment

    res.status(200).json({ 
      status: 'pending',
      deployment_id: deployment.id 
    })

  } catch (error) {
    console.error('Error deploying portfolio:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 