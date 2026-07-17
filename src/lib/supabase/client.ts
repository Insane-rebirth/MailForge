import { createBrowserClient, type SupabaseClient } from '@supabase/ssr'

let _supabase: SupabaseClient | null = null

export const getSupabase = (): SupabaseClient => {
  if (_supabase) return _supabase
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.warn('Supabase client not configured')
    throw new Error('Supabase not configured')
  }
  
  _supabase = createBrowserClient(url, key, {
    auth: {
      persistSession: true,
      storage: typeof window !== 'undefined' ? localStorage : undefined,
    },
  })
  
  return _supabase
}

export const supabase = new Proxy({} as any, {
  get(target, prop) {
    const client = getSupabase()
    return (client as any)[prop]
  },
})
