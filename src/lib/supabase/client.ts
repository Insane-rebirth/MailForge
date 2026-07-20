import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be used in browser')
  }
  
  if (_supabase) return _supabase
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Supabase client not configured - environment variables missing')
    throw new Error('Supabase client not configured')
  }
  
  _supabase = createBrowserClient(url, key, {
    auth: {
      persistSession: true,
      storage: localStorage,
    },
  })
  
  return _supabase
}

export const supabase = (() => {
  if (typeof window === 'undefined') {
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
        signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ unsubscribe: () => {} }),
        signInWithOAuth: () => Promise.resolve({ data: null, error: null }),
      },
    } as any
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.warn('Supabase client not configured')
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
        signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ unsubscribe: () => {} }),
        signInWithOAuth: () => Promise.resolve({ data: null, error: null }),
      },
    } as any
  }
  
  return createBrowserClient(url, key, {
    auth: {
      persistSession: true,
      storage: localStorage,
    },
  })
})()