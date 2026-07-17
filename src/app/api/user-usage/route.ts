export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: Request) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('emails_used_this_month, subscription_tier, reply_rate, days_active_this_month')
      .eq('id', userId)
      .limit(1)

    if (profileError || !profiles?.[0]) {
      return NextResponse.json({
        emails_used: 0,
        monthly_quota: 20,
        reply_rate: null,
        days_active: null,
        next_billing_date: null
      })
    }

    const profile = profiles[0]

    const quotaByTier: Record<string, number> = {
      free: 20,
      pro: 500,
      business: Infinity
    }

    const monthlyQuota = quotaByTier[profile.subscription_tier] || 20

    const today = new Date()
    const nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    return NextResponse.json({
      emails_used: profile.emails_used_this_month || 0,
      monthly_quota: monthlyQuota,
      reply_rate: profile.reply_rate || null,
      days_active: profile.days_active_this_month || null,
      next_billing_date: nextBillingDate.toISOString().split('T')[0],
      subscription_tier: profile.subscription_tier || 'free'
    })

  } catch (error) {
    console.error('Error fetching user usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}