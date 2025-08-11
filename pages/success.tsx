import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Success() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [deploymentStatus, setDeploymentStatus] = useState('pending')

  useEffect(() => {
    if (router.query.session_id) {
      handleSuccess(router.query.session_id as string)
    }
  }, [router.query.session_id])

  const handleSuccess = async (sessionId: string) => {
    try {
      // Verify the session and get portfolio details
      const response = await fetch('/api/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setPortfolioUrl(data.portfolio_url)
      setDeploymentStatus(data.deployment_status)
      setLoading(false)

      // Start deployment process
      if (data.deployment_status === 'pending') {
        startDeployment(data.portfolio_id)
      }

    } catch (error) {
      console.error('Error handling success:', error)
      setLoading(false)
    }
  }

  const startDeployment = async (portfolioId: string) => {
    try {
      const response = await fetch('/api/deploy-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ portfolio_id: portfolioId }),
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setDeploymentStatus(data.status)
      
      // Poll for deployment status
      if (data.status === 'pending') {
        pollDeploymentStatus(portfolioId)
      }

    } catch (error) {
      console.error('Error starting deployment:', error)
      setDeploymentStatus('failed')
    }
  }

  const pollDeploymentStatus = async (portfolioId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/deployment-status?portfolio_id=${portfolioId}`)
        const data = await response.json()
        
        if (data.status === 'ready') {
          setDeploymentStatus('ready')
          setPortfolioUrl(data.url)
          clearInterval(pollInterval)
        } else if (data.status === 'failed') {
          setDeploymentStatus('failed')
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error('Error polling deployment status:', error)
        clearInterval(pollInterval)
      }
    }, 5000) // Poll every 5 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      if (deploymentStatus === 'pending') {
        setDeploymentStatus('timeout')
      }
    }, 300000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Processing your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="absolute top-6 left-6">
        <img src="/Logo.png" alt="Typefolio" className="h-16 w-auto" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>

        <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-xl text-gray-300 mb-8">
          Your portfolio is being deployed. This usually takes 1-2 minutes.
        </p>

        {/* Deployment Status */}
        <div className="bg-gray-900 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Deployment Status</h2>
          
          {deploymentStatus === 'pending' && (
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
              <span>Deploying your portfolio...</span>
            </div>
          )}

          {deploymentStatus === 'ready' && (
            <div className="flex items-center justify-center mb-4 text-green-400">
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Deployment complete!</span>
            </div>
          )}

          {deploymentStatus === 'failed' && (
            <div className="flex items-center justify-center mb-4 text-red-400">
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Deployment failed. Please contact support.</span>
            </div>
          )}

          {deploymentStatus === 'timeout' && (
            <div className="flex items-center justify-center mb-4 text-yellow-400">
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Deployment is taking longer than expected.</span>
            </div>
          )}

          {/* Portfolio URL */}
          {portfolioUrl && (
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Your portfolio is live at:</p>
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-lg font-medium break-all"
              >
                {portfolioUrl}
              </a>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {portfolioUrl && deploymentStatus === 'ready' && (
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              View Your Portfolio
            </a>
          )}
          
          <button
            onClick={() => router.push('/')}
            className="block w-full bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Create Another Portfolio
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-gray-400 text-sm">
          <p>You'll receive an email confirmation shortly.</p>
          <p className="mt-2">
            Need help? Contact us at{' '}
            <a href="mailto:support@typefolio.xyz" className="text-blue-400 hover:text-blue-300">
              support@typefolio.xyz
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 