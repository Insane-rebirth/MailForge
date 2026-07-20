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

function createSafeProxy(target: any, path: string[] = []): any {
  return new Proxy(target, {
    get(_target: any, prop: string) {
      const client = getSupabase()
      if (!client) {
        if (['getUser', 'signInWithPassword', 'signUp', 'signOut', 'onAuthStateChange'].includes(prop)) {
          if (prop === 'onAuthStateChange') {
            return () => ({ unsubscribe: () => {} })
          }
          return () => Promise.resolve({ data: { user: null, session: null }, error: null })
        }
        return createSafeProxy({}, [...path, prop])
      }
      
      const value = (client as any)[prop]
      if (typeof value === 'function') {
        return value.bind(client)
      }
      if (typeof value === 'object' && value !== null) {
        return createSafeProxy(value, [...path, prop])
      }
      return value
    },
    apply(_target: any, _thisArg: any, args: any[]) {
      return Promise.resolve({ data: { user: null }, error: null })
    },
  })
}

export const supabase = createSafeProxy({})