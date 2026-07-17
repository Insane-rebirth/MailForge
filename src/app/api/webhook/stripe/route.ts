export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const body = await request.text()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabase = createServiceClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const priceToTier: Record<string, 'pro' | 'business'> = {
    [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '']: 'pro',
    [process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || '']: 'business',
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (!session.subscription) {
          console.log('No subscription associated with session')
          return NextResponse.json({ received: true })
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0]?.price.id
        
        if (!priceId) {
          console.log('No price found in subscription')
          return NextResponse.json({ received: true })
        }

        const tier = priceToTier[priceId] || 'free'

        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', session.customer)
          .limit(1)

        if (profileError || !profiles?.length) {
          console.log(`No profile found for customer ${session.customer}, creating fallback`)
          const userId = session.metadata?.user_id
          if (userId) {
            await supabase
              .from('profiles')
              .upsert({
                id: userId,
                subscription_tier: tier,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: session.customer as string,
                emails_used_this_month: 0,
                last_usage_reset: new Date().toISOString(),
              })
          }
        } else {
          await supabase
            .from('profiles')
            .update({
              subscription_tier: tier,
              stripe_subscription_id: subscription.id,
              emails_used_this_month: 0,
              last_usage_reset: new Date().toISOString(),
            })
            .eq('id', profiles[0].id)
        }

        console.log(`Subscription created for customer ${session.customer}, tier: ${tier}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0]?.price.id

        if (!priceId) {
          console.log('No price found in subscription')
          return NextResponse.json({ received: true })
        }

        const tier = subscription.status === 'active'
          ? (priceToTier[priceId] || 'free')
          : 'free'

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .limit(1)

        if (profiles?.length) {
          await supabase
            .from('profiles')
            .update({ subscription_tier: tier })
            .eq('id', profiles[0].id)
        }

        console.log(`Subscription updated for ${subscription.id}, tier: ${tier}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .limit(1)

        if (profiles?.length) {
          await supabase
            .from('profiles')
            .update({
              subscription_tier: 'free',
              stripe_subscription_id: null,
            })
            .eq('id', profiles[0].id)
        }

        console.log(`Subscription deleted for ${subscription.id}, downgraded to free`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.error('Payment failed for subscription:', {
          subscriptionId: invoice.subscription,
          customerId: invoice.customer,
          amountDue: invoice.amount_due,
          currency: invoice.currency,
        })
        break
      }

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}
