import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
      typescript: true,
    })
  : null

export const PLANS = {
  free: {
    id: 'price_free',
    name: 'Free',
    monthlyQuota: 20,
    price: 0,
  },
  pro: {
    id: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
    name: 'Pro',
    monthlyQuota: 500,
    price: 29,
  },
  business: {
    id: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || '',
    name: 'Business',
    monthlyQuota: -1,
    price: 79,
  },
} as const

export type PlanType = keyof typeof PLANS

export function getPlanFromPriceId(priceId: string): PlanType | null {
  if (priceId === PLANS.pro.id) return 'pro'
  if (priceId === PLANS.business.id) return 'business'
  if (priceId === PLANS.free.id) return 'free'
  return null
}
