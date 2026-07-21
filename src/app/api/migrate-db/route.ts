export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

async function supabaseRequest(url: string, options?: RequestInit) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  const fullUrl = `${supabaseUrl}${url}`
  
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey!,
      'Content-Type': 'application/json',
    },
  })
  
  return response.json()
}

async function executeSql(sql: string) {
  const result = await supabaseRequest('/rest/v1/rpc/execute_sql', {
    method: 'POST',
    body: JSON.stringify({ sql }),
  })
  return result
}

export async function GET() {
  try {
    const envDebug = {
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    }
    
    console.log('Environment debug:', JSON.stringify(envDebug))
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing environment variables',
          debug: envDebug,
          message: 'SUPABASE_SERVICE_ROLE_KEY或NEXT_PUBLIC_SUPABASE_URL未配置'
        },
        { status: 500 }
      )
    }

    console.log('=== 开始数据库迁移 ===')

    console.log('1. 检查现有表结构...')
    const existingTables = await supabaseRequest('/rest/v1/information_schema.tables?select=table_name&table_schema=eq.public')
    console.log('现有表:', JSON.stringify(existingTables))
    
    const existingTableNames = Array.isArray(existingTables) 
      ? existingTables.map((t: any) => t.table_name) 
      : []

    const migrationQueries = [
      `ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS reply_rate DECIMAL DEFAULT NULL;`,
      `ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS days_active_this_month INTEGER DEFAULT 0;`,
      `CREATE TABLE IF NOT EXISTS public.pending_payments (
        id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        plan TEXT NOT NULL CHECK (plan IN ('pro', 'business')),
        amount INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS public.crm_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
        provider TEXT NOT NULL CHECK (provider IN ('hubspot', 'salesforce', 'pipedrive')),
        api_key TEXT,
        access_token TEXT,
        refresh_token TEXT,
        expires_at TIMESTAMPTZ,
        connected_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;`,
      `CREATE INDEX IF NOT EXISTS idx_pending_payments_user_email ON public.pending_payments(user_email);`,
      `CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON public.pending_payments(status);`,
      `CREATE INDEX IF NOT EXISTS idx_pending_payments_created_at ON public.pending_payments(created_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_crm_settings_user_id ON public.crm_settings(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_crm_settings_provider ON public.crm_settings(provider);`,
      `CREATE POLICY "Users can view own pending payments" ON public.pending_payments FOR SELECT USING (auth.email() = user_email);`,
      `CREATE POLICY "Users can insert pending payments" ON public.pending_payments FOR INSERT WITH CHECK (auth.email() = user_email);`,
      `CREATE POLICY "Users can update own pending payments" ON public.pending_payments FOR UPDATE USING (auth.email() = user_email);`,
      `CREATE POLICY "Users can view own CRM settings" ON public.crm_settings FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can insert CRM settings" ON public.crm_settings FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY "Users can update own CRM settings" ON public.crm_settings FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can delete own CRM settings" ON public.crm_settings FOR DELETE USING (auth.uid() = user_id);`,
    ]

    const results: string[] = []

    for (let i = 0; i < migrationQueries.length; i++) {
      console.log(`执行查询 ${i + 1}/${migrationQueries.length}...`)
      
      try {
        const result = await executeSql(migrationQueries[i])
        
        if (result?.error) {
          console.error(`查询 ${i + 1} 失败: ${JSON.stringify(result.error)}`)
          results.push(`查询 ${i + 1} 失败: ${result.error.message || JSON.stringify(result.error)}`)
        } else {
          results.push(`查询 ${i + 1} 成功`)
          console.log(`查询 ${i + 1} 成功`)
        }
      } catch (error) {
        console.error(`查询 ${i + 1} 失败: ${(error as Error).message}`)
        results.push(`查询 ${i + 1} 失败: ${(error as Error).message}`)
      }
    }

    console.log('3. 验证迁移结果...')
    const newTables = await supabaseRequest('/rest/v1/information_schema.tables?select=table_name&table_schema=eq.public')
    
    const newTableNames = Array.isArray(newTables) 
      ? newTables.map((t: any) => t.table_name) 
      : []

    const addedTables = newTableNames.filter((t: string) => !existingTableNames.includes(t))

    return NextResponse.json({
      success: true,
      message: '数据库迁移完成！',
      existingTables: existingTableNames,
      newTables: newTableNames,
      addedTables,
      results,
    })

  } catch (error: any) {
    console.error('迁移失败:', error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}