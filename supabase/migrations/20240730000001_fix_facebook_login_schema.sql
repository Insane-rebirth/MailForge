-- ============================================================
-- Migration: Fix Facebook Login Schema
-- Date: 2024-07-30
-- Purpose: Add missing fields and tables for reliable Facebook login
-- ============================================================

-- 1. Add facebook_id and facebook_name to profiles table
-- These fields allow matching users by Facebook ID instead of email
-- This prevents duplicate accounts when Facebook inconsistently returns email
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS facebook_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS facebook_name TEXT;

-- Add subscription_status field (webhook tries to update this field)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- Set subscription_status to 'active' for existing paid users.
-- Without this, existing pro/business users have NULL status, which could
-- cause check-subscription to query the Creem API unnecessarily (and risk
-- downgrading them if the API is temporarily unavailable).
UPDATE public.profiles
SET subscription_status = 'active'
WHERE subscription_tier IN ('pro', 'business') AND subscription_status IS NULL;

-- Add creem_customer_id for Creem payment integration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS creem_customer_id TEXT;

-- Create index on facebook_id for fast user lookup during login
CREATE INDEX IF NOT EXISTS idx_profiles_facebook_id ON public.profiles(facebook_id);

-- 2. Create subscriptions table (webhook tries to upsert into this table)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'business')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'canceled', 'past_due', 'trialing')),
  creem_subscription_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for subscriptions table
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creem_subscription_id ON public.subscriptions(creem_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- RLS for subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Add creem_checkout_id to pending_payments if not exists
ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS creem_checkout_id TEXT;

-- 4. Update handle_new_user trigger to include facebook fields
-- CRITICAL: Copy facebook_id from user_metadata so that even if the explicit
-- profiles insert in the API fails, the trigger still saves facebook_id.
-- This is the last-resort backup for reliable user matching on re-login.
CREATE OR REPLACE FUNCTION public.handle_new_user_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    subscription_tier,
    subscription_status,
    facebook_id,
    facebook_name,
    full_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    'inactive',
    NEW.raw_user_meta_data->>'facebook_id',
    NEW.raw_user_meta_data->>'facebook_name',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'facebook_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- IMPORTANT: Run this SQL in Supabase Dashboard SQL Editor
-- URL: https://supabase.com/dashboard/project/ymdgkivkaagfrdnvvqbr/sql/new
-- ============================================================
