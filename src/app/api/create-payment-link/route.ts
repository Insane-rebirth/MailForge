export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createCheckout } from '@/lib/creem'
import { createClient } from '@/lib/supabase/server'

const PLAN_CONFIG = {
  pro: { 
    productId: 'prod_4dAo3HSgudsOS2yPl9l7p3',
    amount: 2900, 
  },
  business: { 
    productId: 'prod_5PFhRwPFFD22wCpoNjHuUF',
    amount: 7900, 
  },
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Service unavailable',
          },
        },
        { status: 503 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
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
    const { plan, email } = body

    if (!plan || !['pro', 'business'].includes(plan)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PLAN',
            message: 'Invalid plan selected',
          },
        },
        { status: 400 }
      )
    }

    const userEmail = email || user.email
    if (!userEmail || !userEmail.includes('@')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Please provide a valid email address',
          },
        },
        { status: 400 }
      )
    }

    const planConfig = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG]

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/success?plan=${plan}`
    const checkout = await createCheckout(
      planConfig.productId,
      userEmail,
      successUrl,
      {
        user_id: user.id,
        plan,
        user_email: userEmail,
      }
    )

    if (!checkout) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_ERROR',
            message: 'Failed to create checkout session',
          },
        },
        { status: 500 }
      )
    }

    if (supabase) {
      await supabase
        .from('pending_payments')
        .insert({
          id: checkout.id,
          user_email: userEmail,
          plan,
          amount: planConfig.amount,
          status: 'pending',
        })
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentUrl: checkout.checkoutUrl,
        paymentId: checkout.id,
      },
    })
  } catch (error) {
    console.error('Error creating payment link:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create payment link',
        },
      },
      { status: 500 }
    )
  }
}