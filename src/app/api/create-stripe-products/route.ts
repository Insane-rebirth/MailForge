export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})

export async function POST() {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey || secretKey === 'sk_test_xxx') {
      return NextResponse.json(
        { success: false, error: 'Stripe secret key not configured' },
        { status: 500 }
      )
    }

    console.log('Creating Stripe products...')

    const proProduct = await stripe.products.create({
      name: 'MailForge Pro',
      description: 'Professional email generation with AI',
      metadata: { tier: 'pro' },
    })

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 2900,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'pro' },
    })

    const businessProduct = await stripe.products.create({
      name: 'MailForge Business',
      description: 'Advanced AI email generation for businesses',
      metadata: { tier: 'business' },
    })

    const businessPrice = await stripe.prices.create({
      product: businessProduct.id,
      unit_amount: 7900,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'business' },
    })

    return NextResponse.json({
      success: true,
      data: {
        pro: {
          productId: proProduct.id,
          priceId: proPrice.id,
          price: '$29/month',
        },
        business: {
          productId: businessProduct.id,
          priceId: businessPrice.id,
          price: '$79/month',
        },
      },
    })
  } catch (error: any) {
    console.error('Error creating Stripe products:', error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
