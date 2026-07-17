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
      return NextResponse.json(
        { success: false, error: 'Service unavailable' },
        { status: 503 }
      )
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

    const body = await request.json()
    const { priceId, successUrl, cancelUrl } = body

    const validPriceIds = [
      process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
      process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
    ].filter(Boolean) as string[]

    if (!priceId || !validPriceIds.includes(priceId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PRICE',
            message: 'Invalid price ID',
          },
        },
        { status: 400 }
      )
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .limit(1)

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch user profile',
          },
        },
        { status: 500 }
      )
    }

    let customerId = profiles?.[0]?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .upsert({ id: user.id, stripe_customer_id: customerId })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: { user_id: user.id },
    })

    return NextResponse.json({
      success: true,
      data: { checkoutUrl: session.url },
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create checkout session',
        },
      },
      { status: 500 }
    )
  }
}
