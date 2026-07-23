-- 修复 pending_payments 表结构 - 添加缺失的 user_id 字段
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

-- 创建 subscriptions 表
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

-- 启用行级安全策略
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creem_id ON public.subscriptions(creem_subscription_id);

-- 创建 RLS 策略
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

-- 修复 pending_payments 表的 RLS 策略以支持 user_id 访问
DROP POLICY IF EXISTS "Users can view own pending payments by user_id" ON public.pending_payments;
CREATE POLICY "Users can view own pending payments by user_id" ON public.pending_payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert pending payments by user_id" ON public.pending_payments;
CREATE POLICY "Users can insert pending payments by user_id" ON public.pending_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending payments by user_id" ON public.pending_payments;
CREATE POLICY "Users can update own pending payments by user_id" ON public.pending_payments
  FOR UPDATE USING (auth.uid() = user_id);