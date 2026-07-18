export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/creem'
import { createClient } from '@/lib/supabase/server'
import { sendPaymentNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const body = await request.json()
    const { payment_id: paymentId, plan, email } = body

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

    const userEmail = email || 'N/A'
    const amount = (paymentResult.amount || (plan === 'pro' ? 2900 : 7900)) / 100

    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
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
      } else if (userEmail !== 'N/A') {
        const { data: existingUsers } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .limit(1)

        if (existingUsers && existingUsers.length > 0) {
          const userId = existingUsers[0].id
          await supabase
            .from('profiles')
            .update({
              subscription_tier: plan,
              subscription_status: 'active',
            })
            .eq('id', userId)
        }

        await supabase
          .from('pending_payments')
          .update({ status: 'completed' })
          .eq('id', paymentId)
          .eq('user_email', userEmail)
      }
    }

    await sendPaymentNotification(
      amount.toString(),
      plan === 'pro' ? 'Pro Plan' : 'Business Plan',
      userEmail,
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