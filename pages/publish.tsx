import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface OnboardingData {
  name: string
  use_case: string
  email: string
  referral_source: string
}

export default function Publish() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)
  const [resumeData, setResumeData] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState(1)
  const [subdomain, setSubdomain] = useState('')
  const [subdomainAvailable, setSubdomainAvailable] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Get onboarding data from sessionStorage
      const name = sessionStorage.getItem('userName') || ''
      const use_case = sessionStorage.getItem('useCase') || ''
      const email = sessionStorage.getItem('userEmail') || ''
      const referral_source = sessionStorage.getItem('referralSource') || ''

      setOnboardingData({ name, use_case, email, referral_source })

      // Get resume data
      const refinedData = sessionStorage.getItem('refinedResumeJson')
      if (refinedData) {
        setResumeData(JSON.parse(refinedData))
      }

      // Get selected template
      const template = sessionStorage.getItem('selectedTemplate')
      if (template) {
        setSelectedTemplate(parseInt(template))
      }

      // Generate subdomain from name
      const generatedSubdomain = name.toLowerCase().replace(/[^a-z0-9]/g, '')
      setSubdomain(generatedSubdomain)

      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  const checkSubdomainAvailability = async (domain: string) => {
    try {
      const { data, error } = await supabase
        .rpc('is_subdomain_available', { subdomain_text: domain })
      
      if (error) throw error
      setSubdomainAvailable(data)
    } catch (error) {
      console.error('Error checking subdomain:', error)
      setSubdomainAvailable(false)
    }
  }

  useEffect(() => {
    if (subdomain) {
      checkSubdomainAvailability(subdomain)
    }
  }, [subdomain])

  const handlePublish = async () => {
    if (!onboardingData || !resumeData) {
      alert('Missing required data')
      return
    }

    if (!subdomainAvailable) {
      alert('Please choose a different subdomain')
      return
    }

    setPublishing(true)

    try {
      // Generate a unique user ID for this session
      const sessionUserId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: sessionUserId,
          email: onboardingData.email,
          name: onboardingData.name,
          use_case: onboardingData.use_case,
          referral_source: onboardingData.referral_source
        })

      if (userError) throw userError

      // Create portfolio
      const { data: portfolio, error: portfolioError } = await supabase
        .from('portfolios')
        .insert({
          user_id: sessionUserId,
          subdomain: subdomain,
          title: resumeData.name || 'My Portfolio',
          description: resumeData.about || 'Personal portfolio'
        })
        .select()
        .single()

      if (portfolioError) throw portfolioError

      // Save resume data
      const { error: resumeError } = await supabase
        .from('resume_data')
        .insert({
          portfolio_id: portfolio.id,
          parsed_text: sessionStorage.getItem('parsedText') || '',
          extracted_json: JSON.parse(sessionStorage.getItem('resumeJson') || '{}'),
          enhanced_json: resumeData,
          final_json: resumeData,
          template_id: selectedTemplate
        })

      if (resumeError) throw resumeError

      // Store session user ID for later use
      sessionStorage.setItem('sessionUserId', sessionUserId)

      // Redirect to Stripe checkout
      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe failed to load')

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolio_id: portfolio.id,
          subdomain: subdomain,
          user_id: sessionUserId
        }),
      })

      const session = await response.json()
      
      if (session.error) {
        throw new Error(session.error)
      }

      // Redirect to Stripe checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

    } catch (error) {
      console.error('Error publishing:', error)
      alert('Error publishing portfolio. Please try again.')
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
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

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Publish Your Portfolio</h1>
          <p className="text-xl text-gray-300">
            Get your portfolio live on the web in minutes
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-gray-900 rounded-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">$5/month</h2>
            <p className="text-gray-400">Recurring subscription</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Custom subdomain (yourname.typefolio.xyz)</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Professional hosting on Vercel</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>SSL certificate included</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>24/7 uptime monitoring</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* Subdomain Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">Your Portfolio URL</label>
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">https://</span>
              <input
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="yourname"
              />
              <span className="text-gray-400 ml-2">.typefolio.xyz</span>
            </div>
            {subdomain && (
              <p className={`text-sm mt-2 ${subdomainAvailable ? 'text-green-400' : 'text-red-400'}`}>
                {subdomainAvailable ? '✓ Available' : '✗ Not available'}
              </p>
            )}
          </div>

          {/* Publish Button */}
          <button
            onClick={handlePublish}
            disabled={publishing || !subdomainAvailable || !subdomain}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            {publishing ? 'Processing...' : 'Publish Portfolio'}
          </button>
        </div>

        {/* Portfolio Preview */}
        {resumeData && (
          <div className="bg-gray-900 rounded-2xl p-8">
            <h3 className="text-xl font-semibold mb-4">Portfolio Preview</h3>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center mb-4">
                {resumeData.profile_picture ? (
                  <img
                    src={resumeData.profile_picture}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-white text-xl font-bold mr-4">
                    {resumeData.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-semibold">{resumeData.name || 'Your Name'}</h4>
                  <p className="text-gray-400">{resumeData.tagline || 'Professional Portfolio'}</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">
                Template: {selectedTemplate === 1 ? 'Classic' : selectedTemplate === 2 ? 'Modern' : `Template ${selectedTemplate}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 