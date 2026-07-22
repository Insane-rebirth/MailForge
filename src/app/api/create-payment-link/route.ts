export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createCheckout, createProduct, listProducts } from '@/lib/creem'
import { createClient } from '@/lib/supabase/server'

const PLAN_DETAILS = {
  pro: { 
    name: 'MailForge Pro', 
    description: 'Professional email generation with AI',
    amount: 2900, 
    interval: 'monthly' as const 
  },
  business: { 
    name: 'MailForge Business', 
    description: 'Advanced AI email generation for businesses',
    amount: 7900, 
    interval: 'monthly' as const 
  },
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Service unavailable',
          },
        },
        { status: 503 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
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
    const { plan, email } = body

    if (!plan || !['pro', 'business'].includes(plan)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PLAN',
            message: 'Invalid plan selected',
          },
        },
        { status: 400 }
      )
    }

    const userEmail = email || user.email
    if (!userEmail || !userEmail.includes('@')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Please provide a valid email address',
          },
        },
        { status: 400 }
      )
    }

    const planConfig = PLAN_DETAILS[plan as keyof typeof PLAN_DETAILS]

    let products = await listProducts()
    let product = products.find(p => p.name === planConfig.name)

    if (!product) {
      product = await createProduct(
        planConfig.name,
        planConfig.description,
        planConfig.amount,
        'USD',
        planConfig.interval
      )
      
      if (!product) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PAYMENT_ERROR',
              message: 'Failed to create product',
            },
          },
          { status: 500 }
        )
      }
    }

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/success?plan=${plan}`
    const checkout = await createCheckout(
      product.id,
      userEmail,
      successUrl,
      {
        user_id: user.id,
        plan,
        user_email: userEmail,
      }
    )

    if (!checkout) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_ERROR',
            message: 'Failed to create checkout session',
          },
        },
        { status: 500 }
      )
    }

    if (supabase) {
      await supabase
        .from('pending_payments')
        .insert({
          id: checkout.id,
          user_email: userEmail,
          plan,
          amount: planConfig.amount,
          status: 'pending',
        })
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentUrl: checkout.checkoutUrl,
        paymentId: checkout.id,
      },
    })
  } catch (error) {
    console.error('Error creating payment link:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create payment link',
        },
      },
      { status: 500 }
    )
  }
}