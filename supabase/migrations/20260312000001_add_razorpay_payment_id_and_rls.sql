-- Migration: Add razorpay_payment_id column and RLS policy for advertiser payments
--
-- ROOT CAUSE: After a successful Razorpay payment the campaign was not being
-- marked as paid because:
--   1. The combined update { status, razorpay_payment_id } failed entirely since
--      razorpay_payment_id column did not exist in the campaigns table.
--   2. No RLS UPDATE policy existed for authenticated advertisers, so even the
--      { status: 'paid' } update was silently blocked (0 rows updated, no error).
--
-- HOW TO APPLY:
--   Open your Supabase project → SQL Editor → paste and run this file.
--   (Or run: supabase db push  if you use the Supabase CLI.)

-- ── 1. Add razorpay_payment_id column ─────────────────────────────────────────
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- ── 2. RLS: allow advertisers to mark their OWN pending campaigns as paid ──────
--
-- USING  clause:  which rows can be targeted   → must own the row AND it must be 'pending'
-- WITH CHECK clause: what the row may look like → must still own it AND new status = 'paid'
--
-- This prevents:
--   • Updating someone else's campaign
--   • Setting status to anything other than 'paid' through this policy
--   • Re-updating an already active/completed campaign

DROP POLICY IF EXISTS "Advertisers can mark own campaigns as paid" ON campaigns;

CREATE POLICY "Advertisers can mark own campaigns as paid"
  ON campaigns
  FOR UPDATE
  TO authenticated
  USING  (advertiser_id = auth.uid() AND status = 'pending')
  WITH CHECK (advertiser_id = auth.uid() AND status = 'paid');
