export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createPaymentLink } from '@/lib/creem'
import { createClient } from '@/lib/supabase/server'

const PLAN_PRICES = {
  pro: { amount: 2900, description: 'MailForge Pro Plan - Monthly' },
  business: { amount: 7900, description: 'MailForge Business Plan - Monthly' },
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

    const apiKey = process.env.CREEM_API_KEY
    const storeId = process.env.CREEM_STORE_ID
    
    if (!apiKey || !storeId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_ERROR',
            message: 'Payment service temporarily unavailable',
          },
        },
        { status: 503 }
      )
    }

    const planConfig = PLAN_PRICES[plan as keyof typeof PLAN_PRICES]
    const paymentLink = await createPaymentLink(
      planConfig.amount,
      'USD',
      planConfig.description,
      {
        user_email: userEmail,
        plan,
        user_id: user.id,
      }
    )

    if (!paymentLink) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_ERROR',
            message: 'Failed to create payment link',
          },
        },
        { status: 500 }
      )
    }

    if (supabase) {
      await supabase
        .from('pending_payments')
        .insert({
          id: paymentLink.id,
          user_email: email,
          plan,
          amount: planConfig.amount,
          status: 'pending',
        })
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentUrl: paymentLink.url,
        paymentId: paymentLink.id,
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