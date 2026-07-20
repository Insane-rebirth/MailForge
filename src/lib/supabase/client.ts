import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be used in browser')
  }
  
  if (supabaseClient) {
    return supabaseClient
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Supabase client not configured:', { hasUrl: !!url, hasKey: !!key })
    throw new Error('Supabase client not configured')
  }
  
  supabaseClient = createBrowserClient(url, key, {
    auth: {
      persistSession: true,
      storage: localStorage,
    },
  })
  
  console.log('Supabase client initialized successfully')
  return supabaseClient
}

export { supabaseClient as supabase }