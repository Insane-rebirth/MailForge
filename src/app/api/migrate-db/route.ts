import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { success: false, error: 'Missing environment variables' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    console.log('=== 开始数据库迁移 ===');

    console.log('1. 检查现有表结构...');
    const { data: existingTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      throw new Error(`查询表结构失败: ${tablesError.message}`);
    }

    console.log('现有表:', JSON.stringify(existingTables));

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
    ];

    const results: string[] = [];

    for (let i = 0; i < migrationQueries.length; i++) {
      console.log(`执行查询 ${i + 1}/${migrationQueries.length}...`);
      
      const { error } = await supabase.rpc('execute_sql', {
        sql: migrationQueries[i]
      });

      if (error) {
        console.error(`查询 ${i + 1} 失败: ${error.message}`);
        results.push(`查询 ${i + 1} 失败: ${error.message}`);
      } else {
        results.push(`查询 ${i + 1} 成功`);
        console.log(`查询 ${i + 1} 成功`);
      }
    }

    console.log('3. 验证迁移结果...');
    const { data: newTables, error: newTablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (newTablesError) {
      throw new Error(`验证失败: ${newTablesError.message}`);
    }

    console.log('迁移后表:', JSON.stringify(newTables));

    return NextResponse.json({
      success: true,
      message: '数据库迁移完成！',
      existingTables: existingTables?.map((t: any) => t.table_name),
      newTables: newTables?.map((t: any) => t.table_name),
      results,
    });

  } catch (error: any) {
    console.error('迁移失败:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}