-- Migration: Add razorpay_payment_id column, RLS policy, and auto_assign_drivers function
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

-- ── 3. auto_assign_drivers: assign available verified drivers to a paid campaign ─
--
-- Called by the client immediately after marking a campaign as paid.
-- Picks drivers in the same city as the campaign, up to the plan's rickshaw_count,
-- skipping any driver already assigned to an active campaign.
-- Creates a driver_jobs row for each assigned driver and updates campaigns.status
-- to 'active' once at least one driver is assigned.

CREATE OR REPLACE FUNCTION auto_assign_drivers(campaign_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as the DB owner so it can bypass RLS for internal assignments
AS $$
DECLARE
  v_city           TEXT;
  v_rickshaw_count INT;
  v_driver         RECORD;
  v_assigned       INT := 0;
BEGIN
  -- Fetch campaign details
  SELECT c.city, p.rickshaw_count
  INTO   v_city, v_rickshaw_count
  FROM   campaigns c
  JOIN   plans     p ON p.id = c.plan_id
  WHERE  c.id = campaign_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign % not found', campaign_id;
  END IF;

  -- Loop over available verified drivers in the same city
  FOR v_driver IN
    SELECT u.id
    FROM   users u
    WHERE  u.role        = 'driver'
      AND  u.is_verified = TRUE
      AND  u.city        = v_city
      -- exclude drivers already assigned to a running campaign
      AND  NOT EXISTS (
             SELECT 1
             FROM   driver_jobs dj
             JOIN   campaigns   ca ON ca.id = dj.campaign_id
             WHERE  dj.driver_id = u.id
               AND  dj.status   != 'rejected'
               AND  ca.status   IN ('paid', 'active')
           )
    LIMIT v_rickshaw_count
  LOOP
    INSERT INTO driver_jobs (driver_id, campaign_id, status)
    VALUES (v_driver.id, campaign_id, 'active')
    ON CONFLICT DO NOTHING;

    v_assigned := v_assigned + 1;
  END LOOP;

  -- Promote campaign to 'active' if at least one driver was assigned
  IF v_assigned > 0 THEN
    UPDATE campaigns
    SET    status    = 'active',
           starts_at = NOW()
    WHERE  id        = campaign_id;
  END IF;
END;
$$;

