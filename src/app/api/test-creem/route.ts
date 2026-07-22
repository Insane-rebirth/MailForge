export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createPaymentLink } from '@/lib/creem'

export async function POST() {
  try {
    const link = await createPaymentLink(
      2900,
      'USD',
      'MailForge Pro Plan - Monthly',
      {
        user_email: 'test@example.com',
        plan: 'pro',
        user_id: 'test_user_123',
      }
    )

    if (!link) {
      return NextResponse.json(
        { success: false, error: 'Failed to create payment link' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentUrl: link.url,
        paymentId: link.id,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}