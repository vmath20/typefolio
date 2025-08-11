import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import clsx from 'clsx'
import { supabase } from '../lib/supabase'

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

  projects?: Array<{ name: string; description?: string; start_date?: string; end_date?: string; tags?: string[]; links?: string[]; media_url?: string }>
  publications?: Array<{ name: string; journal?: string; year?: string; authors?: string; link?: string }>
  patents?: Array<{ name: string; inventors?: string; number?: string; link?: string }>
  work_experience?: Array<{ 
    company: string; 
    title: string; 
    dates?: string; 
    start_date?: string; 
    end_date?: string; 
    description?: string;
    location?: string;
    tags?: string[];
    logo_url?: string;
    media_url?: string;
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
  
  // LLM-generated fields
  tagline?: string
  about?: string
}

export default function Portfolio() {
  const [data, setData] = useState<ResumeData | null>(null)
  const router = useRouter()
  
  // Get selected template from sessionStorage, default to 1
  const [selectedTemplate, setSelectedTemplate] = useState(1)
  
  // no external avatar needed

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get selected template from sessionStorage
      const templateId = sessionStorage.getItem('selectedTemplate')
      if (templateId) {
        setSelectedTemplate(parseInt(templateId, 10))
      }
      
      // First try to get the enhanced/refined version
      const refinedRaw = sessionStorage.getItem('refinedResumeJson')
      if (refinedRaw) {
        try {
          setData(JSON.parse(refinedRaw))
          return
        } catch {
          // Fall through to basic version
        }
      }

      // Fall back to basic version if refined is not available
      const raw = sessionStorage.getItem('resumeJson')
      if (raw) {
        try {
          setData(JSON.parse(raw))
        } catch {
          // if parse fails redirect back
          router.push('/')
        }
      } else {
        router.push('/')
      }
    }
  }, [router])

  if (!data) return null

  // ----- date formatting helpers -----
  const formatOne = (str: string): string => {
    if (!str) return ''
    if (/present/i.test(str.trim())) return 'Present'
    const parsed = Date.parse(str)
    if (!isNaN(parsed)) {
      const d = new Date(parsed)
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
    const ym = str.trim().match(/^(\d{4})-(\d{2})/)
    if (ym) {
      const yy = parseInt(ym[1])
      const mm = parseInt(ym[2]) - 1
      const d = new Date(yy, mm, 1)
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
    if (/^\d{4}$/.test(str.trim())) return str.trim()
    return str
  }

  const formatRange = (range: string): string => {
    if (!range) return ''
    const parts = range.split(/\s*-\s*/)
    if (parts.length === 2) {
      return `${formatOne(parts[0])} - ${formatOne(parts[1])}`
    }
    return formatOne(range)
  }

  const Container = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={clsx('mx-auto max-w-3xl p-6', className)}>{children}</div>
  )

  const Collapsible: React.FC<{ title: React.ReactNode; children?: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen)
    return (
      <section className="mb-8">
        <button className="flex w-full items-center justify-between text-left" onClick={() => setOpen(!open)}>
          <h2 className="text-xl font-bold lowercase">{title}</h2>
          <span className="text-2xl">{open ? '−' : '☰'}</span>
        </button>
        {open && <div className="mt-4">{children}</div>}
      </section>
    )
  }

  const renderMinimal = () => (
    <Container className="font-sans text-gray-800">
      {mainContent}
    </Container>
  )

  // Template 2: Clean white, card-based layout inspired by the provided screenshots
  const renderTemplateTwo = () => {
    const initials = (data.name || '')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()

    const formatDatesForExp = (exp: NonNullable<ResumeData['work_experience']>[number]) => {
      if (exp.start_date || exp.end_date) {
        return formatRange(`${exp.start_date ?? ''} - ${exp.end_date ?? 'Present'}`)
      }
      return formatRange(exp.dates || '')
    }

    const linkLabel = (url: string): string => {
      try {
        const u = new URL(url)
        return u.hostname.replace('www.', '')
      } catch {
        return url
      }
    }

    const primaryProjectLink = (proj: NonNullable<ResumeData['projects']>[number]) => {
      if (!proj.links || proj.links.length === 0) return null
      // Prefer GitHub links if present
      const github = proj.links.find((l) => /github\.com/i.test(l))
      return github || proj.links[0]
    }

    return (
      <div className="bg-white text-gray-900">
        <div className="mx-auto max-w-5xl px-6 py-10">
          {/* Header */}
          <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-12 sm:col-span-9 flex items-center gap-5">
              {/* Avatar */}
              {data.profile_picture ? (
                <img
                  src={data.profile_picture}
                  alt={data.name || 'Profile'}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl font-semibold">
                  {initials || 'U'}
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold">{data.name}</h1>
                {data.tagline && (
                  <p className="text-gray-500 text-sm sm:text-base">{data.tagline}</p>
                )}
              </div>
            </div>
            <div className="col-span-12 sm:col-span-3 text-sm text-gray-600 sm:text-right">
              {data.location}
            </div>
          </div>

          {/* About / Summary */}
          {data.about && (
            <div className="mt-8 sm:w-3/4 text-gray-800 leading-7">
              <p>{data.about}</p>
            </div>
          )}

          {/* Contact Links */}
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-gray-600">
            {data.email && (
              <a href={`mailto:${data.email}`} className="hover:underline">Email</a>
            )}
            {data.linkedin && (
              <a href={data.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">LinkedIn</a>
            )}
            {data.github && (
              <a href={data.github} target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>
            )}
            {data.twitter && (
              <a href={data.twitter} target="_blank" rel="noopener noreferrer" className="hover:underline">X</a>
            )}
          </div>

          {/* Experience */}
          {data.work_experience && data.work_experience.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-semibold mb-4">Experience</h2>
              <div className="space-y-8">
                {data.work_experience.map((exp, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 sm:col-span-9">
                      <div className="flex items-start gap-3">
                        <Logo name={exp.company} logoUrl={exp.logo_url} />
                        <div>
                          <div className="font-medium">{exp.company}</div>
                          <div className="text-sm text-gray-600">{exp.title}</div>
                        </div>
                      </div>
                      {exp.description && (
                        <p className="mt-3 text-gray-700 leading-7 whitespace-pre-wrap">{exp.description}</p>
                      )}
                      {makeDomain(exp.company) && (
                        <div className="mt-2 text-sm">
                          <a
                            href={`https://${makeDomain(exp.company)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            → {makeDomain(exp.company)}
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="col-span-12 sm:col-span-3 text-sm text-gray-600 sm:text-right">
                      <div>{formatDatesForExp(exp)}</div>
                      {data.location && <div>{data.location}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {data.projects && data.projects.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-semibold mb-6">Technical Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.projects.map((proj, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl">📦</div>
                      <div>
                        <div className="font-medium">{proj.name}</div>
                        {proj.description && (
                          <div className="text-sm text-gray-600 mt-1 line-clamp-4">{proj.description}</div>
                        )}
                      </div>
                    </div>

                    {/* Links */}
                    <div className="mt-4 flex flex-wrap gap-4 text-sm">
                      {proj.links?.map((l, linkIdx) => (
                        <a
                          key={linkIdx}
                          href={l}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {linkLabel(l)}
                        </a>
                      ))}
                      {!proj.links?.length && primaryProjectLink(proj) && (
                        <a
                          href={primaryProjectLink(proj)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {linkLabel(primaryProjectLink(proj)!)}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-semibold mb-4">Education</h2>
              <div className="space-y-6">
                {data.education.map((edu, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-12 sm:col-span-9 flex items-start gap-3">
                      <Logo name={edu.institution} logoUrl={edu.logo_url} />
                      <div>
                        <div className="font-medium">{edu.institution}</div>
                        <div className="text-sm text-gray-600">{edu.degree}</div>
                        {edu.activities && (
                          <div className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{edu.activities}</div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-12 sm:col-span-3 text-sm text-gray-600 sm:text-right">
                      {edu.start_date || edu.end_date ? (
                        <div>{formatRange(`${edu.start_date ?? ''} - ${edu.end_date ?? ''}`)}</div>
                      ) : (
                        edu.dates && <div>{formatRange(edu.dates)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    )
  }

  const renderCreative = () => {
    const initials = (data.name || '')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()

    const displayName = () => {
      const parts = (data.name || '').trim().split(' ').filter(Boolean)
      if (parts.length > 3) return `${parts[0]} ${parts[parts.length - 1]}`
      return data.name || ''
    }

    return (
      <Container className="font-sans text-gray-900">
        {/* Hero */}
        <section className="mb-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-5xl font-extrabold leading-tight">
              hi, i'm {displayName().toLowerCase()} <span className="inline-block">👋</span>
            </h1>
            {data.tagline && <p className="mt-3 text-lg text-gray-600">{data.tagline}</p>}
            {!data.tagline && data.location && (
              <p className="mt-3 text-lg text-gray-600">{data.location}</p>
            )}
          </div>
          <div
            className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-300 text-4xl font-bold text-white"
            style={{ fontFamily: '"Trajan Pro 3", "Trajan Pro", Trajan, serif' }}
          >
            {initials}
          </div>
        </section>

        {/* Collapsible Sections (reuse logic) */}
        {data.about && (
          <Collapsible title="About">
            <p className="text-gray-700 whitespace-pre-wrap">{data.about}</p>
          </Collapsible>
        )}

        {data.work_experience && data.work_experience.length > 0 && renderExperienceList()}

        {data.education && data.education.length > 0 && renderEducationList()}

        {data.projects && data.projects.length > 0 && (
          <Collapsible title="Projects">
            <ul className="list-disc pl-5 text-sm text-gray-700">
              {data.projects.map((proj, idx) => (
                <li key={idx}>{proj.name}</li>
              ))}
            </ul>
          </Collapsible>
        )}

        {/* Additional sections reuse existing logic by rendering mainContent pieces we already added above */}

        {data.awards && data.awards.length > 0 && (
          <Collapsible title="Awards">
            <ul className="list-disc pl-5 text-sm text-gray-700">
              {data.awards.map((a, idx) => (
                <li key={idx}>
                  <div className="font-medium">{a.name}</div>
                  {a.description && <div className="text-xs text-gray-600 mt-1">{a.description}</div>}
                </li>
              ))}
            </ul>
          </Collapsible>
        )}

        {data.publications && data.publications.length > 0 && (
          <Collapsible title="Publications">
            <ul className="list-disc pl-5 text-sm text-gray-700">
              {data.publications.map((p, idx) => (
                <li key={idx}>{p.name}</li>
              ))}
            </ul>
          </Collapsible>
        )}

        {/* Contact */}
        <section className="my-10 text-center">
          <h2 className="mb-4 text-3xl font-bold lowercase">get in touch</h2>
          {data.email && (
            <p className="text-gray-700">
              want to chat? email me at{' '}
              <a href={`mailto:${data.email}`} className="text-blue-600 underline">
                {data.email}
              </a>
            </p>
          )}
          <SocialLinks />
        </section>
      </Container>
    )
  }

  const renderDeveloper = () => (
    <Container className="font-mono text-gray-200 bg-gray-900 min-h-screen">
      {mainContent}
    </Container>
  )

  const renderProfessional = () => (
    <Container className="font-sans text-gray-800">
      <div className="grid gap-8 md:grid-cols-2">
        {mainContent}
      </div>
    </Container>
  )

  // Publish Button Component
  const PublishButton = () => {
    const handlePublish = () => {
      // Redirect to publish page
      window.location.href = '/publish'
    }

    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handlePublish}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors duration-200 font-medium"
        >
          Publish Site
        </button>
      </div>
    )
  }

  // Typefolio Badge Component
  const TypefolioBadge = () => (
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
  )

  const chooseRender = () => {
    const templateContent = (() => {
      switch (selectedTemplate) {
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
    })()

    return (
      <>
        {templateContent}
        <PublishButton />
        <TypefolioBadge />
      </>
    )
  }

  const renderExperienceList = () => (
    <Collapsible title="Experience">
      <div className="space-y-4">
        {data.work_experience?.map((exp, idx) => (
          <Collapsible
            key={idx}
            title={
              <div className="flex items-center gap-3">
                <Logo name={exp.company} logoUrl={exp.logo_url} />
                <div>
                  <span className="font-semibold">{exp.company}</span>
                  {(exp.start_date || exp.dates) && (
                    <span className="ml-2 text-sm text-gray-500">
                      {exp.start_date ? formatRange(`${exp.start_date} - ${exp.end_date ?? ''}`) : formatRange(exp.dates || '')}
                    </span>
                  )}
                  <div className="text-sm font-normal text-gray-700">{exp.title}</div>
                </div>
              </div>
            }
            defaultOpen={false}
          >
            {exp.description && (
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{exp.description}</p>
            )}
          </Collapsible>
        ))}
      </div>
    </Collapsible>
  )

  // after date helpers define icon components and SocialLinks
  const IconLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600">
      {children}
    </a>
  )

  const LinkedInIcon = () => (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4V24h-4V8zm7.5 0h3.8v2.16h.05c.53-1 1.83-2.16 3.77-2.16 4.03 0 4.78 2.65 4.78 6.09V24h-4V14.25c0-2.32-.04-5.31-3.25-5.31-3.25 0-3.75 2.54-3.75 5.16V24h-4V8z"/></svg>
  )

  const GitHubIcon = () => (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.11.793-.26.793-.577v-2.234c-3.338.726-4.033-1.61-4.033-1.61-.546-1.387-1.332-1.756-1.332-1.756-1.09-.744.082-.729.082-.729 1.205.086 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.305 3.492.998.107-.774.418-1.305.762-1.605-2.665-.305-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.536-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.52 11.52 0 0 1 3.003-.404 11.54 11.54 0 0 1 3.003.404c2.29-1.552 3.295-1.23 3.295-1.23.655 1.653.243 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.807 5.624-5.48 5.92.43.37.823 1.096.823 2.21v3.293c0 .32.192.694.8.576C20.565 21.796 24 17.297 24 12 24 5.37 18.63 0 12 0z"/></svg>
  )

  const MailIcon = () => (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
  )

  const TwitterIcon = () => (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.27 4.27 0 0 0 1.88-2.37 8.63 8.63 0 0 1-2.72 1.04A4.24 4.24 0 0 0 16.11 4c-2.36 0-4.28 1.92-4.28 4.29 0 .34.04.67.11.99-3.56-.18-6.72-1.88-8.84-4.46a4.27 4.27 0 0 0-.58 2.16c0 1.49.76 2.8 1.92 3.57-.71-.02-1.37-.22-1.95-.54v.05c0 2.08 1.48 3.82 3.45 4.21-.36.1-.74.15-1.13.15-.27 0-.55-.03-.81-.08.55 1.72 2.14 2.97 4.04 3-.37.29-.82.46-1.3.46-.32 0-.63-.03-.93-.09.64 2 2.5 3.47 4.7 3.52A8.52 8.52 0 0 1 2 19.54a12.06 12.06 0 0 0 6.52 1.91c7.83 0 12.1-6.48 12.1-12.1l-.01-.55A8.54 8.54 0 0 0 24 5.1a8.67 8.67 0 0 1-2.54.7z"/></svg>
  )

  const GenericIcon = () => (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /></svg>
  )

  const YouTubeIcon = () => (<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 15l5.19-3L10 9v6zm12-3c0-1.17-.1-2.3-.3-3.41-.18-1.06-.45-2.01-1.31-2.87-.87-.87-1.82-1.14-2.88-1.32C15.3 4.1 14.17 4 13 4H7c-1.17 0-2.3.1-3.41.3-1.06.18-2.01.45-2.87 1.31-.87.87-1.14 1.82-1.32 2.88.2-1.11.3-2.24.3-3.41z"/></svg>)

  const SocialLinks = () => {
    const links: Array<{ icon: React.ReactNode; href: string }> = []
    if (data.linkedin) links.push({ icon: <LinkedInIcon />, href: data.linkedin })
    if (data.github) links.push({ icon: <GitHubIcon />, href: data.github })
    if (data.email) links.push({ icon: <MailIcon />, href: `mailto:${data.email}` })
    if (data.twitter) links.push({ icon: <TwitterIcon />, href: data.twitter })
    if (data.instagram) links.push({ icon: <GenericIcon />, href: data.instagram })
    if (data.facebook) links.push({ icon: <GenericIcon />, href: data.facebook })
    if (data.devpost) links.push({ icon: <GenericIcon />, href: data.devpost })
    if (data.scholar) links.push({ icon: <GenericIcon />, href: data.scholar })
    if (data.youtube) links.push({ icon: <YouTubeIcon />, href: data.youtube })
    return (
      <div className="mt-4 flex justify-center gap-4">
        {links.map((l, idx) => (
          <IconLink key={idx} href={l.href}>
            {l.icon}
          </IconLink>
        ))}
      </div>
    )
  }

  // after date helpers
  const makeDomain = (name: string): string | null => {
    if (!name) return null
    const cleaned = name.trim().toLowerCase()
    // simple heuristic mappings
    const map: Record<string, string> = {
      google: 'google.com',
      microsoft: 'microsoft.com',
      facebook: 'facebook.com',
      meta: 'meta.com',
      amazon: 'amazon.com',
      apple: 'apple.com',
      stanford: 'stanford.edu',
      mit: 'mit.edu',
    }
    const first = cleaned.split(/\s+/)[0]
    if (map[first]) return map[first]
    // default to .com
    return `${first}.com`
  }

  const logoToken = 'pk_PEzUIRNTScaVBfae7LqPUw&retina=true'
  const defaultLogo = `https://img.logo.dev/logo.dev?token=${logoToken}`

  const Logo = ({ name, logoUrl }: { name: string; logoUrl?: string }) => {
    const [domain, setDomain] = useState<string | null>(null)
    const [err, setErr] = useState(false)

    useEffect(() => {
      // If we already have a logo URL, don't fetch domain
      if (logoUrl) return

      fetch('/api/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: name, context: 'resume' })
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => setDomain(d.domain))
        .catch(() => setDomain(null))
    }, [name, logoUrl])

    // Use pre-fetched logo URL if available
    if (logoUrl && !err) {
      return (
        <img
          src={logoUrl}
          onError={() => setErr(true)}
          className="h-10 w-10 rounded-full object-contain bg-white"
          alt={name}
        />
      )
    }

    if (err || !domain) return (
      <img src={defaultLogo} className="h-10 w-10 rounded-full object-contain bg-white" alt={name} />
    )
    return (
      <img
        src={`https://img.logo.dev/${domain}?token=${logoToken}`}
        onError={() => setErr(true)}
        className="h-10 w-10 rounded-full object-contain bg-white"
        alt={name}
      />
    )
  }

  // Build mainContent using existing JSX sections
  const mainContent = (
    <>
      {/* header */}
      <header className="mb-10 text-center">
        {/* Profile Picture */}
        <div className="mb-6 flex justify-center">
          {data.profile_picture ? (
            <img 
              src={data.profile_picture} 
              alt={data.name || 'Profile'}
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-400 flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-200 shadow-lg">
              {(data.name || 'U').split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          )}
        </div>
        <h1 className="text-4xl font-extrabold">{data.name}</h1>
        {data.location && <p className="mt-2 text-sm text-gray-500">{data.location}</p>}
        <div className="mt-2 flex flex-wrap justify-center gap-4 text-sm text-blue-600">
          {data.email && <a href={`mailto:${data.email}`}>{data.email}</a>}
          {data.linkedin && (
            <a href={data.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          )}
          {data.github && (
            <a href={data.github} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          )}
        </div>
      </header>

      {/* skills */}
      {data.skills && data.skills.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-2xl font-semibold">Skills</h2>
          <ul className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <li key={skill} className="rounded bg-gray-200 px-2 py-1 text-sm">
                {skill}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* experience */}
      {data.work_experience && data.work_experience.length > 0 && renderExperienceList()}

      {/* projects */}
      {data.projects && data.projects.length > 0 && (
        <Collapsible title="Projects">
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {data.projects.map((proj, idx) => (
              <li key={idx}>{proj.name}</li>
            ))}
          </ul>
        </Collapsible>
      )}

      {/* education */}
      {data.education && data.education.length > 0 && renderEducationList()}

      {/* publications */}
      {data.publications && data.publications.length > 0 && (
        <Collapsible title="Publications">
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {data.publications.map((paper, idx) => (
              <li key={idx}>{paper.name}</li>
            ))}
          </ul>
        </Collapsible>
      )}

      {data.about && (
        <Collapsible title="About">
          <p className="text-gray-700 whitespace-pre-wrap">{data.about}</p>
        </Collapsible>
      )}

      {data.awards && data.awards.length > 0 && (
        <Collapsible title="Awards">
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {data.awards.map((a, idx) => (
              <li key={idx}>
                <div className="font-medium">{a.name}</div>
                {a.description && <div className="text-xs text-gray-600 mt-1">{a.description}</div>}
              </li>
            ))}
          </ul>
        </Collapsible>
      )}

      {data.patents && data.patents.length > 0 && (
        <Collapsible title="Patents">
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {data.patents.map((p, idx) => (
              <li key={idx}>{p.name}</li>
            ))}
          </ul>
        </Collapsible>
      )}

      {data.test_scores && data.test_scores.length > 0 && (
        <Collapsible title="Test Scores">
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {data.test_scores.map((s, idx) => (
              <li key={idx}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{s.test_name}</span>
                  <span className="text-gray-600">{s.score}</span>
                </div>
              </li>
            ))}
          </ul>
        </Collapsible>
      )}

      {data.courses && data.courses.length > 0 && (
        <Collapsible title="Courses">
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {data.courses.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </Collapsible>
      )}

      {data.certifications && data.certifications.length > 0 && (
        <Collapsible title="Certifications">
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {data.certifications.map((cert, idx) => (
              <li key={idx}>
                <div className="font-medium">{cert.name}</div>
                {cert.date_issued && <div className="text-xs text-gray-600 mt-1">Issued: {cert.date_issued}</div>}
                {cert.link && <a href={cert.link} className="text-xs text-blue-600 hover:underline mt-1 block" target="_blank" rel="noopener noreferrer">View Certificate</a>}
              </li>
            ))}
          </ul>
        </Collapsible>
      )}
    </>
  )

  // after renderExperienceList helper define education
  function renderEducationList() {
    return (
      <Collapsible title="Education">
        <div className="space-y-4">
          {data!.education?.map((edu, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <Logo name={edu.institution} logoUrl={edu.logo_url} />
              <div>
                <span className="font-semibold">{edu.institution}</span>
                {edu.start_date ? (
                  <span className="ml-2 text-sm text-gray-500">
                    {formatRange(`${edu.start_date} - ${edu.end_date ?? ''}`)}
                  </span>
                ) : (
                  edu.dates && (
                    <span className="ml-2 text-sm text-gray-500">{formatRange(edu.dates)}</span>
                  )
                )}
                <div className="text-sm text-gray-700">{edu.degree}</div>
                {edu.gpa && <div className="text-sm text-gray-500">GPA: {edu.gpa}</div>}
                {edu.activities && (
                  <div className="text-sm text-gray-500 whitespace-pre-wrap">{edu.activities}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Collapsible>
    )
  }

  // update contact sections to include SocialLinks.
  return chooseRender()
} 