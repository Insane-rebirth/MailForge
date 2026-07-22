export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CreemWebhookEvent {
  id: string
  type: string
  created_at: string
  data: {
    object: {
      id: string
      status?: string
      customer?: string
      metadata?: Record<string, string>
      amount?: number
      currency?: string
      subscription?: string
      plan?: string
    }
  }
}

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      console.error('CREEM_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    const signature = request.headers.get('creem-signature') || request.headers.get('signature')
    
    if (!signature) {
      console.error('Missing signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    const body = await request.text()
    
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')
    
    const sigBuffer = Buffer.from(signature, 'utf-8')
    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8')
    
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const event: CreemWebhookEvent = JSON.parse(body)
    
    console.log(`Creem webhook received: ${event.type} - ${event.id}`)
    console.log(`Event data:`, JSON.stringify(event.data, null, 2))

    const supabase = await createClient()
    if (!supabase) {
      console.error('Supabase client not available')
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const eventType = event.type
    const objectData = event.data?.object

    switch (eventType) {
      case 'subscription.created':
      case 'customer.subscription.created': {
        const userId = objectData?.metadata?.user_id || objectData?.customer
        const plan = objectData?.metadata?.plan || 'unknown'
        
        if (userId) {
          await supabase
            .from('subscriptions')
            .upsert({
              id: objectData?.id,
              user_id: userId,
              plan,
              status: 'active',
              creem_subscription_id: objectData?.id,
              current_period_end: null,
            })
            
          await supabase
            .from('pending_payments')
            .update({ status: 'completed' })
            .eq('id', objectData?.id)
        }
        break
      }

      case 'subscription.updated': {
        const subscriptionId = objectData?.id
        const newStatus = objectData?.status
        
        if (subscriptionId) {
          await supabase
            .from('subscriptions')
            .update({ status: newStatus })
            .eq('creem_subscription_id', subscriptionId)
        }
        break
      }

      case 'subscription.canceled':
      case 'customer.subscription.deleted': {
        const subscriptionId = objectData?.id
        
        if (subscriptionId) {
          await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('creem_subscription_id', subscriptionId)
        }
        break
      }

      case 'subscription.past_due': {
        const subscriptionId = objectData?.id
        
        if (subscriptionId) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('creem_subscription_id', subscriptionId)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({ 
      received: true,
      event: eventType,
      id: event.id
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}