-- Add missing updated_at column to profiles table
-- Our code updates updated_at in: facebook-exchange, webhook, check-subscription
-- Without this column, all those updates fail silently

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing rows
UPDATE public.profiles SET updated_at = created_at WHERE updated_at IS NULL;

-- Create index for sorting by updated_at
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);
