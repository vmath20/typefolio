import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Processing() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('parsing')
  const [fileName, setFileName] = useState<string>('')

  useEffect(() => {
    // Get file name from session storage
    const savedFileName = sessionStorage.getItem('fileName')
    if (savedFileName) {
      setFileName(savedFileName)
    } else {
      // If no file name, redirect back to upload
      router.push('/')
      return
    }

    // Simulate processing steps
    const steps = [
      { name: 'parsing', duration: 3000, label: 'Parsing your resume...' },
      { name: 'enhancing', duration: 4000, label: 'Enhancing with AI...' },
      { name: 'finalizing', duration: 1000, label: 'Finalizing data...' }
    ]

    let currentStepIndex = 0
    let stepProgress = 0

    const interval = setInterval(() => {
      const currentStepData = steps[currentStepIndex]
      
      if (currentStepIndex < steps.length) {
        stepProgress += 100 / (currentStepData.duration / 100)
        
        if (stepProgress >= 100) {
          stepProgress = 0
          currentStepIndex++
          if (currentStepIndex < steps.length) {
            setCurrentStep(steps[currentStepIndex].name)
          }
        }

        const totalProgress = ((currentStepIndex * 100) + stepProgress) / steps.length
        setProgress(Math.min(totalProgress, 100))

        if (currentStepIndex >= steps.length) {
          clearInterval(interval)
          // Redirect to results page
          setTimeout(() => {
            router.push('/results')
          }, 500)
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [router])

  const getStepLabel = () => {
    switch (currentStep) {
      case 'parsing':
        return 'Parsing your resume...'
      case 'enhancing':
        return 'Enhancing with AI...'
      case 'finalizing':
        return 'Finalizing data...'
      default:
        return 'Processing...'
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 'parsing':
        return 'Extracting text and structuring your resume data'
      case 'enhancing':
        return 'Generating summaries and fetching company logos'
      case 'finalizing':
        return 'Preparing your data for editing'
      default:
        return 'Processing your resume'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
              {/* Logo */}
        <div className="absolute top-6 left-6">
          <img 
            src="/Logo.png" 
            alt="Typefolio" 
            className="h-16 w-auto"
          />
        </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="max-w-md w-full">
          <div className="bg-black rounded-lg shadow-lg p-8 text-center border border-white">
            {/* Logo/Brand */}
            <div className="mb-8">
              <div className="flex justify-center mb-2">
                <img 
                  src="/Logo.png" 
                  alt="Typefolio" 
                  className="h-16 w-auto"
                />
              </div>
              <p className="text-gray-300" style={{ fontFamily: 'Roboto, sans-serif' }}>Creating your portfolio</p>
            </div>

          {/* File Name */}
          {fileName && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-300" style={{ fontFamily: 'Roboto, sans-serif' }}>
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Processing <span className="font-medium">{fileName}</span></span>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
              <div 
                className="bg-white h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-300" style={{ fontFamily: 'Roboto, sans-serif' }}>
              {Math.round(progress)}% complete
            </div>
          </div>

          {/* Current Step */}
          <div className="mb-8">
            <div className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
              {getStepLabel()}
            </div>
            <div className="text-sm text-gray-300" style={{ fontFamily: 'Roboto, sans-serif' }}>
              {getStepDescription()}
            </div>
          </div>

          {/* Loading Animation */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="space-y-3">
            <div className={`flex items-center gap-3 text-sm ${currentStep === 'parsing' || progress > 33 ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'Roboto, sans-serif' }}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === 'parsing' ? 'bg-white text-black' : 
                progress > 33 ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                {progress > 33 ? '✓' : '1'}
              </div>
              <span>Parse Resume</span>
            </div>
            
            <div className={`flex items-center gap-3 text-sm ${currentStep === 'enhancing' || progress > 66 ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'Roboto, sans-serif' }}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === 'enhancing' ? 'bg-white text-black' : 
                progress > 66 ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                {progress > 66 ? '✓' : '2'}
              </div>
              <span>AI Enhancement</span>
            </div>
            
            <div className={`flex items-center gap-3 text-sm ${currentStep === 'finalizing' || progress > 95 ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'Roboto, sans-serif' }}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === 'finalizing' ? 'bg-white text-black' : 
                progress > 95 ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                {progress > 95 ? '✓' : '3'}
              </div>
              <span>Finalize Data</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-gray-800 border border-gray-600 rounded-lg">
            <div className="text-sm text-white" style={{ fontFamily: 'Roboto, sans-serif' }}>
              <div className="font-medium mb-1">What's happening?</div>
              <div className="text-xs text-gray-300">
                We're using AI to extract and enhance your resume data. This usually takes 30-60 seconds.
              </div>
            </div>
          </div>

          {/* Reset Onboarding Link */}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                sessionStorage.removeItem('userName')
                router.push('/onboarding')
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Reset onboarding
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
} 