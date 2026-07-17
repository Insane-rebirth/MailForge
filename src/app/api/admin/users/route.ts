export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

function verifyAdmin(request: NextRequest) {
  const adminSession = request.cookies.get('admin_session')?.value
  if (!adminSession || adminSession !== 'authenticated') {
    return false
  }
  return true
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to get users' },
        { status: 500 }
      )
    }

    const totalUsers = users.length
    const proUsers = users.filter(u => u.subscription_tier === 'pro').length
    const businessUsers = users.filter(u => u.subscription_tier === 'business').length
    const freeUsers = users.filter(u => u.subscription_tier === 'free').length

    return NextResponse.json({
      users,
      statistics: {
        totalUsers,
        proUsers,
        businessUsers,
        freeUsers,
      },
    })
  } catch (error) {
    console.error('Error getting users:', error)
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    )
  }
}
