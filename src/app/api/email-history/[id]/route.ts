export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const emailId = params.id

  if (!emailId) {
    return NextResponse.json(
      { success: false, error: 'Email ID is required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 503 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: email, error: fetchError } = await supabase
    .from('email_history')
    .select('user_id')
    .eq('id', emailId)
    .limit(1)

  if (fetchError || !email?.[0]) {
    return NextResponse.json(
      { success: false, error: 'Email not found' },
      { status: 404 }
    )
  }

  if (email[0].user_id !== user.id) {
    return NextResponse.json(
      { success: false, error: 'You can only delete your own emails' },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from('email_history')
    .delete()
    .eq('id', emailId)

  if (error) {
    console.error('Error deleting email:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete email' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}