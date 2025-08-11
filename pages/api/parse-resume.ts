import type { NextApiRequest, NextApiResponse } from 'next'

interface ParseRequestBody {
  dataUrl: string
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // increase if needed to handle large PDFs
    },
  },
}

async function callMistralOCR(base64Pdf: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY || process.env['MISTRAL_API_KEY ']?.trim() || process.env[' MISTRAL_API_KEY']?.trim()
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY not set')
  }

  // Per Mistral OCR docs, POST https://api.mistral.ai/v1/ocr with a "document" object
  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'document_url',
        document_url: `data:application/pdf;base64,${base64Pdf}`,
      },
      include_image_base64: false,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Mistral OCR failed: ${errorText}`)
  }

  const ocrJson = await response.json()
  // The OCR response contains pages array with markdown property
  const pages: Array<{ markdown?: string }> = ocrJson.pages ?? []
  const fullText = pages.map((p) => p.markdown || '').join('\n\n')
  return fullText.trim()
}

async function callDeepseekParser(resumeText: string): Promise<any> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env['OPENROUTER_API_KEY ']?.trim() || process.env[' OPENROUTER_API_KEY']?.trim()
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY environment variable not set')
    throw new Error('API configuration error - OPENROUTER_API_KEY not set')
  }

  console.log('Using API key:', apiKey.substring(0, 10) + '...', 'Length:', apiKey.length)

  const prompt = `You are an AI assistant that converts resume text into structured JSON. Return ONLY a valid, minified JSON object with the keys described below (no comments, no extra keys). If some sub-fields are missing in the text leave them empty or omit that sub-field, but still include the parent object if the primary name exists. If the resume has no explicit skills list, infer 5-10 relevant skills from the education and work experience.

IMPORTANT EXTRACTION RULES:
1. LOCATION: Look for the person's location at the top of the resume (usually near name/contact info). Common formats: "City, State", "City, Country", "Remote", "Hybrid", "City, State (Remote)".
2. COMPANY LOCATION: For work experience, extract company location if mentioned. Look for location info near company name or in job description. Can be "Remote", "Hybrid", "City, State", or "City, Country".
3. PROJECT DATES: For projects section, extract date ranges if mentioned (e.g., "Jan 2024 - Mar 2024", "2023", "Summer 2024").
4. LINKS: ONLY extract basic social profile links (email, LinkedIn, GitHub, Twitter, Instagram, Facebook, Devpost, Google Scholar, YouTube). DO NOT extract any other links from the resume (no project links, no company websites, no publication links, etc.).

Keys:
name                       : string
email                      : string
phone                      : string
location                   : string (person's location - look at top of resume)

linkedin                   : string (full URL - only if explicitly provided)
github                     : string (full URL - only if explicitly provided)
twitter                    : string (full URL - only if explicitly provided)
instagram                  : string (full URL - only if explicitly provided)
facebook                   : string (full URL - only if explicitly provided)
devpost                    : string (full URL - only if explicitly provided)
scholar                    : string (full URL to Google Scholar - only if explicitly provided)
youtube                    : string (full URL - only if explicitly provided)

skills                     : string[]

work_experience            : [{
  company                  : string,
  title                    : string,
  start_date               : string, // e.g. "Dec 2024"
  end_date                 : string, // e.g. "Present" or "Feb 2025"
  description              : string,
  location                 : string, // company location: "Remote", "Hybrid", "City, State", etc.
  tags                     : string[] // relevant skills/technologies used at this company
}]

education                  : [{
  institution              : string,
  degree                   : string,
  start_date               : string,
  end_date                 : string,
  gpa                      : string,
  activities               : string
}]

projects                   : [{
  name                     : string,
  description              : string,
  start_date               : string, // e.g. "Jan 2024"
  end_date                 : string, // e.g. "Mar 2024" or "Present"
  tags                     : string[], // relevant skills/technologies used in this project
  links                    : string[] // ONLY social profile links, no project/company links
}]

publications               : [{
  name                     : string,
  journal                  : string,
  year                     : string,
  authors                  : string,
  link                     : string
}]

patents                    : [{
  name                     : string,
  inventors                : string,
  number                   : string,
  link                     : string
}]

awards                     : [{
  name                     : string,
  description              : string (optional)
}]

test_scores                : [{
  test_name                : string,
  score                    : string
}]

certifications             : [{
  name                     : string,
  date_issued              : string (optional),
  link                     : string (optional)
}]

languages                  : string[]
courses                    : string[]

Resume text follows:\n\n${resumeText}`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://typefolio.app', // optional but recommended by OpenRouter
      'X-Title': 'Typefolio Resume Parser',
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat-v3-0324',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Deepseek API error:', response.status, errorText)
    throw new Error(`Deepseek parsing failed: ${response.status} ${errorText}`)
  }

  // Get response text first to check if it's valid
  const responseText = await response.text()
  console.log('Deepseek response text:', responseText.substring(0, 200) + '...')
  
  if (!responseText.trim()) {
    throw new Error('Deepseek returned empty response')
  }

  let data
  try {
    data = JSON.parse(responseText)
  } catch (jsonError) {
    console.error('Failed to parse Deepseek response as JSON:', jsonError)
    console.error('Response text:', responseText)
    throw new Error(`Invalid JSON response from Deepseek: ${jsonError}`)
  }

  const content = data.choices?.[0]?.message?.content ?? '{}'
  console.log('Extracted content:', content.substring(0, 200) + '...')
  
  if (!content.trim()) {
    throw new Error('Deepseek returned empty content')
  }

  try {
    return JSON.parse(content)
  } catch (contentError) {
    console.error('Failed to parse content as JSON:', contentError)
    console.error('Content:', content)
    
    // if the content is not pure JSON, try to extract JSON substring
    const match = content.match(/\{[\s\S]*\}/)
    if (match) {
      try {
      return JSON.parse(match[0])
      } catch (matchError) {
        console.error('Failed to parse matched JSON:', matchError)
        console.error('Matched content:', match[0])
      }
    }
    throw new Error(`Failed to parse JSON from deepseek response: ${contentError}`)
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  try {
    const { dataUrl } = req.body as ParseRequestBody
    if (!dataUrl) {
      return res.status(400).json({ error: 'dataUrl is required' })
    }

    // Strip the data URL prefix to get base64 string only
    const base64Pdf = dataUrl.split(',')[1]

    const parsedText = await callMistralOCR(base64Pdf)
    
    // Parse text to JSON using deepseek with retry logic
    let extractedJson
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        extractedJson = await callDeepseekParser(parsedText)
        break // Success, exit retry loop
      } catch (error: any) {
        attempts++
        console.error(`Parse attempt ${attempts} failed:`, error.message)
        
        if (attempts >= maxAttempts) {
          // If all attempts failed, return a basic structure
          console.error('All parsing attempts failed, returning basic structure')
          extractedJson = {
            name: 'Please edit manually',
            email: '',
            phone: '',
            location: '',
            skills: [],
            work_experience: [],
            education: [],
            parsing_error: 'AI parsing failed - data extracted from text but needs manual editing'
          }
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
        }
      }
    }

    return res.status(200).json({ parsedText, extractedJson })
  } catch (error: any) {
    console.error('Parse resume error:', error)
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      parsedText: null,
      extractedJson: {
        name: 'Error parsing resume',
        email: '',
        parsing_error: 'Failed to process resume - please try uploading again'
      }
    })
  }
} 