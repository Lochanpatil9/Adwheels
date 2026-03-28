-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  AdWheels — Database Schema Fixes & Hardening               ║
-- ║  Run this ENTIRE block in Supabase Dashboard → SQL Editor   ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════
-- 1. Add missing columns to users table
-- ═══════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_verified') THEN
    ALTER TABLE public.users ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ═══════════════════════════════════════
-- 2. Add missing columns to campaigns table
-- ═══════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='activated_at') THEN
    ALTER TABLE public.campaigns ADD COLUMN activated_at TIMESTAMPTZ;
  END IF;
END $$;

-- ═══════════════════════════════════════
-- 3. Fix campaigns status constraint to include paid/cancelled
-- ═══════════════════════════════════════
DO $$
BEGIN
  -- Drop old constraint if exists
  ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
  -- Add new constraint with all statuses
  ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_status_check
    CHECK (status IN ('pending', 'paid', 'active', 'completed', 'cancelled'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Status constraint update skipped: %', SQLERRM;
END $$;

-- ═══════════════════════════════════════
-- 4. Create notifications table if missing
-- ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
DO $$
BEGIN
  CREATE POLICY "Users read own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Policy already exists';
END $$;

-- Service role can insert (backend sends notifications)
DO $$
BEGIN
  CREATE POLICY "Service inserts notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Policy already exists';
END $$;

-- Users can update their own (mark as read)
DO $$
BEGIN
  CREATE POLICY "Users update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Policy already exists';
END $$;

-- Enable realtime for notifications
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'notifications already in publication';
END $$;
-- ═══════════════════════════════════════
-- 5. Create earnings table if missing
-- ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.users(id),
  driver_job_id UUID REFERENCES public.driver_jobs(id),
  amount INTEGER NOT NULL DEFAULT 0,
  earning_date DATE NOT NULL,
  type TEXT DEFAULT 'daily',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════
-- 6. Create payouts table if missing
-- ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.users(id),
  amount INTEGER NOT NULL,
  upi_id TEXT NOT NULL,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'paid', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════
-- 7. Add unique constraint on daily_proofs to prevent duplicate uploads
-- ═══════════════════════════════════════
DO $$
BEGIN
  ALTER TABLE public.daily_proofs ADD CONSTRAINT daily_proofs_unique_per_day
    UNIQUE (driver_job_id, proof_date);
EXCEPTION WHEN duplicate_table THEN
  RAISE NOTICE 'Constraint already exists';
WHEN duplicate_object THEN
  RAISE NOTICE 'Constraint already exists';
END $$;

-- ═══════════════════════════════════════
-- 8. Drop conflicting auth trigger (if exists)
-- ═══════════════════════════════════════
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ═══════════════════════════════════════
-- 9. DONE!
-- ═══════════════════════════════════════
SELECT 'Schema fixes applied successfully!' AS result;
