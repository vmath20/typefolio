import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

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

const API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyCvRpudIGCUNS2xpQ2tPoGzfrwwo-Y2_OE'
const CX = process.env.GOOGLE_CX || '448a1c437cdfe4731'
const OR_KEY = process.env.OPENROUTER_API_KEY
const logoToken = 'pk_PEzUIRNTScaVBfae7LqPUw&retina=true'

async function getDomainForOrganization(orgName: string, context: string): Promise<string | null> {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(orgName)}&num=3&fields=items(title,link,snippet)`
    const gRes = await fetch(url)
    const gData = await gRes.json()
    const items: Array<{ title: string; link: string; snippet: string }> = gData.items || []
    
    if (items.length === 0) return null

    // Use LLM to pick the best option
    const choices = items.map((it, i) => `(${i + 1}) ${it.link}  --  ${it.title}\n${it.snippet}`).join('\n\n')
    const prompt = `You are choosing the best company/university website given some resume context.\nContext: "${context}"\nOptions:\n${choices}\n\nRespond ONLY the number of the best matching option.`

    let bestIdx = 0
    if (OR_KEY) {
      const llm = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OR_KEY}`,
          'HTTP-Referer': 'https://typefolio.app',
          'X-Title': 'Logo domain picker',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3-0324',
          messages: [
            { role: 'system', content: 'Reply only with an integer.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0,
        }),
      })
      const llmJson = await llm.json()
      const content: string = llmJson.choices?.[0]?.message?.content || '1'
      const num = parseInt(content.trim(), 10)
      if (!isNaN(num) && num >= 1 && num <= items.length) bestIdx = num - 1
    }

    const link = items[bestIdx].link
    const domainMatch = link.match(/^https?:\/\/(?:www\.)?([^/]+)/i)
    return domainMatch ? domainMatch[1] : null
  } catch (err) {
    console.error('Error getting domain for', orgName, err)
    return null
  }
}

