export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import crypto from 'crypto'

interface CreemWebhookEvent {
  id: string
  type: string
  created_at: string
  data: {
    object: {
      id: string
      object?: string
      status?: string
      customer?: string
      customer_email?: string
      metadata?: Record<string, string>
      amount?: number
      currency?: string
      subscription?: string
      plan?: string
      product?: string
    }
  }
}

function extractUserId(objectData: any): string | null {
  return objectData?.metadata?.user_id 
    || objectData?.customer 
    || objectData?.customer_email
    || null
}

function extractPlan(objectData: any): string {
  return objectData?.metadata?.plan 
    || objectData?.plan 
    || 'unknown'
}

async function upsertSubscription(
  supabase: any, 
  subscriptionId: string, 
  userId: string, 
  plan: string, 
  status: string
) {
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      id: subscriptionId,
      user_id: userId,
      plan,
      status,
      creem_subscription_id: subscriptionId,
      current_period_end: null,
    })
  
  if (error) {
    console.error('Failed to upsert subscription:', error)
  } else {
    console.log('Subscription upserted successfully:', subscriptionId, 'status:', status)
  }
}

async function updatePendingPayment(supabase: any, referenceId: string, status: string) {
  const { error } = await supabase
    .from('pending_payments')
    .update({ status })
    .or(`creem_checkout_id.eq.${referenceId},id.eq.${referenceId}`)
  
  if (error) {
    console.error(`Failed to update pending payment to ${status}:`, error)
  } else {
    console.log(`Pending payment updated to ${status}:`, referenceId)
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
    
    console.log(`[Creem Webhook] Received: ${event.type} - ${event.id}`)

    const supabase = createServiceClient()
    if (!supabase) {
      console.error('Supabase service client not available')
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const eventType = event.type
    const objectData = event.data?.object
    const objectId = objectData?.id

    switch (eventType) {
      case 'subscription.created':
      case 'customer.subscription.created':
      case 'subscription.activated': {
        const userId = extractUserId(objectData)
        const plan = extractPlan(objectData)
        
        if (userId && objectId) {
          await upsertSubscription(supabase, objectId, userId, plan, 'active')
          
          const { error: updateError } = await supabase
            .from('pending_payments')
            .update({ status: 'completed', creem_checkout_id: objectId })
            .eq('user_id', userId)
            .eq('plan', plan)
            .eq('status', 'pending')
          
          if (updateError) {
            console.error('Failed to update pending payment:', updateError)
          } else {
            console.log('Pending payment completed for user:', userId, 'plan:', plan)
          }
        } else {
          console.warn(`[Creem Webhook] ${eventType}: Missing userId or objectId`)
        }
        break
      }

      case 'subscription.updated':
      case 'customer.subscription.updated': {
        const newStatus = objectData?.status
        
        if (objectId) {
          const { error } = await supabase
            .from('subscriptions')
            .update({ status: newStatus || 'active' })
            .eq('creem_subscription_id', objectId)
          
          if (error) {
            console.error('Failed to update subscription:', error)
          } else {
            console.log('Subscription updated:', objectId, '->', newStatus)
          }
        }
        break
      }

      case 'subscription.canceled':
      case 'customer.subscription.deleted': {
        if (objectId) {
          const { error } = await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('creem_subscription_id', objectId)
          
          if (error) {
            console.error('Failed to cancel subscription:', error)
          } else {
            console.log('Subscription canceled:', objectId)
          }
        }
        break
      }

      case 'subscription.past_due': {
        if (objectId) {
          const { error } = await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('creem_subscription_id', objectId)
          
          if (error) {
            console.error('Failed to update subscription status:', error)
          } else {
            console.log('Subscription past_due:', objectId)
          }
        }
        break
      }

      case 'payment.succeeded': {
        const checkoutId = objectData?.id
        const subscriptionId = objectData?.subscription
        const userId = extractUserId(objectData)
        const plan = extractPlan(objectData)
        
        if (checkoutId) {
          const { error } = await supabase
            .from('pending_payments')
            .update({ status: 'completed', creem_checkout_id: subscriptionId || checkoutId })
            .or(`id.eq.${checkoutId},creem_checkout_id.eq.${checkoutId}`)
          
          if (error) {
            console.error('Failed to update pending payment:', error)
          } else {
            console.log('Payment succeeded, pending payment updated:', checkoutId)
          }
        }
        
        if (subscriptionId && userId) {
          await upsertSubscription(supabase, subscriptionId, userId, plan, 'active')
          
          const { error: updateError } = await supabase
            .from('pending_payments')
            .update({ status: 'completed', creem_checkout_id: subscriptionId })
            .eq('user_id', userId)
            .eq('status', 'pending')
          
          if (updateError) {
            console.error('Failed to update pending payment by user:', updateError)
          }
        }
        break
      }

      case 'payment.failed': {
        const checkoutId = objectData?.id
        
        if (checkoutId) {
          await updatePendingPayment(supabase, checkoutId, 'failed')
        }
        break
      }

      default:
        console.log(`[Creem Webhook] Unhandled event type: ${eventType}`)
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