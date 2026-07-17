export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: Request) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .limit(1)

  if (fetchError) {
    console.error('Error fetching profile:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }

  const profile = profiles?.[0]

  if (!profile) {
    return NextResponse.json({
      id: user.id,
      subscription_tier: 'free',
      emails_used_this_month: 0,
      last_usage_reset: new Date().toISOString(),
    })
  }

  await checkAndResetUsage(supabase, user.id, profile)

  const { data: updatedProfiles, error: updateError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .limit(1)

  if (updateError) {
    console.error('Error fetching updated profile:', updateError)
    return NextResponse.json(profile)
  }

  return NextResponse.json(updatedProfiles?.[0] || profile)
}

async function checkAndResetUsage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  profile: { subscription_tier: string; last_usage_reset: string }
) {
  if (!supabase) return

  try {
    const lastReset = new Date(profile.last_usage_reset)
    const now = new Date()

    if (
      profile.subscription_tier !== 'business' &&
      (lastReset.getMonth() !== now.getMonth() ||
        lastReset.getFullYear() !== now.getFullYear())
    ) {
      await supabase
        .from('profiles')
        .update({
          emails_used_this_month: 0,
          last_usage_reset: now.toISOString(),
        })
        .eq('id', userId)

      console.log(`Reset monthly usage for user ${userId}`)
    }
  } catch (error) {
    console.error('Error checking/resetting usage:', error)
  }
}