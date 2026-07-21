const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ymdgkivkaagfrdnvvqbr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZGdraXZrYWFnZnJkbnZ2cWJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMwMDUzMCwiZXhwIjoyMDkzODc2NTMwfQ.P-F8ToqS-0xPJOM7YttY6qtYVJRN-ZbFcgYg7ZHRY-w'
);

async function migrate() {
  console.log('=== 开始数据库迁移 ===');
  
  try {
    console.log('\n1. 检查现有表结构...');
    const { data: tables, error: tablesError } = await supabase.rpc('execute_sql', {
      sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    });
    
    if (tablesError) {
      throw new Error(`查询表结构失败: ${tablesError.message}`);
    }
    
    console.log('现有表:', JSON.stringify(tables));
    
    console.log('\n2. 执行迁移SQL...');
    const migrationSql = `
      BEGIN;
      
      ALTER TABLE IF EXISTS public.profiles
      ADD COLUMN IF NOT EXISTS reply_rate DECIMAL DEFAULT NULL;
      
      ALTER TABLE IF EXISTS public.profiles
      ADD COLUMN IF NOT EXISTS days_active_this_month INTEGER DEFAULT 0;
      
      CREATE TABLE IF NOT EXISTS public.pending_payments (
        id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        plan TEXT NOT NULL CHECK (plan IN ('pro', 'business')),
        amount INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS public.crm_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
        provider TEXT NOT NULL CHECK (provider IN ('hubspot', 'salesforce', 'pipedrive')),
        api_key TEXT,
        access_token TEXT,
        refresh_token TEXT,
        expires_at TIMESTAMPTZ,
        connected_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;
      
      CREATE INDEX IF NOT EXISTS idx_pending_payments_user_email ON public.pending_payments(user_email);
      CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON public.pending_payments(status);
      CREATE INDEX IF NOT EXISTS idx_pending_payments_created_at ON public.pending_payments(created_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_crm_settings_user_id ON public.crm_settings(user_id);
      CREATE INDEX IF NOT EXISTS idx_crm_settings_provider ON public.crm_settings(provider);
      
      COMMIT;
    `;
    
    const { data: migrateResult, error: migrateError } = await supabase.rpc('execute_sql', {
      sql: migrationSql
    });
    
    if (migrateError) {
      throw new Error(`迁移失败: ${migrateError.message}`);
    }
    
    console.log('迁移结果:', JSON.stringify(migrateResult));
    
    console.log('\n3. 验证迁移结果...');
    const { data: newTables, error: newTablesError } = await supabase.rpc('execute_sql', {
      sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    });
    
    if (newTablesError) {
      throw new Error(`验证失败: ${newTablesError.message}`);
    }
    
    console.log('迁移后表:', JSON.stringify(newTables));
    
    console.log('\n✅ 数据库迁移完成！');
    
  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

migrate();