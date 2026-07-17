export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const spamWords = [
  'free', 'guarantee', 'earn money', 'make money', 'risk free', 'no risk',
  'act now', 'limited time', 'urgent', 'click here', 'visit our website',
  'subscribe', 'unsubscribe', 'opt-in', 'opt-out', 'trial', 'demo',
  'buy now', 'order now', 'purchase', 'sale', 'discount', 'offer',
  'bonus', 'win', 'prize', 'lottery', 'cash', 'money', 'wealth',
  'investment', 'stock', 'profit', 'income', 'rich', 'success', 'million',
  'billion', 'get rich', 'work from home', 'online business', 'affiliate',
  'marketing', 'promotion', 'advertisement', 'spam', 'junk', 'viagra',
  'cialis', 'prescription', 'medicine', 'health', 'weight loss', 'diet',
  'lose weight', 'fitness', 'exercise', 'supplement', 'vitamin', 'energy',
]

const positiveWords = [
  'personalized', 'custom', 'tailored', 'specific', 'relevant',
  'research', 'noticed', 'congratulations', 'excited', 'interested',
  'opportunity', 'value', 'benefit', 'solution', 'help', 'improve',
  'enhance', 'optimize', 'grow', 'scale', 'achieve', 'success',
  'results', 'case study', 'testimonial', 'proof', 'data', 'insight',
  'conversation', 'chat', 'discuss', 'explore', 'learn', 'discover',
]

const urgencyWords = [
  'today', 'now', 'immediately', 'as soon as possible', 'quick',
  'fast', 'rapid', 'instant', 'today only', 'limited', 'exclusive',
]

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
        { error: 'You must be logged in to score emails.', loginUrl: '/login' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subject, body: emailBody } = body

    if (!subject && !emailBody) {
      return NextResponse.json(
        { error: 'Missing subject or body' },
        { status: 400 }
      )
    }

    const fullText = `${subject} ${emailBody}`.toLowerCase()
    const subjectLength = subject?.length || 0
    const bodyLength = emailBody?.length || 0

    let score = 50
    const factors = []

    if (subjectLength >= 6 && subjectLength <= 60) {
      score += 15
      factors.push({ type: 'positive', text: 'Subject line length is optimal' })
    } else if (subjectLength < 6) {
      score -= 10
      factors.push({ type: 'negative', text: 'Subject line is too short' })
    } else {
      score -= 5
      factors.push({ type: 'warning', text: 'Subject line is too long' })
    }

    if (bodyLength >= 80 && bodyLength <= 300) {
      score += 15
      factors.push({ type: 'positive', text: 'Email body length is optimal' })
    } else if (bodyLength < 80) {
      score -= 10
      factors.push({ type: 'negative', text: 'Email body is too short' })
    } else if (bodyLength > 500) {
      score -= 15
      factors.push({ type: 'negative', text: 'Email body is too long' })
    }

    const spamCount = spamWords.filter(word => fullText.includes(word)).length
    if (spamCount === 0) {
      score += 10
      factors.push({ type: 'positive', text: 'No spam trigger words detected' })
    } else if (spamCount <= 3) {
      score -= spamCount * 3
      factors.push({ type: 'warning', text: `${spamCount} potential spam word(s) detected` })
    } else {
      score -= spamCount * 5
      factors.push({ type: 'negative', text: `${spamCount} spam trigger words detected` })
    }

    const positiveCount = positiveWords.filter(word => fullText.includes(word)).length
    if (positiveCount >= 3) {
      score += 10
      factors.push({ type: 'positive', text: `Uses ${positiveCount} positive engagement words` })
    }

    const hasPersonalization = fullText.includes('dear') || 
      fullText.includes('hi') || 
      fullText.includes('hey') ||
      fullText.includes('hello') ||
      fullText.includes(', ') ||
      fullText.includes('!')
    if (hasPersonalization) {
      score += 10
      factors.push({ type: 'positive', text: 'Personalized greeting detected' })
    } else {
      score -= 5
      factors.push({ type: 'warning', text: 'No personalized greeting detected' })
    }

    const hasCTA = fullText.includes('call') ||
      fullText.includes('meeting') ||
      fullText.includes('demo') ||
      fullText.includes('chat') ||
      fullText.includes('talk') ||
      fullText.includes('reply') ||
      fullText.includes('yes') ||
      fullText.includes('interested')
    if (hasCTA) {
      score += 10
      factors.push({ type: 'positive', text: 'Clear call-to-action present' })
    } else {
      score -= 10
      factors.push({ type: 'negative', text: 'No clear call-to-action' })
    }

    const urgencyCount = urgencyWords.filter(word => fullText.includes(word)).length
    if (urgencyCount >= 1 && urgencyCount <= 3) {
      score += 5
      factors.push({ type: 'positive', text: 'Appropriate urgency level' })
    } else if (urgencyCount > 3) {
      score -= 10
      factors.push({ type: 'negative', text: 'Too much urgency may appear pushy' })
    }

    score = Math.max(0, Math.min(100, score))

    let grade: 'A' | 'B' | 'C' | 'D' | 'F'
    let gradeColor: string
    if (score >= 90) {
      grade = 'A'
      gradeColor = 'bg-green-500'
    } else if (score >= 80) {
      grade = 'B'
      gradeColor = 'bg-blue-500'
    } else if (score >= 70) {
      grade = 'C'
      gradeColor = 'bg-yellow-500'
    } else if (score >= 60) {
      grade = 'D'
      gradeColor = 'bg-orange-500'
    } else {
      grade = 'F'
      gradeColor = 'bg-red-500'
    }

    let estimatedReplyRate: number
    if (score >= 90) {
      estimatedReplyRate = 15 + Math.random() * 10
    } else if (score >= 80) {
      estimatedReplyRate = 10 + Math.random() * 5
    } else if (score >= 70) {
      estimatedReplyRate = 5 + Math.random() * 5
    } else if (score >= 60) {
      estimatedReplyRate = 2 + Math.random() * 3
    } else {
      estimatedReplyRate = 0.5 + Math.random() * 1.5
    }

    return NextResponse.json({
      score,
      grade,
      gradeColor,
      estimatedReplyRate: estimatedReplyRate.toFixed(1),
      factors,
      breakdown: {
        subjectLength,
        bodyLength,
        spamWords: spamCount,
        positiveWords: positiveCount,
        hasPersonalization,
        hasCTA,
      }
    })

  } catch (error) {
    console.error('[Score Email API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}