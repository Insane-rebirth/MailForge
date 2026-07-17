export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface GenerateEmailRequest {
  prospectName: string
  prospectCompany: string
  prospectJobTitle?: string
  prospectCompanyDescription?: string
  productName: string
  productDescription: string
  productBenefits?: string[]
  tone: 'professional' | 'friendly' | 'casual'
  length: 'short' | 'medium' | 'long'
  userId?: string
}

interface ValidationError {
  field: string
  message: string
}

const quotaByTier: Record<string, number> = {
  free: 20,
  pro: 500,
  business: Infinity
}

const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Service unavailable'
          }
        },
        { status: 503 }
      )
    }
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to generate emails.',
            loginUrl: '/login'
          }
        },
        { status: 401 }
      )
    }

    const body = await request.json() as GenerateEmailRequest

    const validationErrors = validateRequest(body)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields',
            details: validationErrors
          }
        },
        { status: 400 }
      )
    }

    const quotaResult = await checkQuota(user.id)
    if (!quotaResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: 'Monthly quota exceeded. Please upgrade your plan.',
            upgradeUrl: '/pricing'
          }
        },
        { status: 403 }
      )
    }
    const remainingQuota = quotaResult.remainingQuota

    const prompt = buildPrompt(body)
    
    const aiResponse = await callDeepSeekAPI(prompt)
    
    if (!aiResponse.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'GENERATION_FAILED',
            message: aiResponse.error || 'Failed to generate email. Please try again.'
          }
        },
        { status: 500 }
      )
    }

    const { subject, body: emailBody } = aiResponse.data

    await saveEmailHistory(user.id, body, subject, emailBody)

    return NextResponse.json({
      success: true,
      data: {
        subject,
        body: emailBody
      },
      remainingQuota
    })

  } catch (error) {
    console.error('Error generating email:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: 'Failed to generate email. Please try again.'
        }
      },
      { status: 500 }
    )
  }
}

function validateRequest(body: GenerateEmailRequest): ValidationError[] {
  const errors: ValidationError[] = []

  if (!body.prospectName?.trim()) {
    errors.push({ field: 'prospectName', message: 'Prospect name is required' })
  }
  if (!body.prospectCompany?.trim()) {
    errors.push({ field: 'prospectCompany', message: 'Company name is required' })
  }
  if (!body.productName?.trim()) {
    errors.push({ field: 'productName', message: 'Product name is required' })
  }
  if (!body.productDescription?.trim()) {
    errors.push({ field: 'productDescription', message: 'Product description is required' })
  }

  if (body.tone && !['professional', 'friendly', 'casual'].includes(body.tone)) {
    errors.push({ field: 'tone', message: 'Invalid tone value' })
  }
  if (body.length && !['short', 'medium', 'long'].includes(body.length)) {
    errors.push({ field: 'length', message: 'Invalid length value' })
  }

  return errors
}

