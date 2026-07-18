import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export const getSupabase = (): SupabaseClient | null => {
  if (typeof window === 'undefined') {
    return null
  }
  
  if (_supabase) return _supabase
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.warn('Supabase client not configured')
    return null
  }
  
  _supabase = createBrowserClient(url, key, {
    auth: {
      persistSession: true,
      storage: localStorage,
    },
  })
  
  return _supabase
}

export const supabase = new Proxy({} as any, {
  get(_target: any, prop: any) {
    const client = getSupabase()
    if (!client) {
      return () => Promise.resolve({ data: { user: null } })
    }
    return (client as any)[prop]
  },
})
