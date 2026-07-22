const https = require('https');

const SUPABASE_URL = 'https://ymdgkivkaagfrdnvvqbr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZGdraXZrYWFnZnJkbnZ2cWJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMwMDUzMCwiZXhwIjoyMDkzODc2NTMwfQ.P-F8ToqS-0xPJOM7YttY6qtYVJRN-ZbFcgYg7ZHRY-w';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ymdgkivkaagfrdnvvqbr.supabase.co',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  console.log('=== 开始数据库迁移 ===');
  
  try {
    console.log('\n1. 检查现有表结构...');
    const tablesResult = await makeRequest('/rest/v1/information_schema.tables?select=table_name&table_schema=eq.public');
    console.log('现有表:', JSON.stringify(tablesResult.data));

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

    const results = [];

    for (let i = 0; i < migrationQueries.length; i++) {
      console.log(`\n执行查询 ${i + 1}/${migrationQueries.length}...`);
      console.log('SQL:', migrationQueries[i].substring(0, 100) + '...');
      
      try {
        const result = await makeRequest('/rest/v1/rpc/execute_sql', 'POST', {
          sql: migrationQueries[i]
        });
        
        if (result.status === 200 || result.status === 201) {
          results.push(`查询 ${i + 1} 成功`);
          console.log('成功');
        } else {
          results.push(`查询 ${i + 1} 失败: ${result.status} - ${JSON.stringify(result.data)}`);
          console.log('失败:', result.status, result.data);
        }
      } catch (error) {
        results.push(`查询 ${i + 1} 失败: ${error.message}`);
        console.log('失败:', error.message);
      }
    }

    console.log('\n3. 验证迁移结果...');
    const finalTables = await makeRequest('/rest/v1/information_schema.tables?select=table_name&table_schema=eq.public');
    console.log('迁移后表:', JSON.stringify(finalTables.data));

    console.log('\n=== 迁移完成 ===');
    console.log('结果:', results);

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

main();