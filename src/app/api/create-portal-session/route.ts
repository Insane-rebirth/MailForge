export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 503 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Please log in to continue',
          },
        },
        { status: 401 }
      )
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .limit(1)

    if (profileError || !profiles?.[0]?.stripe_customer_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_SUBSCRIPTION',
            message: 'No active subscription found',
          },
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const returnUrl = body.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`

    const session = await stripe.billingPortal.sessions.create({
      customer: profiles[0].stripe_customer_id,
      return_url: returnUrl,
    })

    return NextResponse.json({
      success: true,
      data: { portalUrl: session.url },
    })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create portal session',
        },
      },
      { status: 500 }
    )
  }
}
