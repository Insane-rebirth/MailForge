-- ============================================================
-- CRITICAL FIX: Add missing columns to profiles table
-- Date: 2026-07-30
-- Problem: profiles table is missing email, full_name,
--   emails_used_this_month, last_usage_reset columns
--   This causes silent failures in login, usage tracking,
--   and user matching
-- ============================================================

-- 1. Add email column (used for user matching and webhook lookups)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Add full_name column (used for display name)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 3. Add emails_used_this_month column (used for usage tracking)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emails_used_this_month INTEGER DEFAULT 0;

-- 4. Add last_usage_reset column (used for monthly usage reset)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_usage_reset TIMESTAMPTZ DEFAULT NOW();

-- 5. Backfill email from auth.users for existing profiles
-- This ensures existing users can be matched by email on re-login
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id AND (p.email IS NULL OR p.email = '');

-- 6. Backfill full_name from display_name if full_name is empty
UPDATE public.profiles
SET full_name = display_name
WHERE full_name IS NULL AND display_name IS NOT NULL;

-- 7. Backfill emails_used_this_month to 0 for existing users
UPDATE public.profiles
SET emails_used_this_month = 0
WHERE emails_used_this_month IS NULL;

-- 8. Backfill last_usage_reset for existing users
UPDATE public.profiles
SET last_usage_reset = NOW()
WHERE last_usage_reset IS NULL;

-- 9. Create index on email for fast user lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 10. Update trigger to match actual schema
CREATE OR REPLACE FUNCTION public.handle_new_user_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    subscription_tier,
    subscription_status,
    facebook_id,
    facebook_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'facebook_name', NEW.email),
    'free',
    'inactive',
    NEW.raw_user_meta_data->>'facebook_id',
    NEW.raw_user_meta_data->>'facebook_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Run this in Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/ymdgkivkaagfrdnvvqbr/sql/new
-- ============================================================
