export async function GET() {
  const stripeKey = process.env.STRIPE_SECRET_KEY || ''
  const isPlaceholder = stripeKey === 'sk_test_xxx' || stripeKey.length < 10
  
  return Response.json({
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasDeepSeekKey: !!process.env.DEEPSEEK_API_KEY,
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeKeyIsPlaceholder: isPlaceholder,
    stripeKeyLength: stripeKey.length,
    stripeKeyPrefix: stripeKey.length > 10 ? stripeKey.substring(0, 10) + '...' : stripeKey,
    hasStripePublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripePublishableKeyLength: (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').length,
    stripePublishableKeyPrefix: (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').length > 10 ? (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').substring(0, 10) + '...' : (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''),
    hasStripeProPriceId: !!process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    stripeProPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    hasStripeBusinessPriceId: !!process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
    stripeBusinessPriceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
    hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    stripeWebhookSecretLength: (process.env.STRIPE_WEBHOOK_SECRET || '').length,
    hasCreemApiKey: !!process.env.CREEM_API_KEY,
    creemApiKeyLength: (process.env.CREEM_API_KEY || '').length,
    hasCreemStoreId: !!process.env.CREEM_STORE_ID,
    hasCreemStoreSlug: !!process.env.CREEM_STORE_SLUG,
    hasCreemWebhookSecret: !!process.env.CREEM_WEBHOOK_SECRET,
    creemWebhookSecretLength: (process.env.CREEM_WEBHOOK_SECRET || '').length,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  })
}