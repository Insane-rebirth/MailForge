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

function createSafeProxy(path: string[] = []): any {
  return new Proxy({} as any, {
    get(_target: any, prop: string) {
      const client = getSupabase()
      if (!client) {
        if (['getUser', 'signInWithPassword', 'signUp', 'signOut', 'onAuthStateChange', 'signInWithOAuth'].includes(prop)) {
          if (prop === 'onAuthStateChange') {
            return () => ({ unsubscribe: () => {} })
          }
          return () => Promise.resolve({ data: { user: null, session: null }, error: null })
        }
        return createSafeProxy([...path, prop])
      }
      
      let current: any = client
      for (const p of path) {
        current = current[p]
        if (!current) {
          return createSafeProxy([...path, prop])
        }
      }
      
      const value = current[prop]
      if (typeof value === 'function') {
        return value.bind(current)
      }
      if (typeof value === 'object' && value !== null) {
        return createSafeProxy([...path, prop])
      }
      return value
    },
    apply(_target: any, _thisArg: any, _args: any[]) {
      return Promise.resolve({ data: { user: null }, error: null })
    },
  })
}

export const supabase = createSafeProxy()