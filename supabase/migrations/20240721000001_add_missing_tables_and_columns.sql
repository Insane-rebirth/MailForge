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

CREATE POLICY "Users can view own pending payments" ON public.pending_payments
  FOR SELECT USING (auth.email() = user_email);

CREATE POLICY "Users can insert pending payments" ON public.pending_payments
  FOR INSERT WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own pending payments" ON public.pending_payments
  FOR UPDATE USING (auth.email() = user_email);

CREATE POLICY "Users can view own CRM settings" ON public.crm_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert CRM settings" ON public.crm_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CRM settings" ON public.crm_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own CRM settings" ON public.crm_settings
  FOR DELETE USING (auth.uid() = user_id);
