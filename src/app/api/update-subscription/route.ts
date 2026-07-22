export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { retrieveCheckout } from '@/lib/creem'

const CREEM_PRODUCT_TO_PLAN: Record<string, 'free' | 'pro' | 'business'> = {
  'prod_4dAo3HSgudsOS2yPl9l7p3': 'pro',
  'prod_5PFhRwPFFD22wCpoNjHuUF': 'business',
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})

const STRIPE_PRICE_TO_PLAN: Record<string, 'free' | 'pro' | 'business'> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '']: 'pro',
  [process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || '']: 'business',
}

async function verifyPayment(checkoutId: string | undefined, stripeSessionId: string | undefined): Promise<{ success: boolean; plan?: 'free' | 'pro' | 'business'; error?: string }> {
  if (stripeSessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(stripeSessionId)
      if (session.status !== 'complete') {
        return { success: false, error: 'Payment not completed' }
      }
      const priceId = session.line_items?.data[0]?.price?.id
      let plan: 'free' | 'pro' | 'business' = 'free'
      if (priceId && STRIPE_PRICE_TO_PLAN[priceId]) {
        plan = STRIPE_PRICE_TO_PLAN[priceId]
      } else if (session.metadata?.plan) {
        plan = session.metadata.plan as 'free' | 'pro' | 'business'
      }
      return { success: true, plan }
    } catch {
      return { success: false, error: 'Stripe verification failed' }
    }
  }

  if (checkoutId) {
    try {
      const checkoutData = await retrieveCheckout(checkoutId)
      if (!checkoutData) {
        return { success: false, error: 'Checkout not found' }
      }
      if (checkoutData.status !== 'paid') {
        return { success: false, error: 'Checkout not paid' }
      }
      const productId = checkoutData.product || ''
      let plan: 'free' | 'pro' | 'business' = 'free'
      if (CREEM_PRODUCT_TO_PLAN[productId]) {
        plan = CREEM_PRODUCT_TO_PLAN[productId]
      }
      return { success: true, plan }
    } catch {
      return { success: false, error: 'Creem verification failed' }
    }
  }

  return { success: false, error: 'No payment verification provided' }
}

export async function POST(request: Request) {
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
    const { userId, plan, checkout_id, stripe_session_id } = body

    if (!userId || !plan) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    if (userId !== user.id) {
      return NextResponse.json({ success: false, error: 'You can only update your own subscription' }, { status: 403 })
    }

    if (plan !== 'free') {
      const paymentResult = await verifyPayment(checkout_id, stripe_session_id)
      if (!paymentResult.success) {
        return NextResponse.json({ success: false, error: paymentResult.error || 'Payment verification failed' }, { status: 403 })
      }
      if (paymentResult.plan !== plan) {
        return NextResponse.json({ success: false, error: 'Payment plan mismatch' }, { status: 400 })
      }
    }

    const serviceSupabase = createServiceClient()
    if (!serviceSupabase) {
      return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 503 })
    }

    const { error } = await serviceSupabase
      .from('profiles')
      .upsert({
        id: userId,
        subscription_tier: plan,
      })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