async function generateSummary(resumeJson: any): Promise<{ tagline: string; about: string }> {
  if (!OR_KEY) return { tagline: '', about: '' }

  try {
    const prompt = `Given the following structured JSON resume data, craft:\n1. A concise professional tagline (5-6 words max).\n2. A friendly first-person paragraph (~3-4 sentences) for an About section.\nReturn ONLY valid JSON with keys \`tagline\` and \`about\`.\n\nResume JSON:\n${JSON.stringify(resumeJson)}`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OR_KEY}`,
        'HTTP-Referer': 'https://typefolio.app',
        'X-Title': 'Typefolio Summary Generator',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(await response.text())
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'
    let clean = content.trim()
    
    // Remove code fences if present
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```[a-zA-Z]*\n?/,'').replace(/```$/,'')
    }
    
    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch {
      const match = clean.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          parsed = JSON.parse(match[0])
        } catch { /* ignore */ }
      }
    }
    
    if (!parsed || typeof parsed !== 'object') {
      parsed = { tagline: '', about: clean }
    }
    
    return { tagline: parsed.tagline || '', about: parsed.about || '' }
  } catch (err: any) {
    console.error('Error generating summary:', err)
    return { tagline: '', about: '' }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { resumeJson } = req.body as { resumeJson: ResumeData }
    if (!resumeJson) {
      return res.status(400).json({ error: 'resumeJson required' })
    }

      // Start with the original resume data
  const refinedResume: ResumeData = { ...resumeJson }

  // Migrate awards from string[] to object[] format if needed
  if (refinedResume.awards && Array.isArray(refinedResume.awards)) {
    refinedResume.awards = refinedResume.awards.map((award: any) => {
      if (typeof award === 'string') {
        return { name: award, description: '' }
      }
      return award
    }) as Array<{ name: string; description?: string }>
  }

  // Migrate test_scores from string[] to object[] format if needed
  if (refinedResume.test_scores && Array.isArray(refinedResume.test_scores)) {
    refinedResume.test_scores = refinedResume.test_scores.map((score: any) => {
      if (typeof score === 'string') {
        // Try to parse "SAT: 1500" or just use as test name with empty score
        const parts = score.split(':').map((p: string) => p.trim())
        if (parts.length === 2) {
          return { test_name: parts[0], score: parts[1] }
        }
        return { test_name: score, score: '' }
      }
      return score
    }) as Array<{ test_name: string; score: string }>
  }

  // Migrate certifications from string[] to object[] format if needed
  if (refinedResume.certifications && Array.isArray(refinedResume.certifications)) {
    refinedResume.certifications = refinedResume.certifications.map((cert: any) => {
      if (typeof cert === 'string') {
        return { name: cert, date_issued: '', link: '' }
      }
      return cert
    }) as Array<{ name: string; date_issued?: string; link?: string }>
  }

    // Generate tagline and about section
    try {
      const { tagline, about } = await generateSummary(resumeJson)
      refinedResume.tagline = tagline
      refinedResume.about = about
    } catch (summaryError) {
      console.error('Summary generation failed:', summaryError)
      // Continue with empty tagline/about if summary fails
      refinedResume.tagline = ''
      refinedResume.about = ''
    }

    // Get logos for work experience companies
    if (refinedResume.work_experience && refinedResume.work_experience.length > 0) {
      try {
        const workPromises = refinedResume.work_experience.map(async (exp, index) => {
          if (exp.company) {
            const domain = await getDomainForOrganization(exp.company, 'work experience at company')
            if (domain) {
              refinedResume.work_experience![index].logo_url = `https://img.logo.dev/${domain}?token=${logoToken}`
            }
          }
        })
        await Promise.all(workPromises)
      } catch (logoError) {
        console.error('Work experience logo fetch failed:', logoError)
        // Continue without logos if fetch fails
      }
    }

    // Get logos for education institutions
    if (refinedResume.education && refinedResume.education.length > 0) {
      try {
        const eduPromises = refinedResume.education.map(async (edu, index) => {
          if (edu.institution) {
            const domain = await getDomainForOrganization(edu.institution, 'educational institution university college')
            if (domain) {
              refinedResume.education![index].logo_url = `https://img.logo.dev/${domain}?token=${logoToken}`
            }
          }
        })
        await Promise.all(eduPromises)
      } catch (logoError) {
        console.error('Education logo fetch failed:', logoError)
        // Continue without logos if fetch fails
      }
    }

    // Try to get profile picture
    try {
      if (!refinedResume.profile_picture) {
        const profilePicture = await getProfilePicture(refinedResume.linkedin, refinedResume.email, refinedResume.name)
        if (profilePicture) {
          refinedResume.profile_picture = profilePicture
        }
      }
    } catch (error) {
      console.error('Error getting profile picture:', error)
      // Continue without profile picture
    }

    res.status(200).json(refinedResume)
  } catch (err: any) {
    console.error('Error refining resume:', err)
    res.status(500).json({ 
      error: err.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

async function getProfilePicture(linkedinUrl?: string, email?: string, name?: string): Promise<string | null> {
  // Try Gravatar first (most reliable)
  if (email) {
    try {
      const gravatarPicture = await getGravatarProfilePicture(email)
      if (gravatarPicture) return gravatarPicture
    } catch (error) {
      console.error('Gravatar profile picture fetch failed:', error)
    }
  }

  // Return null - will use initials in frontend
  return null
}





async function getGravatarProfilePicture(email: string): Promise<string | null> {
  try {
    // crypto is imported at the top of the file
    const emailHash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex')
    const gravatarUrl = `https://www.gravatar.com/avatar/${emailHash}?s=200&d=404`
    
    // Check if Gravatar exists
    const response = await fetch(gravatarUrl, { method: 'HEAD' })
    if (response.ok && response.status === 200) {
      // Fetch the actual image and convert to base64
      const imageResponse = await fetch(gravatarUrl)
      if (imageResponse.ok) {
        const buffer = await imageResponse.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        console.log(`Gravatar profile picture found for: ${email}`)
        return `data:image/jpeg;base64,${base64}`
      }
    }
    
    return null
  } catch (error) {
    console.error('Gravatar profile picture error:', error)
    return null
  }
} 