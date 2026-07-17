export const PLAN_QUOTAS = {
  free: 20,
  pro: 500,
  business: Infinity,
} as const

export const PLAN_NAMES = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
} as const

export const CREEM_PAYMENT_LINKS = {
  pro: 'https://www.creem.io/payment/prod_4dAo3HSgudsOS2yPl9l7p3',
  business: 'https://www.creem.io/payment/prod_5PFhRwPFFD22wCpoNjHuUF',
} as const

let cachedSubscription: { plan: 'free' | 'pro' | 'business'; usageCount: number } | null = null

export function getCachedSubscription() {
  return cachedSubscription
}

export function cacheSubscription(subscription: { plan: 'free' | 'pro' | 'business'; usageCount: number }) {
  cachedSubscription = subscription
}

export async function verifySubscriptionWithAPI(userId: string | null): Promise<{
  plan: 'free' | 'pro' | 'business'
  usageCount: number
}> {
  if (!userId) {
    return { plan: 'free', usageCount: 0 }
  }

  try {
    const response = await fetch('/api/user-usage')
    const data = await response.json()

    return {
      plan: (data.subscription_tier as 'free' | 'pro' | 'business') || 'free',
      usageCount: data.emails_used || 0,
    }
  } catch {
    return { plan: 'free', usageCount: 0 }
  }
}

export async function checkCanGenerate(userId: string | null): Promise<{
  canGenerate: boolean
  plan: 'free' | 'pro' | 'business'
  remaining: number
  reason?: string
}> {
  if (!userId) {
    return {
      canGenerate: false,
      plan: 'free',
      remaining: 0,
      reason: 'not_logged_in',
    }
  }

  try {
    const response = await fetch('/api/sync-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        action: 'check',
      }),
    })

    const data = await response.json()

    if (data.allowed) {
      return {
        canGenerate: true,
        plan: data.plan || 'free',
        remaining: data.remaining ?? 0,
      }
    } else {
      return {
        canGenerate: false,
        plan: data.plan || 'free',
        remaining: 0,
        reason: data.plan === 'free' ? 'free' : 'pro',
      }
    }
  } catch {
    return {
      canGenerate: false,
      plan: 'free',
      remaining: 0,
      reason: 'api_error',
    }
  }
}

export async function syncUsageAfterGenerate(userId: string | null, plan: string): Promise<number> {
  if (!userId) {
    return 0
  }

  try {
    const response = await fetch('/api/sync-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        action: 'increment',
        plan,
      }),
    })

    const data = await response.json()

    if (data.newUsage !== undefined) {
      return data.newUsage
    }

    return 0
  } catch {
    return 0
  }
}