async function checkQuota(userId: string) {
  const supabase = await createClient()
  if (!supabase) {
    return { success: true, remainingQuota: 20 }
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('subscription_tier, emails_used_this_month')
    .eq('id', userId)
    .limit(1)

  if (error || !profiles?.[0]) {
    console.error('Error fetching profile:', error)
    return { success: true, remainingQuota: 20 }
  }

  const profile = profiles[0]
  const quota = quotaByTier[profile.subscription_tier] || 20
  
  if (quota === Infinity) {
    return { success: true, remainingQuota: Infinity }
  }

  const remainingQuota = quota - profile.emails_used_this_month
  
  if (remainingQuota <= 0) {
    return { success: false, remainingQuota: 0 }
  }

  return { success: true, remainingQuota }
}

function buildPrompt(body: GenerateEmailRequest): string {
  const {
    prospectName,
    prospectCompany,
    prospectJobTitle,
    prospectCompanyDescription,
    productName,
    productDescription,
    productBenefits,
    tone = 'professional',
    length = 'medium'
  } = body

  const benefitsList = productBenefits?.filter(b => b.trim()).length
    ? productBenefits.map(b => `- ${b.trim()}`).join('\n')
    : 'Not specified'

  const lengthDescription = {
    short: '50-80 words',
    medium: '100-150 words',
    long: '200+ words'
  }

  return `You are an expert B2B sales copywriter with 15 years of experience.

Generate a personalized sales email based on the prospect and product information provided.

Prospect Information:
- Name: ${prospectName}
- Company: ${prospectCompany}
- Job Title: ${prospectJobTitle || 'Not specified'}
- Company Description: ${prospectCompanyDescription || 'Not specified'}

Product Information:
- Product Name: ${productName}
- Product Description: ${productDescription}
- Key Benefits:
${benefitsList}

Requirements:
- Tone: ${tone}
- Length: ${length} (${lengthDescription[length]})

Rules:
1. Personalize the email using the prospect's name and company
2. Focus on value proposition, not features
3. NEVER use spam trigger words (FREE, Act Now, Limited Time, etc.)
4. Include ONE clear call-to-action
5. NEVER use placeholders like [Company Name] or [Your Name]
6. Do NOT use emojis
7. Use short paragraphs (2-3 sentences each)
8. End with a question to encourage reply

Output Format:
Return ONLY a JSON object with this exact structure:
{
  "subject": "Your email subject line (max 60 characters)",
  "body": "Your email body text"
}`
}

async function callDeepSeekAPI(prompt: string): Promise<{ success: true; data: { subject: string; body: string } } | { success: false; error?: string }> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return { success: false, error: 'API key not configured' }
  }

  try {
    const response = await fetchWithTimeout('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates B2B sales emails. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    }, 30000)

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      return {
        success: false,
        error: errorData?.error?.message || `API request failed with status ${response.status}`
      }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return { success: false, error: 'Empty response from AI' }
    }

    let parsedContent
    try {
      parsedContent = JSON.parse(content)
    } catch {
      return parseAlternativeFormat(content)
    }

    if (!parsedContent.subject || !parsedContent.body) {
      return parseAlternativeFormat(content)
    }

    return {
      success: true,
      data: {
        subject: parsedContent.subject.trim(),
        body: parsedContent.body.trim()
      }
    }

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        return { success: false, error: 'Request timed out. Please try again.' }
      }
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Unknown error occurred' }
  }
}

function parseAlternativeFormat(content: string): { success: true; data: { subject: string; body: string } } | { success: false; error?: string } {
  const subjectMatch = content.match(/["']subject["']\s*[,:]\s*["']([^"']+)["']/i)
  const bodyMatch = content.match(/["']body["']\s*[,:]\s*["']([\s\S]+?)["']/i)

  if (subjectMatch && bodyMatch) {
    return {
      success: true,
      data: {
        subject: subjectMatch[1].trim(),
        body: bodyMatch[1].trim()
      }
    }
  }

  const subjectLineMatch = content.match(/^(Subject|SUBJECT):\s*(.+)$/m)
  const bodyStart = content.indexOf('Body:') !== -1 ? content.indexOf('Body:') : content.indexOf('BODY:')
  
  if (subjectLineMatch && bodyStart !== -1) {
    const bodyContent = content.substring(bodyStart + 5).trim()
    return {
      success: true,
      data: {
        subject: subjectLineMatch[2].trim(),
        body: bodyContent
      }
    }
  }

  return { success: false, error: 'Failed to parse AI response' }
}

async function saveEmailHistory(userId: string, input: GenerateEmailRequest, subject: string, body: string) {
  const supabase = await createClient()
  if (!supabase) {
    return
  }

  const { error: rpcError } = await supabase.rpc('increment_email_count', { p_user_id: userId })
  if (rpcError) {
    console.error('Error incrementing email count:', rpcError)
  }

  const { error: insertError } = await supabase.from('email_history').insert({
    user_id: userId,
    input_data: {
      prospectInfo: {
        name: input.prospectName,
        company: input.prospectCompany,
        jobTitle: input.prospectJobTitle,
        companyDescription: input.prospectCompanyDescription
      },
      productInfo: {
        name: input.productName,
        description: input.productDescription,
        benefits: input.productBenefits
      },
      settings: {
        tone: input.tone,
        length: input.length
      }
    },
    output_subject: subject,
    output_body: body
  })

  if (insertError) {
    console.error('Error inserting email history:', insertError)
  }
}
