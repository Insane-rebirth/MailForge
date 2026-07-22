export async function GET() {
  return Response.json({
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
    keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
    serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
    urlMatch: process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://ymdgkivkaagfrdnvvqbr.supabase.co',
    hasDeepSeekKey: !!process.env.DEEPSEEK_API_KEY,
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    hasStripePublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    hasStripeProPriceId: !!process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    hasStripeBusinessPriceId: !!process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
    hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasCreemApiKey: !!process.env.CREEM_API_KEY,
    hasCreemStoreId: !!process.env.CREEM_STORE_ID,
    hasCreemStoreSlug: !!process.env.CREEM_STORE_SLUG,
    stripeProPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    stripeBusinessPriceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
  })
}