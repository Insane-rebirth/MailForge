export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

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

    // Step 1: Read subscription from database FIRST (most reliable)
    // This ensures paid users keep their plan even if Creem API is down
    const serviceClient = createServiceClient()
    if (serviceClient) {
      const { data: profile, error: profileError } = await serviceClient
        .from('profiles')
        .select('subscription_tier, subscription_status')
        .eq('id', user.id)
        .limit(1)
        .maybeSingle()

      if (!profileError && profile) {
        const dbTier = profile.subscription_tier as 'free' | 'pro' | 'business'
        const dbStatus = profile.subscription_status

        // If database shows a paid plan AND status is active (or NULL for
        // legacy users who predate the subscription_status column), return it
        // immediately. This is the primary source of truth — webhook updates
        // this on payment. Treating NULL as active prevents accidental
        // downgrades of legacy paid users.
        if (dbTier && dbTier !== 'free' && (dbStatus === 'active' || dbStatus === null)) {
          return NextResponse.json({ plan: dbTier, source: 'database' })
        }

        // If database shows free, try Creem API to see if payment was recent
        // (webhook might not have fired yet)
        if (dbTier === 'free' || dbStatus === 'inactive') {
          const creemPlan = await checkCreemSubscription(email)

          // If Creem confirms a paid plan, update database for future use
          if (creemPlan && creemPlan !== 'free') {
            await serviceClient
              .from('profiles')
              .update({
                subscription_tier: creemPlan,
                subscription_status: 'active',
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id)

            return NextResponse.json({ plan: creemPlan, source: 'creem_synced' })
          }
        }

        // Return database value as fallback (even if API failed)
        return NextResponse.json({ plan: dbTier || 'free', source: 'database' })
      }
    }

    // Step 2: Fallback — query Creem API directly if database unavailable
    const creemPlan = await checkCreemSubscription(email)
    return NextResponse.json({ plan: creemPlan, source: 'creem_fallback' })

  } catch (error) {
    console.error('[check-subscription] Error:', error)
    // CRITICAL: Return 'free' only as last resort
    // Do NOT downgrade users on unexpected errors
    return NextResponse.json({ plan: 'free', source: 'error_fallback' })
  }
}

/**
 * Query Creem API for user's subscription status.
 * Returns 'free' on any error — caller decides how to handle.
 */
async function checkCreemSubscription(email: string): Promise<'free' | 'pro' | 'business'> {
  try {
    const response = await fetch(`${CREEM_API_BASE}/customers?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CREEM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      // Short timeout to avoid hanging the request
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.error('[Creem API] Failed to fetch customers:', response.status)
      return 'free'
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

    return plan
  } catch (error) {
    console.error('[Creem API] Error checking subscription:', error)
    return 'free'
  }
}
