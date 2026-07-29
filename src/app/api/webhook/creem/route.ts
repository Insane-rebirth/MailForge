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
  // Resolve the real UUID for the user.
  // userId from webhook metadata is usually a UUID, but Creem sometimes
  // sends the customer email or Creem customer ID instead. We must resolve
  // it to the actual profiles.id UUID so both tables update correctly.
  let realUserId: string | null = userId

  // Check if userId looks like a UUID (contains dashes, 36 chars).
  // If not, try to resolve it by looking up the email in profiles.
  const isLikelyUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)

  if (!isLikelyUuid) {
    // userId is probably an email or customer ID — resolve to UUID via email
    const { data: profileByEmail } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', userId)
      .limit(1)

    if (profileByEmail && profileByEmail.length > 0) {
      realUserId = profileByEmail[0].id
      console.log('Resolved userId from email to UUID:', userId, '->', realUserId)
    } else {
      console.error('Could not resolve UUID for userId:', userId)
      // Still try the profiles update by email as a last resort below
    }
  }

  // Upsert into subscriptions table with the resolved UUID.
  // Only attempt this if we have a valid UUID — either the original (if it was a UUID)
  // or the one we resolved by email lookup.
  const hasValidUuid = isLikelyUuid || (realUserId !== userId)

  if (hasValidUuid && realUserId) {
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        id: subscriptionId,
        user_id: realUserId,
        plan,
        status,
        creem_subscription_id: subscriptionId,
        current_period_end: null,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Failed to upsert subscription:', error)
    } else {
      console.log('Subscription upserted successfully:', subscriptionId, 'status:', status)
    }
  }

  if (status === 'active') {
    // CRITICAL: Use UPDATE, not UPSERT — only touch subscription fields
    // Do NOT overwrite email, full_name, facebook_id, emails_used_this_month, etc.
    if (realUserId && realUserId !== userId) {
      // We resolved a different UUID — update by that UUID
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: plan,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', realUserId)

      if (profileError) {
        console.error('Failed to update profile subscription:', profileError)
      } else {
        console.log('Profile subscription updated for user:', realUserId, 'tier:', plan)
      }
    } else {
      // Try updating by the original userId (UUID case)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: plan,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (profileError) {
        console.error('Failed to update profile subscription:', profileError)
        // Retry: userId might be an email — try looking up by email first
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', userId)
          .limit(1)

        if (profileByEmail && profileByEmail.length > 0) {
          const resolvedId = profileByEmail[0].id
          const { error: retryError } = await supabase
            .from('profiles')
            .update({
              subscription_tier: plan,
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', resolvedId)

          if (retryError) {
            console.error('Retry update failed:', retryError)
          } else {
            console.log('Profile updated by email lookup:', resolvedId, 'tier:', plan)
          }
        }
      } else {
        console.log('Profile subscription updated for user:', userId, 'tier:', plan)
      }
    }
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

    const signature = request.headers.get('creem-signature') 
      || request.headers.get('signature')
      || request.headers.get('x-creem-signature')
      || request.headers.get('x-signature')
    
    if (!signature) {
      console.error('Missing signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    const body = await request.text()
    
    let expectedSignature = ''
    let signatureValid = false
    
    const sigBuffer = Buffer.from(signature, 'utf-8')
    
    const algos = [
      { alg: 'sha256', enc: 'hex' },
      { alg: 'sha256', enc: 'base64' },
      { alg: 'sha1', enc: 'hex' },
      { alg: 'sha1', enc: 'base64' },
    ]
    
    for (const { alg, enc } of algos) {
      expectedSignature = crypto
        .createHmac(alg, webhookSecret)
        .update(body)
        .digest(enc as any)
      
      try {
        const expectedBuffer = Buffer.from(expectedSignature, enc as any)
        if (sigBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
          signatureValid = true
          console.log(`Signature verified with ${alg}/${enc}`)
          break
        }
      } catch {}
    }
    
    if (!signatureValid) {
      console.error('Invalid webhook signature')
      console.error('Received:', signature.substring(0, 20) + '...')
      console.error('Expected (sha256/hex):', expectedSignature.substring(0, 20) + '...')
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