export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CREEM_API_BASE = 'https://api.creem.io/v1'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || user.email

    if (!email) {
      return NextResponse.json({ plan: 'free' })
    }

    const response = await fetch(`${CREEM_API_BASE}/customers?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CREEM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[Creem API] Failed to fetch customers:', response.status)
      return NextResponse.json({ plan: 'free' })
    }

    const data = await response.json()

    let plan: 'free' | 'pro' | 'business' = 'free'
    let foundBusiness = false

    const customers = data.customers || data.data || []

    for (const customer of customers) {
      const subscriptions = customer.subscriptions || customer.product_subscriptions || []

      for (const sub of subscriptions) {
        if (sub.status === 'active' || sub.status === 'trialing') {
          const productName = sub.product?.name || sub.product_name || ''
          const lowerName = productName.toLowerCase()

          if (lowerName.includes('business')) {
            foundBusiness = true
            break
          } else if (lowerName.includes('pro') && !foundBusiness) {
            plan = 'pro'
          }
        }
      }

      if (foundBusiness) {
        plan = 'business'
        break
      }
    }

    return NextResponse.json({ plan })

  } catch (error) {
    console.error('[Creem API] Error checking subscription:', error)
    return NextResponse.json({ plan: 'free' })
  }
}