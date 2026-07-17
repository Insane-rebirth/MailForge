CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'business')),
  emails_used_this_month INTEGER DEFAULT 0,
  last_usage_reset TIMESTAMPTZ DEFAULT NOW(),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  input_data JSONB NOT NULL,
  output_subject TEXT NOT NULL,
  output_body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.increment_email_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_month INTEGER;
  last_reset_month INTEGER;
  new_count INTEGER;
BEGIN
  SELECT EXTRACT(MONTH FROM NOW()), EXTRACT(MONTH FROM last_usage_reset)
  INTO current_month, last_reset_month
  FROM public.profiles
  WHERE id = p_user_id;

  IF current_month != last_reset_month THEN
    UPDATE public.profiles
    SET emails_used_this_month = 1, last_usage_reset = NOW()
    WHERE id = p_user_id;
    new_count := 1;
  ELSE
    UPDATE public.profiles
    SET emails_used_this_month = emails_used_this_month + 1
    WHERE id = p_user_id;
    SELECT emails_used_this_month INTO new_count FROM public.profiles WHERE id = p_user_id;
  END IF;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET emails_used_this_month = 0, last_usage_reset = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_usage(p_user_id UUID)
RETURNS TABLE(
  emails_used INTEGER,
  monthly_quota INTEGER,
  subscription_tier TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.emails_used_this_month AS emails_used,
    CASE p.subscription_tier
      WHEN 'free' THEN 20
      WHEN 'pro' THEN 500
      WHEN 'business' THEN -1
      ELSE 20
    END AS monthly_quota,
    p.subscription_tier
  FROM public.profiles p
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
CREATE TRIGGER handle_new_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_trigger();

CREATE OR REPLACE FUNCTION public.handle_new_user_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own email history" ON public.email_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email history" ON public.email_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email history" ON public.email_history
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_email_history_user_id ON public.email_history(user_id);
CREATE INDEX IF NOT EXISTS idx_email_history_created_at ON public.email_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON public.profiles(stripe_subscription_id);
