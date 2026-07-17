export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface TestVariant {
  id: string
  subject: string
  body: string
  style: string
  sentCount: number
  replyCount: number
  openCount: number
}

interface ABTest {
  id: string
  name: string
  subject: string
  variants: TestVariant[]
  status: 'active' | 'completed' | 'draft'
  createdAt: string
  winnerId: string | null
}

export async function GET(request: Request) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const testId = searchParams.get('testId')

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (action === 'list') {
    const { data: tests } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ tests: tests || [] })
  }

  if (action === 'get' && testId) {
    const { data: test } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('id', testId)
      .eq('user_id', user.id)
      .limit(1)

    if (!test?.[0]) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    return NextResponse.json({ test: test[0] })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  const { action, test } = await request.json()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (action === 'create') {
    if (!test.name?.trim()) {
      return NextResponse.json({ error: 'Test name is required' }, { status: 400 })
    }
    if (!test.subject?.trim()) {
      return NextResponse.json({ error: 'Subject line is required' }, { status: 400 })
    }
    if (!test.variants || !Array.isArray(test.variants) || test.variants.length < 2) {
      return NextResponse.json({ error: 'At least 2 variants are required' }, { status: 400 })
    }
    
    for (const variant of test.variants) {
      if (!variant.subject?.trim()) {
        return NextResponse.json({ error: 'All variants must have a subject' }, { status: 400 })
      }
      if (!variant.body?.trim()) {
        return NextResponse.json({ error: 'All variants must have a body' }, { status: 400 })
      }
    }

    const newTest: ABTest = {
      id: `test_${Date.now()}`,
      name: test.name,
      subject: test.subject,
      variants: test.variants.map((v: any, idx: number) => ({
        id: `variant_${Date.now()}_${idx}`,
        subject: v.subject,
        body: v.body,
        style: v.style || 'Formal',
        sentCount: 0,
        replyCount: 0,
        openCount: 0
      })),
      status: 'active',
      createdAt: new Date().toISOString(),
      winnerId: null
    }

    const result = await supabase
      .from('ab_tests')
      .insert({
        ...newTest,
        user_id: user.id,
        variants: JSON.stringify(newTest.variants)
      })

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, test: newTest })
  }

  if (action === 'update-results') {
    const { testId, variantId, type } = test

    const { data: existingTest } = await supabase
      .from('ab_tests')
      .select('variants')
      .eq('id', testId)
      .eq('user_id', user.id)
      .limit(1)

    if (!existingTest?.[0]) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    const variants: TestVariant[] = JSON.parse(existingTest[0].variants)
    const variant = variants.find(v => v.id === variantId)

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    if (type === 'sent') variant.sentCount++
    if (type === 'open') variant.openCount++
    if (type === 'reply') variant.replyCount++

    const result = await supabase
      .from('ab_tests')
      .update({ variants: JSON.stringify(variants) })
      .eq('id', testId)
      .eq('user_id', user.id)

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'complete') {
    const { testId, winnerId } = test

    const result = await supabase
      .from('ab_tests')
      .update({ status: 'completed' as const, winner_id: winnerId })
      .eq('id', testId)
      .eq('user_id', user.id)

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    const { testId } = test

    const result = await supabase
      .from('ab_tests')
      .delete()
      .eq('id', testId)
      .eq('user_id', user.id)

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}