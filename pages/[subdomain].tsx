import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

interface ResumeData {
  name: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  twitter: string
  instagram: string
  facebook: string
  devpost: string
  scholar: string
  youtube: string
  website: string
  tagline: string
  about: string
  skills: string[]
  work_experience: Array<{
    company: string
    position: string
    date_range: string
    description: string
    location?: string
    tags?: string[]
    media_url?: string
  }>
  education: Array<{
    institution: string
    degree: string
    date_range: string
    description: string
  }>
  courses: Array<{
    name: string
    institution: string
    date_range: string
    description: string
  }>
  awards: Array<{
    name: string
    institution: string
    date_range: string
    description: string
  }>
  publications: Array<{
    title: string
    authors: string
    date_range: string
    description: string
  }>
  projects: Array<{
    name: string
    description: string
    start_date: string
    end_date: string
    tags?: string[]
    media_url?: string
  }>
  patents: Array<{
    title: string
    inventors: string
    date_range: string
    description: string
  }>
  test_scores: Array<{
    test: string
    score: string
    date_range: string
    description: string
  }>
  certifications: Array<{
    name: string
    institution: string
    date_range: string
    description: string
  }>
  profile_picture: string
  parsing_error: string
}

export default function DynamicPortfolio() {
  const router = useRouter()
  const { subdomain } = router.query
  const [loading, setLoading] = useState(true)
  const [portfolio, setPortfolio] = useState<any>(null)
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [templateId, setTemplateId] = useState(1)

  useEffect(() => {
    if (subdomain) {
      loadPortfolio()
    }
  }, [subdomain])

  const loadPortfolio = async () => {
    try {
      // Get portfolio by subdomain
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolios')
        .select(`
          *,
          resume_data (*)
        `)
        .eq('subdomain', subdomain)
        .eq('is_published', true)
        .single()

      if (portfolioError || !portfolioData) {
        router.push('/404')
        return
      }

      setPortfolio(portfolioData)
      
      if (portfolioData.resume_data && portfolioData.resume_data.length > 0) {
        const latestResumeData = portfolioData.resume_data[0]
        setResumeData(latestResumeData.final_json)
        setTemplateId(latestResumeData.template_id)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading portfolio:', error)
      router.push('/404')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading portfolio...</p>
        </div>
      </div>
    )
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Portfolio Not Found</h1>
          <p>This portfolio is not available or has been removed.</p>
        </div>
      </div>
    )
  }

  // Render the portfolio using the same template logic as the main portfolio page
  const renderTemplate = () => {
    switch (templateId) {
      case 2:
        return renderTemplateTwo()
      case 3:
        return renderDeveloper()
      case 4:
        return renderProfessional()
      case 1:
      default:
        return renderMinimal()
    }
  }

  // Template rendering functions (copied from portfolio.tsx)
  const renderMinimal = () => {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            {resumeData.profile_picture ? (
              <img
                src={resumeData.profile_picture}
                alt={resumeData.name}
                className="w-32 h-32 rounded-full mx-auto mb-6 object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-700 mx-auto mb-6 flex items-center justify-center text-4xl font-bold">
                {resumeData.name?.charAt(0) || 'U'}
              </div>
            )}
            <h1 className="text-5xl font-bold mb-4">{resumeData.name}</h1>
            <p className="text-xl text-gray-300 mb-6">{resumeData.tagline}</p>
            <p className="text-gray-400 max-w-2xl mx-auto">{resumeData.about}</p>
          </div>

          {/* Contact Info */}
          <div className="flex justify-center gap-6 mb-16">
            {resumeData.email && (
              <a href={`mailto:${resumeData.email}`} className="text-blue-400 hover:text-blue-300">
                {resumeData.email}
              </a>
            )}
            {resumeData.location && (
              <span className="text-gray-400">{resumeData.location}</span>
            )}
          </div>

          {/* Social Links */}
          <div className="flex justify-center gap-4 mb-16">
            {resumeData.linkedin && (
              <a href={resumeData.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                LinkedIn
              </a>
            )}
            {resumeData.github && (
              <a href={resumeData.github} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                GitHub
              </a>
            )}
            {resumeData.website && (
              <a href={resumeData.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                Website
              </a>
            )}
          </div>

          {/* Skills */}
          {resumeData.skills && resumeData.skills.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-center">Skills</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {resumeData.skills.map((skill, index) => (
                  <span key={index} className="bg-gray-800 px-4 py-2 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {resumeData.work_experience && resumeData.work_experience.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-center">Work Experience</h2>
              <div className="space-y-8">
                {resumeData.work_experience.map((job, index) => (
                  <div key={index} className="bg-gray-900 p-6 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold">{job.position}</h3>
                      <span className="text-gray-400 text-sm">{job.date_range}</span>
                    </div>
                    <p className="text-blue-400 mb-2">{job.company}</p>
                    {job.location && <p className="text-gray-400 text-sm mb-3">{job.location}</p>}
                    <p className="text-gray-300">{job.description}</p>
                    {job.tags && job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {job.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resumeData.projects && resumeData.projects.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-center">Projects</h2>
              <div className="space-y-8">
                {resumeData.projects.map((project, index) => (
                  <div key={index} className="bg-gray-900 p-6 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold">{project.name}</h3>
                      <span className="text-gray-400 text-sm">
                        {project.start_date} - {project.end_date}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-3">{project.description}</p>
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resumeData.education && resumeData.education.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-center">Education</h2>
              <div className="space-y-6">
                {resumeData.education.map((edu, index) => (
                  <div key={index} className="bg-gray-900 p-6 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold">{edu.degree}</h3>
                      <span className="text-gray-400 text-sm">{edu.date_range}</span>
                    </div>
                    <p className="text-blue-400 mb-2">{edu.institution}</p>
                    <p className="text-gray-300">{edu.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderTemplateTwo = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="relative inline-block mb-8">
              {resumeData.profile_picture ? (
                <img
                  src={resumeData.profile_picture}
                  alt={resumeData.name}
                  className="w-40 h-40 rounded-full object-cover border-4 border-blue-500 shadow-2xl"
                />
              ) : (
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mx-auto flex items-center justify-center text-6xl font-bold border-4 border-blue-500 shadow-2xl">
                  {resumeData.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-black"></div>
            </div>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {resumeData.name}
            </h1>
            <p className="text-2xl text-gray-300 mb-8">{resumeData.tagline}</p>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">{resumeData.about}</p>
          </div>

          {/* Contact & Social */}
          <div className="flex justify-center gap-8 mb-16">
            {resumeData.email && (
              <a href={`mailto:${resumeData.email}`} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                <span>Email</span>
              </a>
            )}
            {resumeData.linkedin && (
              <a href={resumeData.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                <span>LinkedIn</span>
              </a>
            )}
            {resumeData.github && (
              <a href={resumeData.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">
                <span>GitHub</span>
              </a>
            )}
          </div>

          {/* Skills */}
          {resumeData.skills && resumeData.skills.length > 0 && (
            <div className="mb-20">
              <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Skills & Technologies
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {resumeData.skills.map((skill, index) => (
                  <div key={index} className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-lg text-center hover:from-gray-700 hover:to-gray-600 transition-all duration-300">
                    <span className="font-medium">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {resumeData.work_experience && resumeData.work_experience.length > 0 && (
            <div className="mb-20">
              <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Professional Experience
              </h2>
              <div className="space-y-8">
                {resumeData.work_experience.map((job, index) => (
                  <div key={index} className="bg-gradient-to-r from-gray-800 to-gray-700 p-8 rounded-xl hover:from-gray-700 hover:to-gray-600 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-blue-400">{job.position}</h3>
                        <p className="text-xl text-gray-300">{job.company}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400">{job.date_range}</span>
                        {job.location && <p className="text-sm text-gray-500">{job.location}</p>}
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-4">{job.description}</p>
                    {job.tags && job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="bg-blue-900 text-blue-300 px-3 py-1 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resumeData.projects && resumeData.projects.length > 0 && (
            <div className="mb-20">
              <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Featured Projects
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {resumeData.projects.map((project, index) => (
                  <div key={index} className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl hover:from-gray-700 hover:to-gray-600 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-green-400">{project.name}</h3>
                      <span className="text-gray-400 text-sm">
                        {project.start_date} - {project.end_date}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-4">{project.description}</p>
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resumeData.education && resumeData.education.length > 0 && (
            <div className="mb-20">
              <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Education
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {resumeData.education.map((edu, index) => (
                  <div key={index} className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl text-center">
                    <h3 className="text-xl font-bold text-purple-400 mb-2">{edu.degree}</h3>
                    <p className="text-lg text-gray-300 mb-2">{edu.institution}</p>
                    <p className="text-gray-400 mb-3">{edu.date_range}</p>
                    <p className="text-gray-300 text-sm">{edu.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderDeveloper = () => {
    return renderMinimal() // Fallback to minimal for now
  }

  const renderProfessional = () => {
    return renderMinimal() // Fallback to minimal for now
  }

  return (
    <>
      {renderTemplate()}
      {/* Typefolio Badge */}
      <div className="fixed bottom-4 right-4 z-50">
        <a
          href="https://typefolio.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-800 hover:border-gray-600"
        >
          <img src="/Logo.png" alt="Typefolio" className="h-10 w-30" />
        </a>
      </div>
    </>
  )
} 