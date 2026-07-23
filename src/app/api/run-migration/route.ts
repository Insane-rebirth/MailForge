import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const MIGRATION_SQL = `
ALTER TABLE IF EXISTS public.pending_payments
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.pending_payments
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

ALTER TABLE IF EXISTS public.pending_payments
ADD COLUMN IF NOT EXISTS creem_checkout_id TEXT;

ALTER TABLE IF EXISTS public.pending_payments
ALTER COLUMN plan DROP NOT NULL;

ALTER TABLE IF EXISTS public.pending_payments
ALTER COLUMN amount DROP NOT NULL;

ALTER TABLE IF EXISTS public.pending_payments
ALTER COLUMN user_email DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'business')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'expired')),
  creem_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creem_id ON public.subscriptions(creem_subscription_id);

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own pending payments by user_id" ON public.pending_payments;
CREATE POLICY "Users can view own pending payments by user_id" ON public.pending_payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert pending payments by user_id" ON public.pending_payments;
CREATE POLICY "Users can insert pending payments by user_id" ON public.pending_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending payments by user_id" ON public.pending_payments;
CREATE POLICY "Users can update own pending payments by user_id" ON public.pending_payments
  FOR UPDATE USING (auth.uid() = user_id);
`

export async function POST() {
  try {
    const supabase = createServiceClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase service client not configured' },
        { status: 500 }
      )
    }

    const statements = MIGRATION_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    const results: Array<{ statement: string; success: boolean; error?: string }> = []

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          results.push({ statement: statement.substring(0, 50) + '...', success: false, error: error.message })
          console.error('Migration statement failed:', statement.substring(0, 100), error)
        } else {
          results.push({ statement: statement.substring(0, 50) + '...', success: true })
          console.log('Migration statement succeeded:', statement.substring(0, 100))
        }
      } catch (err: any) {
        results.push({ statement: statement.substring(0, 50) + '...', success: false, error: err.message })
      }
    }

    const allSuccess = results.every(r => r.success)
    const failedCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: allSuccess,
      totalStatements: statements.length,
      failedCount,
      results,
      message: allSuccess 
        ? 'Database migration completed successfully' 
        : `Migration completed with ${failedCount} failures`
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Migration failed' },
      { status: 500 }
    )
  }
}