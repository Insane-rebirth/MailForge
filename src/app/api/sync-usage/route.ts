export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PLAN_QUOTAS = {
  free: 20,
  pro: 500,
  business: Infinity,
} as const

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({
        allowed: false,
        error: 'Service unavailable',
        quota: 20,
        currentUsage: 0
      }, { status: 503 })
    }
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        allowed: false,
        error: 'Unauthorized',
        quota: 20,
        currentUsage: 0
      }, { status: 401 })
    }

    const body = await request.json()
    const { userId, action, plan, currentUsage } = body

    if (userId && userId !== user.id) {
      return NextResponse.json({
        allowed: false,
        error: 'You can only access your own usage data',
        quota: 20,
        currentUsage: 0
      }, { status: 403 })
    }

    let userPlan = plan || 'free'
    let usage = currentUsage || 0

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, emails_used_this_month')
      .eq('id', user.id)
      .limit(1)

    if (!profileError && profiles?.[0]) {
      userPlan = profiles[0].subscription_tier || 'free'
      usage = profiles[0].emails_used_this_month || 0
    }

    const quota = PLAN_QUOTAS[userPlan as keyof typeof PLAN_QUOTAS] || 20

    if (action === 'get') {
      return NextResponse.json({
        allowed: true,
        quota,
        plan: userPlan,
        currentUsage: usage,
        remaining: quota === Infinity ? -1 : quota - usage,
      })
    }

    if (action === 'increment') {
      const newUsage = usage + 1

      if (quota !== Infinity && newUsage > quota) {
        return NextResponse.json({
          allowed: false,
          quota,
          currentUsage: usage,
          error: 'Usage limit exceeded',
        })
      }

      if (userId) {
        await supabase.rpc('increment_email_count', { p_user_id: userId })
      }

      return NextResponse.json({
        allowed: true,
        quota,
        newUsage,
        plan: userPlan,
        remaining: quota === Infinity ? -1 : quota - newUsage,
      })
    }

    if (action === 'check') {
      if (quota !== Infinity && usage >= quota) {
        return NextResponse.json({
          allowed: false,
          quota,
          currentUsage: usage,
          plan: userPlan,
          remaining: 0,
        })
      }

      return NextResponse.json({
        allowed: true,
        quota,
        currentUsage: usage,
        remaining: quota === Infinity ? -1 : quota - usage,
        plan: userPlan,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('[Sync Usage] Error:', error)
    return NextResponse.json({
      allowed: false,
      error: 'Server error',
      quota: 20,
      currentUsage: 0
    })
  }
}
