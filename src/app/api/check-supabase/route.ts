export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey,
      }, { status: 500 })
    }

    const startTime = Date.now()
    const healthUrl = `${supabaseUrl}/rest/v1/health`
    
    console.log(`Testing connection to: ${healthUrl}`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    try {
      const response = await fetch(healthUrl, {
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      })
      
      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      
      return NextResponse.json({
        success: true,
        status: response.status,
        duration: `${duration}ms`,
        message: 'Supabase connection successful',
      })
    } catch (error: any) {
      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      
      return NextResponse.json({
        success: false,
        error: error.message,
        errorType: error.name,
        duration: `${duration}ms`,
        cause: error.cause?.message || 'No cause info',
        message: 'Supabase connection failed',
      }, { status: 500 })
    }
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Unexpected error',
    }, { status: 500 })
  }
}