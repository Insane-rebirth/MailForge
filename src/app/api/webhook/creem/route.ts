import { NextRequest, NextResponse } from 'next/server'
import { sendPaymentNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('X-Creem-Signature')
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET

    if (webhookSecret && signature) {
      const expectedSignature = Buffer.from(webhookSecret).toString('base64')
      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload = await request.json()
    const eventType = payload.type
    const data = payload.data

    if (eventType === 'checkout.completed') {
      const amount = data.amount?.amount || data.total_amount || '0'
      const plan = data.product?.name || data.metadata?.plan || 'Unknown'
      const customerEmail = data.customer?.email || data.email || 'N/A'
      const timestamp = new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
      })

      const success = await sendPaymentNotification(
        amount,
        plan,
        customerEmail,
        timestamp
      )

      console.log('Payment notification sent:', success)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
