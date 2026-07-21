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
  })
}