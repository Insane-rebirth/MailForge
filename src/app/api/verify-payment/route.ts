export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/creem'
import { createClient } from '@/lib/supabase/server'
import { sendPaymentNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
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
    const { payment_id: paymentId, plan } = body

    if (!paymentId || !plan || !['pro', 'business'].includes(plan)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Invalid payment parameters',
          },
        },
        { status: 400 }
      )
    }

    const paymentResult = await verifyPayment(paymentId)
    
    if (!paymentResult || !paymentResult.paid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_NOT_COMPLETED',
            message: 'Payment not completed or not found',
          },
        },
        { status: 400 }
      )
    }

    await supabase
      .from('profiles')
      .update({
        subscription_tier: plan,
        subscription_status: 'active',
        stripe_customer_id: null,
      })
      .eq('id', user.id)

    await supabase
      .from('pending_payments')
      .update({ status: 'completed' })
      .eq('id', paymentId)
      .eq('user_id', user.id)

    const amount = (paymentResult.amount || (plan === 'pro' ? 2900 : 7900)) / 100

    await sendPaymentNotification(
      amount.toString(),
      plan === 'pro' ? 'Pro Plan' : 'Business Plan',
      user.email || 'N/A',
      new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    )

    return NextResponse.json({
      success: true,
      plan,
      message: 'Payment verified and subscription activated',
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to verify payment',
        },
      },
      { status: 500 }
    )
  }
}