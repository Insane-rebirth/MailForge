export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const CREEM_API_BASE = 'https://api.creem.io'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})

const CREEM_PRODUCT_TO_PLAN: Record<string, 'free' | 'pro' | 'business'> = {
  'prod_4dAo3HSgudsOS2yPl9l7p3': 'pro',
  'prod_5PFhRwPFFD22wCpoNjHuUF': 'business',
}

const STRIPE_PRICE_TO_PLAN: Record<string, 'free' | 'pro' | 'business'> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '']: 'pro',
  [process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || '']: 'business',
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 503 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { checkout_id, stripe_session_id } = body

    if (stripe_session_id) {
      return await verifyStripeSession(stripe_session_id)
    }

    if (!checkout_id) {
      return NextResponse.json(
        { success: false, error: 'Missing checkout_id' },
        { status: 400 }
      )
    }

    return await verifyCreemCheckout(checkout_id)

  } catch (error) {
    console.error('[Payment API] Error verifying checkout:', error)
    return NextResponse.json({ success: false, error: 'Server error' })
  }
}

async function verifyStripeSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.status !== 'complete') {
      return NextResponse.json({
        success: false,
        status: session.status,
        error: 'Payment not completed'
      })
    }

    const priceId = session.line_items?.data[0]?.price?.id
    let plan: 'free' | 'pro' | 'business' = 'free'

    if (priceId && STRIPE_PRICE_TO_PLAN[priceId]) {
      plan = STRIPE_PRICE_TO_PLAN[priceId]
    } else if (session.metadata?.plan) {
      plan = session.metadata.plan as 'free' | 'pro' | 'business'
    }

    return NextResponse.json({
      success: true,
      plan,
      session_id: sessionId,
      payment_method: 'stripe',
    })
  } catch (error) {
    console.error('[Stripe API] Error verifying session:', error)
    return NextResponse.json({ success: false, error: 'Stripe verification failed' })
  }
}

async function verifyCreemCheckout(checkoutId: string) {
  try {
    const response = await fetch(`${CREEM_API_BASE}/v1/checkouts?checkout_id=${checkoutId}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.CREEM_API_KEY || '',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[Creem API] Failed to fetch checkout:', response.status)
      return NextResponse.json({ success: false, error: 'API request failed' })
    }

    const checkoutData = await response.json()

    if (checkoutData.status !== 'paid') {
      return NextResponse.json({
        success: false,
        status: checkoutData.status,
        error: 'Checkout not paid'
      })
    }

    const productId = checkoutData.product || ''
    let plan: 'free' | 'pro' | 'business' = 'free'

    if (CREEM_PRODUCT_TO_PLAN[productId]) {
      plan = CREEM_PRODUCT_TO_PLAN[productId]
    }

    return NextResponse.json({
      success: true,
      plan,
      checkout_id: checkoutId,
      product_id: productId,
      payment_method: 'creem',
    })
  } catch (error) {
    console.error('[Creem API] Error verifying checkout:', error)
    return NextResponse.json({ success: false, error: 'Creem verification failed' })
  }
}