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

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')

    if (usersError) {
      return NextResponse.json(
        { error: 'Failed to get users' },
        { status: 500 }
      )
    }

    const { data: emails, error: emailsError } = await supabase
      .from('generated_emails')
      .select('*')

    if (emailsError) {
      return NextResponse.json(
        { error: 'Failed to get emails' },
        { status: 500 }
      )
    }

    const totalUsers = users.length
    const totalEmails = emails.length

    const today = new Date()
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayUsers = users.filter(u => u.created_at?.startsWith(dateStr)).length
      const dayEmails = emails.filter(e => e.created_at?.startsWith(dateStr)).length
      last7Days.push({
        date: dateStr,
        users: dayUsers,
        emails: dayEmails,
      })
    }

    const proUsers = users.filter(u => u.subscription_tier === 'pro').length
    const businessUsers = users.filter(u => u.subscription_tier === 'business').length
    const freeUsers = users.filter(u => u.subscription_tier === 'free').length

    const avgEmailsPerUser = totalUsers > 0 ? Math.round(totalEmails / totalUsers) : 0

    const maxEmailsUser = users.reduce((prev, curr) => 
      (curr.emails_used_this_month || 0) > (prev.emails_used_this_month || 0) ? curr : prev
    )

    return NextResponse.json({
      overview: {
        totalUsers,
        totalEmails,
        avgEmailsPerUser,
        proUsers,
        businessUsers,
        freeUsers,
      },
      daily: last7Days,
      topUser: maxEmailsUser,
    })
  } catch (error) {
    console.error('Error getting statistics:', error)
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    )
  }
}
