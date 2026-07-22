import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})

async function main() {
  console.log('Creating Stripe products and prices...')

  try {
    const proProduct = await stripe.products.create({
      name: 'MailForge Pro',
      description: 'Professional email generation with AI',
      metadata: {
        tier: 'pro',
      },
    })

    console.log(`Created Pro Product: ${proProduct.name} (${proProduct.id})`)

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 2900,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        tier: 'pro',
      },
    })

    console.log(`Created Pro Price: $29/month (${proPrice.id})`)

    const businessProduct = await stripe.products.create({
      name: 'MailForge Business',
      description: 'Advanced AI email generation for businesses',
      metadata: {
        tier: 'business',
      },
    })

    console.log(`Created Business Product: ${businessProduct.name} (${businessProduct.id})`)

    const businessPrice = await stripe.prices.create({
      product: businessProduct.id,
      unit_amount: 7900,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        tier: 'business',
      },
    })

    console.log(`Created Business Price: $79/month (${businessPrice.id})`)

    console.log('\n=== Price IDs ===')
    console.log(`NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=${proPrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID=${businessPrice.id}`)

  } catch (error: any) {
    console.error('Error creating Stripe products:', error.message)
    process.exit(1)
  }
}

main()
