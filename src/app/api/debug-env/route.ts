export async function GET() {
  return Response.json({
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
    keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
    urlMatch: process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://ymdgkivkaagfrdnvvqbr.supabase.co',
  })
}