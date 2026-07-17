export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

const REAL_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in',
  'qq.com', '163.com', '126.com', 'sina.com', 'sohu.com', '139.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me',
  'aol.com',
  'mail.ru', 'yandex.ru', 'rambler.ru',
  'zoho.com',
  'fastmail.com',
]

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ valid: false, message: 'Email is required' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ valid: false, message: 'Invalid email format' }, { status: 400 })
  }

  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) {
    return NextResponse.json({ valid: false, message: 'Invalid email domain' }, { status: 400 })
  }

  if (REAL_EMAIL_DOMAINS.includes(domain)) {
    return NextResponse.json({ valid: true, message: 'Email is valid' })
  }

  if (domain.includes('.')) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const dnsResult = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, {
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      const dnsData = await dnsResult.json()
      
      if (!dnsData.Answer || dnsData.Answer.length === 0) {
        return NextResponse.json({ valid: false, message: 'Email domain does not exist' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ valid: true, message: 'Email is valid' })
    }
  } else {
    return NextResponse.json({ valid: false, message: 'Invalid email domain' }, { status: 400 })
  }

  return NextResponse.json({ valid: true, message: 'Email is valid' })
}
