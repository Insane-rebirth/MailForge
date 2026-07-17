export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PLAN_QUOTAS = {
  free: 20,
  pro: 500,
  business: Infinity,
} as const

const getLanguageInstruction = (lang: string): { system: string; user: string } => {
  switch (lang) {
    case 'Chinese':
      return {
        system: 'You are an expert B2B sales email copywriter. CRITICAL: You MUST write the ENTIRE email in Simplified Chinese. Subject, greeting, body, sign-off - ALL in Chinese. Do NOT use English except proper nouns and brand names.',
        user: 'Write the emails in Chinese. Every word must be in Chinese. IMPORTANT: Write ALL emails in Simplified Chinese. The entire email including subject line, body, greeting, and signature must be in Chinese.'
      }
    case 'Japanese':
      return {
        system: 'You are an expert B2B sales email copywriter. CRITICAL: You MUST write the ENTIRE email in Japanese. Subject, greeting, body, sign-off - ALL in Japanese. Do NOT use English except proper nouns and brand names.',
        user: 'Write the emails in Japanese. Every word must be in Japanese. IMPORTANT: Write ALL emails in Japanese. The entire email including subject line, body, greeting, and signature must be in Japanese.'
      }
    case 'Spanish':
      return {
        system: 'You are an expert B2B sales email copywriter. CRITICAL: You MUST write the ENTIRE email in Spanish. Subject, greeting, body, sign-off - ALL in Spanish. Do NOT use English except proper nouns and brand names.',
        user: 'Write the emails in Spanish. Every word must be in Spanish. IMPORTANT: Write ALL emails in Spanish. The entire email including subject line, body, greeting, and signature must be in Spanish.'
      }
    case 'French':
      return {
        system: 'You are an expert B2B sales email copywriter. CRITICAL: You MUST write the ENTIRE email in French. Subject, greeting, body, sign-off - ALL in French. Do NOT use English except proper nouns and brand names.',
        user: 'Write the emails in French. Every word must be in French. IMPORTANT: Write ALL emails in French. The entire email including subject line, body, greeting, and signature must be in French.'
      }
    case 'German':
      return {
        system: 'You are an expert B2B sales email copywriter. CRITICAL: You MUST write the ENTIRE email in German. Subject, greeting, body, sign-off - ALL in German. Do NOT use English except proper nouns and brand names.',
        user: 'Write the emails in German. Every word must be in German. IMPORTANT: Write ALL emails in German. The entire email including subject line, body, greeting, and signature must be in German.'
      }
    default:
      return {
        system: 'You are an expert B2B sales email copywriter with 15 years of experience.',
        user: ''
      }
  }
}

