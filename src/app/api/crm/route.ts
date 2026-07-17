export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (action === 'get-providers') {
    return NextResponse.json({
      providers: [
        { id: 'hubspot', name: 'HubSpot', icon: 'https://www.hubspot.com/hubfs/HubSpot%20Wordmark%20-%20Orange.svg', color: '#FF6A3D' },
        { id: 'salesforce', name: 'Salesforce', icon: 'https://developer.salesforce.com/images/logo.png', color: '#00A1E0' },
        { id: 'pipedrive', name: 'Pipedrive', icon: 'https://pipedrive.github.io/logo/logo.svg', color: '#E87D2D' },
      ]
    })
  }

  if (action === 'get-settings') {
    const { data: settings } = await supabase
      .from('crm_settings')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)

    return NextResponse.json({
      settings: settings?.[0] || null
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  const { action, provider, apiKey, accessToken, refreshToken } = await request.json()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (action === 'connect') {
    const existing = await supabase
      .from('crm_settings')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    let result
    if (existing.data && existing.data.length > 0) {
      result = await supabase
        .from('crm_settings')
        .update({
          provider,
          api_key: apiKey,
          access_token: accessToken,
          refresh_token: refreshToken,
          connected_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    } else {
      result = await supabase
        .from('crm_settings')
        .insert({
          user_id: user.id,
          provider,
          api_key: apiKey,
          access_token: accessToken,
          refresh_token: refreshToken,
          connected_at: new Date().toISOString()
        })
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'disconnect') {
    const result = await supabase
      .from('crm_settings')
      .delete()
      .eq('user_id', user.id)

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'import-contacts') {
    const { data: settings } = await supabase
      .from('crm_settings')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)

    if (!settings?.[0]) {
      return NextResponse.json({ error: 'CRM not connected' }, { status: 400 })
    }

    const fakeContacts = [
      { name: 'Sarah Johnson', company: 'TechCorp Inc', email: 'sarah@techcorp.com', industry: 'Technology' },
      { name: 'Michael Chen', company: 'DataFlow Analytics', email: 'michael@dataflow.io', industry: 'Analytics' },
      { name: 'Emily Davis', company: 'CloudScale Solutions', email: 'emily@cloudscale.com', industry: 'Cloud' },
      { name: 'James Wilson', company: 'FinEdge Capital', email: 'james@finedge.io', industry: 'Finance' },
      { name: 'Lisa Wang', company: 'GrowthStack Marketing', email: 'lisa@growthstack.com', industry: 'Marketing' },
    ]

    return NextResponse.json({ contacts: fakeContacts })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}