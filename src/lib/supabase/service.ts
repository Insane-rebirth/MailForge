import { createClient } from '@supabase/supabase-js'

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return url && key && url !== 'your_supabase_url' && key !== 'your_service_role_key'
}

export function createServiceClient() {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase service client not configured')
    return null
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