async function checkUserQuota(userId: string): Promise<{ allowed: boolean; plan: string; remaining: number }> {
  const supabase = await createClient()
  if (!supabase) {
    return { allowed: false, plan: 'free', remaining: 0 }
  }
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('subscription_tier, emails_used_this_month')
    .eq('id', userId)
    .limit(1)

  if (error || !profiles?.[0]) {
    return { allowed: false, plan: 'free', remaining: 0 }
  }

  const profile = profiles[0]
  const plan = profile.subscription_tier || 'free'
  const quota = PLAN_QUOTAS[plan as keyof typeof PLAN_QUOTAS] || 20
  const usage = profile.emails_used_this_month || 0

  if (quota !== Infinity && usage >= quota) {
    return { allowed: false, plan, remaining: 0 }
  }

  return { allowed: true, plan, remaining: quota === Infinity ? -1 : quota - usage }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      )
    }
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to generate emails.', loginUrl: '/login' },
        { status: 401 }
      )
    }

    const quotaResult = await checkUserQuota(user.id)
    if (!quotaResult.allowed) {
      return NextResponse.json(
        { error: 'Monthly quota exceeded. Please upgrade your plan.', upgradeUrl: '/pricing' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      clientName, 
      companyName, 
      product, 
      purpose, 
      industry = 'Technology/SaaS', 
      language = 'English',
      include_followups = false
    } = body

    if (!clientName || !companyName || !product || !purpose) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
        { status: 500 }
      )
    }

    const langInstruction = getLanguageInstruction(language)

    if (include_followups) {
      const followupResponse = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          temperature: 0.8,
          max_tokens: 3000,
          messages: [
            {
              role: 'system',
              content: `${langInstruction.system} You are an expert at writing B2B email sequences. You write emails that get replies. You understand buyer psychology. Always respond with valid JSON only. When generating follow-up emails:
- Follow-up 1 (Day 3): Brief friendly reminder. Reference the original email. One sentence max about value. Keep it SHORT.
- Follow-up 2 (Day 7): New angle. Share a relevant stat, case study, or social proof. Different from the first follow-up.
- Follow-up 3 (Day 14): Create urgency. Mention limited availability or deadline. Soft CTA.
- Breakup email (Day 21): Respectful exit. Leave the door open. One or two sentences max.
Each follow-up should be SHORTER than the previous one. Never repeat the same content across follow-ups. Each email must stand on its own but feel like part of a conversation.`
            },
            {
              role: 'user',
              content: `Write a complete B2B email sequence for this scenario:
- Sender's product: ${product}
- Recipient name: ${clientName}
- Recipient company: ${companyName}
- Email purpose: ${purpose}
- Industry: ${industry}
- Language: ${language}

Requirements:
1. Initial email (3 versions: Formal, Casual, Concise):
   - Subject line designed for 50%+ open rates
   - Personalized opening that shows research about the company
   - Clear value proposition tied to their specific pain point
   - One piece of social proof or specific data point
   - Soft but specific CTA
   - Formal: under 250 words, professional tone
   - Casual: under 200 words, friendly conversational tone
   - Concise: under 100 words, direct punchy style

2. Follow-up sequence (4 emails, each SHORT - under 80 words):
   - Follow-up 1 (Day 3): Brief friendly reminder, reference original email, one sentence about value
   - Follow-up 2 (Day 7): New angle, share a stat or social proof
   - Follow-up 3 (Day 14): Create urgency, mention limited availability
   - Breakup (Day 21): Respectful exit, leave door open

${langInstruction.user}

Return ONLY valid JSON with this exact structure:
{
  "initial_emails": [
    {"subject": "...", "body": "...", "style": "Formal"},
    {"subject": "...", "body": "...", "style": "Casual"},
    {"subject": "...", "body": "...", "style": "Concise"}
  ],
  "followups": [
    {"day": 3, "label": "Follow-up 1", "subject": "...", "body": "..."},
    {"day": 7, "label": "Follow-up 2", "subject": "...", "body": "..."},
    {"day": 14, "label": "Follow-up 3", "subject": "...", "body": "..."},
    {"day": 21, "label": "Breakup", "subject": "...", "body": "..."}
  ]
}`
            }
          ]
        })
      })

      if (!followupResponse.ok) {
        const errorText = await followupResponse.text()
        console.error('[DeepSeek API] Followup generation failed:', followupResponse.status, errorText)
        return NextResponse.json(
          { error: `DeepSeek API error: ${followupResponse.status}` },
          { status: 500 }
        )
      }

      const data = await followupResponse.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        return NextResponse.json(
          { error: 'No content returned from DeepSeek API' },
          { status: 500 }
        )
      }

      let result
      try {
        result = JSON.parse(content)
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON response from DeepSeek API' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        ...result,
        mode: 'ai'
      })

    } else {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          temperature: 0.8,
          max_tokens: 2000,
          messages: [
            {
              role: 'system',
              content: `${langInstruction.system} You write emails that get replies. You understand buyer psychology, use social proof, create urgency, and always include a clear call-to-action. Never use spammy language. Always respond with valid JSON only.`
            },
            {
              role: 'user',
              content: `Write 3 B2B sales emails for this scenario:
- Sender's product: ${product}
- Recipient name: ${clientName}
- Recipient company: ${companyName}
- Email purpose: ${purpose}
- Industry: ${industry}
- Language: ${language}

Requirements:
- Subject line designed for 50%+ open rates (curiosity + relevance)
- Personalized opening that shows research about the company
- Clear value proposition tied to their specific pain point
- One piece of social proof or specific data point
- Soft but specific CTA (no 'buy now', instead '15-min call' or 'quick question')
- Formal version: under 250 words, professional tone
- Casual version: under 200 words, friendly conversational tone
- Concise version: under 100 words, direct punchy style
- No generic phrases like 'I hope this finds you well' or 'synergy'
${langInstruction.user}

Return ONLY a JSON array with 3 objects, each having: subject, body, style (Formal/Casual/Concise)`
            }
          ]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[DeepSeek API] Failed:', response.status, errorText)
        return NextResponse.json(
          { error: `DeepSeek API error: ${response.status}` },
          { status: 500 }
        )
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        return NextResponse.json(
          { error: 'No content returned from DeepSeek API' },
          { status: 500 }
        )
      }

      let emails
      try {
        emails = JSON.parse(content)
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON response from DeepSeek API' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        emails,
        mode: 'ai'
      })
    }

  } catch (error) {
    console.error('[Generate Emails API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
