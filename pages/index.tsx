import React, { useState, useCallback, useMemo, memo, useEffect } from 'react'
import { useRouter } from 'next/navigation';

interface ResumeData {
  name?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  github?: string
  twitter?: string
  instagram?: string
  facebook?: string
  devpost?: string
  scholar?: string
  youtube?: string
  profile_picture?: string
  skills?: string[]
  projects?: Array<{ name: string; description?: string; links?: string[] }>
  publications?: Array<{ name: string; journal?: string; year?: string; authors?: string; link?: string }>
  patents?: Array<{ name: string; inventors?: string; number?: string; link?: string }>
  work_experience?: Array<{ 
    company: string; 
    title: string; 
    dates?: string; 
    start_date?: string; 
    end_date?: string; 
    description?: string;
    logo_url?: string;
  }>
  education?: Array<{ 
    institution: string; 
    degree: string; 
    dates?: string; 
    start_date?: string; 
    end_date?: string; 
    gpa?: string; 
    activities?: string;
    logo_url?: string;
  }>
  awards?: Array<{ name: string; description?: string }>
  languages?: string[]
  test_scores?: Array<{ test_name: string; score: string }>
  courses?: string[]
  certifications?: Array<{ name: string; date_issued?: string; link?: string }>
  tagline?: string
  about?: string
  parsing_error?: string
}

export default function Home() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const router = useRouter()

  // Check if user has completed onboarding
  useEffect(() => {
    const savedUserName = sessionStorage.getItem('userName')
    if (!savedUserName) {
      router.push('/onboarding')
    } else {
      setUserName(savedUserName)
    }
  }, [router])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setLoading(true)

    // Read file as data URL (base64)
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const dataUrl = reader.result as string
        const res = await fetch('/api/parse-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl }),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Failed to parse resume')
        }
        
        // Check if we got valid data
        if (!data.extractedJson) {
          throw new Error('No JSON data extracted from resume')
        }
        
        // Show warning if there was a parsing error but we still got data
        if (data.extractedJson.parsing_error) {
          alert(`⚠️ ${data.extractedJson.parsing_error}\n\nYou can edit the data manually before creating your website.`)
        }
        
        // Store basic data in session storage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('fileName', file.name)
          sessionStorage.setItem('parsedText', data.parsedText || 'Text extraction failed')
          sessionStorage.setItem('resumeJson', JSON.stringify(data.extractedJson))
        }
        
        // Now enhance the JSON with AI-generated content and logos
        setEnhancing(true)
        try {
          const enhanceRes = await fetch('/api/refine-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeJson: data.extractedJson }),
          })
          
          if (!enhanceRes.ok) {
            throw new Error(`Enhancement failed: ${enhanceRes.status} ${enhanceRes.statusText}`)
          }
          
          const responseText = await enhanceRes.text()
          let enhancedData
          
          try {
            enhancedData = JSON.parse(responseText)
          } catch (jsonError) {
            console.error('Failed to parse enhancement response:', responseText)
            throw new Error('Server returned invalid JSON response')
          }
          
          // Store enhanced version in sessionStorage
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('refinedResumeJson', JSON.stringify(enhancedData))
          }
        } catch (enhanceErr: any) {
          console.error('Enhancement error:', enhanceErr)
          alert(`Enhancement failed: ${enhanceErr.message}. The basic extracted data will be used instead.`)
        } finally {
          setEnhancing(false)
          setLoading(false)
          
          // Redirect to processing page
          router.push('/processing')
        }
      } catch (err) {
        console.error(err)
        alert((err as Error).message)
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
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
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium mb-8 leading-tight text-center whitespace-nowrap" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Upload your resume.
            </h1>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-10 mb-8 border border-gray-600">
            <div className="border-2 border-dashed border-gray-500 rounded-xl p-16 text-center hover:border-gray-400 transition-colors">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
                disabled={loading || enhancing}
          className="hidden"
                id="resume-upload"
        />
              <label
                htmlFor="resume-upload"
                className={`cursor-pointer block ${loading || enhancing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-8xl mb-6">📄</div>
                <h3 className="text-2xl font-semibold text-white mb-3" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Upload your resume
                </h3>
                <p className="text-gray-300 text-lg" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Supports PDF files
                </p>
      </label>
            </div>

            {loading && (
              <div className="mt-6 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto"></div>
                <p className="mt-3 text-gray-300 text-lg" style={{ fontFamily: 'Roboto, sans-serif' }}>Uploading and preparing...</p>
        </div>
      )}



            {/* Bottom Navigation */}
            {userName && (
              <div className="mt-8 flex items-center justify-center gap-6">
                <button
                  onClick={() => {
                    (document.getElementById('resume-upload') as HTMLInputElement)?.click()
                  }}
                  className={`px-12 py-4 rounded-lg font-medium transition-colors text-lg ${loading || enhancing ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'}`}
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                  disabled={loading || enhancing}
                >
                  Continue
                </button>
        <button
                  onClick={() => {
                    sessionStorage.setItem('startAtReferral', 'true')
                    router.push('/onboarding')
                  }}
                  className="text-white hover:text-gray-300 transition-colors text-lg"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                  disabled={loading || enhancing}
                >
                  Back
        </button>
              </div>
      )}
          </div>
        </div>
      </div>
    </div>
  )
} 