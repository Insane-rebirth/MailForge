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

    const handlePaymentEvent = async () => {
      const amount = data.amount?.amount || data.total_amount || data.amount || '0'
      const plan = data.product?.name || data.metadata?.plan || data.description || 'Unknown'
      const customerEmail = data.customer?.email || data.email || 'N/A'
      const timestamp = new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
      })

      const success = await sendPaymentNotification(
        typeof amount === 'number' ? (amount / 100).toString() : amount.toString(),
        plan,
        customerEmail,
        timestamp
      )

      console.log('Payment notification sent:', success)
    }

    switch (eventType) {
      case 'checkout.completed':
        await handlePaymentEvent()
        break
      case 'payment.created':
        await handlePaymentEvent()
        break
      case 'payment.completed':
        await handlePaymentEvent()
        break
      case 'subscription.active':
        console.log('Subscription activated:', data)
        break
      case 'subscription.created':
        console.log('Subscription created:', data)
        break
      case 'refund.created':
        console.log('Refund created:', data)
        break
      default:
        console.log('Unhandled event type:', eventType)
    }

    return NextResponse.json({ received: true, event_type: eventType })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
