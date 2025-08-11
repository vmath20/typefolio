import type { NextApiRequest, NextApiResponse } from 'next'

interface FetchLogosRequest {
  companies: string[]
  institutions: string[]
}

interface FetchLogosResponse {
  companyLogos: Record<string, string | null>
  institutionLogos: Record<string, string | null>
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
    console.error('Error getting domain for organization:', err)
    return null
  }
}

async function getLogoForDomain(domain: string): Promise<string | null> {
  try {
    const url = `https://api.brandfetch.com/v2/brands/${domain}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${logoToken}`,
      },
    })

    if (!response.ok) {
      console.error(`Brandfetch API error for ${domain}:`, response.status)
      return null
    }

    const data = await response.json()
    const logos = data.logos || []
    
    // Find the best logo (prefer square/icon logos)
    const iconLogo = logos.find((logo: any) => 
      logo.type === 'icon' || logo.type === 'logo' || logo.type === 'symbol'
    )
    
    if (iconLogo && iconLogo.formats && iconLogo.formats.length > 0) {
      // Prefer PNG format
      const pngFormat = iconLogo.formats.find((format: any) => format.format === 'png')
      if (pngFormat) {
        return pngFormat.src
      }
      // Fall back to first available format
      return iconLogo.formats[0].src
    }

    return null
  } catch (err) {
    console.error('Error fetching logo for domain:', domain, err)
    return null
  }
}

async function fetchLogoForOrganization(orgName: string, context: string): Promise<string | null> {
  try {
    const domain = await getDomainForOrganization(orgName, context)
    if (!domain) {
      console.log(`No domain found for: ${orgName}`)
      return null
    }

    const logoUrl = await getLogoForDomain(domain)
    if (logoUrl) {
      console.log(`Found logo for ${orgName}: ${logoUrl}`)
    } else {
      console.log(`No logo found for domain: ${domain}`)
    }
    
    return logoUrl
  } catch (err) {
    console.error('Error fetching logo for organization:', orgName, err)
    return null
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FetchLogosResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { companies, institutions } = req.body as FetchLogosRequest

    if (!companies && !institutions) {
      return res.status(400).json({ error: 'No companies or institutions provided' })
    }

    const companyLogos: Record<string, string | null> = {}
    const institutionLogos: Record<string, string | null> = {}

    // Fetch logos for companies
    if (companies && companies.length > 0) {
      console.log('Fetching logos for companies:', companies)
      const companyPromises = companies.map(async (company) => {
        if (!company.trim()) return
        const logo = await fetchLogoForOrganization(company, `company: ${company}`)
        companyLogos[company] = logo
      })
      await Promise.all(companyPromises)
    }

    // Fetch logos for institutions
    if (institutions && institutions.length > 0) {
      console.log('Fetching logos for institutions:', institutions)
      const institutionPromises = institutions.map(async (institution) => {
        if (!institution.trim()) return
        const logo = await fetchLogoForOrganization(institution, `educational institution: ${institution}`)
        institutionLogos[institution] = logo
      })
      await Promise.all(institutionPromises)
    }

    console.log('Logo fetching completed:', {
      companies: Object.keys(companyLogos).length,
      institutions: Object.keys(institutionLogos).length
    })

    res.status(200).json({
      companyLogos,
      institutionLogos
    })
  } catch (error) {
    console.error('Error in fetch-logos API:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 