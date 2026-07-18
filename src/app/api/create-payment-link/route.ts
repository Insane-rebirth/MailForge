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

    if (!email || !email.includes('@')) {
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

    const planConfig = PLAN_PRICES[plan as keyof typeof PLAN_PRICES]
    const paymentLink = await createPaymentLink(
      planConfig.amount,
      'USD',
      planConfig.description,
      {
        user_email: email,
        plan,
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