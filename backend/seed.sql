-- ═══════════════════════════════════════════════════════════════
-- AdWheels Seed Data
-- Run this AFTER the schema has been created
-- ═══════════════════════════════════════════════════════════════

-- ────────────────────────────────────
-- 1. Plans (core pricing data)
-- ────────────────────────────────────
INSERT INTO plans (id, name, price, duration_days, impressions, popular, features) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Starter',  4999, 7,  '~50K views',  false, '["7-day campaign", "1 city", "Auto rickshaws", "Basic analytics"]'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Growth',   9999, 14, '~150K views', true,  '["14-day campaign", "1 city", "Autos + cabs", "Real-time tracking", "Photo proofs"]'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Pro',     19999, 30, '~500K views', false, '["30-day campaign", "Multi-city", "All vehicle types", "Priority placement", "Dedicated manager"]')
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────
-- 2. Demo Users
--    NOTE: These are profile rows only.
--    You must first create these users via Supabase Auth
--    (Dashboard → Authentication → Users → Add user)
--    using the emails below, then copy the generated UUID
--    and replace the ids here before running.
-- ────────────────────────────────────

-- OPTION A: If you want to manually create auth users first,
--           replace these UUIDs with the real ones from Auth.

-- Admin user
-- Email: admin@adwheels.com  |  Password: Admin@123
INSERT INTO users (id, full_name, phone, city, role) VALUES
  ('00000000-0000-4000-8000-000000000001', 'Rajat Admin', '+91 98765 00001', 'indore', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Advertiser user
-- Email: advertiser@test.com  |  Password: Test@123
INSERT INTO users (id, full_name, phone, city, role) VALUES
  ('00000000-0000-4000-8000-000000000002', 'Priya Sharma', '+91 98765 00002', 'indore', 'advertiser')
ON CONFLICT (id) DO NOTHING;

-- Driver user
-- Email: driver@test.com  |  Password: Test@123
INSERT INTO users (id, full_name, phone, city, role, vehicle_number, upi_id) VALUES
  ('00000000-0000-4000-8000-000000000003', 'Amit Patel', '+91 98765 00003', 'indore', 'driver', 'MP09 AB 1234', 'amit@upi')
ON CONFLICT (id) DO NOTHING;

-- Second driver
-- Email: driver2@test.com  |  Password: Test@123
INSERT INTO users (id, full_name, phone, city, role, vehicle_number, upi_id) VALUES
  ('00000000-0000-4000-8000-000000000004', 'Suresh Kumar', '+91 98765 00004', 'bhopal', 'driver', 'MP04 CD 5678', 'suresh@upi')
ON CONFLICT (id) DO NOTHING;

-- Second advertiser
-- Email: advertiser2@test.com  |  Password: Test@123
INSERT INTO users (id, full_name, phone, city, role) VALUES
  ('00000000-0000-4000-8000-000000000005', 'Neha Technologies', '+91 98765 00005', 'bhopal', 'advertiser')
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────
-- 3. Campaigns
-- ────────────────────────────────────
INSERT INTO campaigns (id, advertiser_id, plan_id, business_name, city, status, start_date, end_date, amount_paid) VALUES
  -- Active campaign by Priya
  ('c0000000-0001-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000002',
   'a1b2c3d4-0002-4000-8000-000000000002',
   'Priya Fashion Store', 'indore', 'active',
   CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '11 days', 9999),

  -- Pending campaign by Priya
  ('c0000000-0002-4000-8000-000000000002',
   '00000000-0000-4000-8000-000000000002',
   'a1b2c3d4-0001-4000-8000-000000000001',
   'Priya Summer Sale', 'indore', 'pending',
   NULL, NULL, 4999),

  -- Active campaign by Neha
  ('c0000000-0003-4000-8000-000000000003',
   '00000000-0000-4000-8000-000000000005',
   'a1b2c3d4-0003-4000-8000-000000000003',
   'Neha Tech Solutions', 'bhopal', 'active',
   CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', 19999),

  -- Completed campaign by Neha
  ('c0000000-0004-4000-8000-000000000004',
   '00000000-0000-4000-8000-000000000005',
   'a1b2c3d4-0001-4000-8000-000000000001',
   'Neha App Launch', 'bhopal', 'completed',
   CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '23 days', 4999)
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────
-- 4. Jobs
-- ────────────────────────────────────
INSERT INTO jobs (id, campaign_id, driver_id, city, status, earning, assigned_at, completed_at) VALUES
  -- Amit's completed job for Priya's active campaign
  ('j0000000-0001-4000-8000-000000000001',
   'c0000000-0001-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000003',
   'indore', 'completed', 350,
   CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '1 day'),

  -- Amit's in-progress job for Priya's active campaign
  ('j0000000-0002-4000-8000-000000000002',
   'c0000000-0001-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000003',
   'indore', 'in_progress', 350,
   CURRENT_DATE - INTERVAL '1 day', NULL),

  -- Open job for Priya's active campaign (no driver yet)
  ('j0000000-0003-4000-8000-000000000003',
   'c0000000-0001-4000-8000-000000000001',
   NULL,
   'indore', 'open', 300,
   NULL, NULL),

  -- Suresh's completed job for Neha's active campaign
  ('j0000000-0004-4000-8000-000000000004',
   'c0000000-0003-4000-8000-000000000003',
   '00000000-0000-4000-8000-000000000004',
   'bhopal', 'completed', 500,
   CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE - INTERVAL '5 days'),

  -- Suresh's proof_uploaded job for Neha's active campaign
  ('j0000000-0005-4000-8000-000000000005',
   'c0000000-0003-4000-8000-000000000003',
   '00000000-0000-4000-8000-000000000004',
   'bhopal', 'proof_uploaded', 500,
   CURRENT_DATE - INTERVAL '4 days', NULL),

  -- Open job in Bhopal
  ('j0000000-0006-4000-8000-000000000006',
   'c0000000-0003-4000-8000-000000000003',
   NULL,
   'bhopal', 'open', 400,
   NULL, NULL),

  -- Amit's completed job for Neha's old campaign
  ('j0000000-0007-4000-8000-000000000007',
   'c0000000-0004-4000-8000-000000000004',
   '00000000-0000-4000-8000-000000000003',
   'bhopal', 'completed', 250,
   CURRENT_DATE - INTERVAL '28 days', CURRENT_DATE - INTERVAL '25 days')
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────
-- 5. Payouts
-- ────────────────────────────────────
INSERT INTO payouts (id, driver_id, amount, upi_id, status) VALUES
  -- Amit got paid ₹350 already
  ('p0000000-0001-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000003',
   350, 'amit@upi', 'paid'),

  -- Amit has a pending payout request
  ('p0000000-0002-4000-8000-000000000002',
   '00000000-0000-4000-8000-000000000003',
   250, 'amit@upi', 'pending'),

  -- Suresh got paid ₹500
  ('p0000000-0003-4000-8000-000000000003',
   '00000000-0000-4000-8000-000000000004',
   500, 'suresh@upi', 'paid')
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────
-- 6. Enterprise Leads (sample inquiries)
-- ────────────────────────────────────
INSERT INTO enterprise_leads (id, company, contact, email, budget, message) VALUES
  ('e0000000-0001-4000-8000-000000000001',
   'Zomato Indore', 'Rahul Mehta', 'rahul@zomato.example',
   '₹50,000+', 'We want to run auto ads across Indore for our new delivery service launch.'),
  ('e0000000-0002-4000-8000-000000000002',
   'BookMyShow', 'Anita Desai', 'anita@bms.example',
   '₹1,00,000+', 'Looking for multi-city campaign for upcoming movie promotions.')
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────
-- 7. Registrations (landing page signups)
-- ────────────────────────────────────
INSERT INTO registrations (id, name, phone, city, role) VALUES
  ('r0000000-0001-4000-8000-000000000001', 'Vikram Singh',   '+91 99887 76655', 'indore', 'driver'),
  ('r0000000-0002-4000-8000-000000000002', 'Meena Textiles', '+91 88776 65544', 'indore', 'advertiser'),
  ('r0000000-0003-4000-8000-000000000003', 'Raju Auto',      '+91 77665 54433', 'bhopal', 'driver'),
  ('r0000000-0004-4000-8000-000000000004', 'Cafe Delight',   '+91 66554 43322', 'bhopal', 'advertiser')
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- DONE! Your database now has:
--   ✓ 3 pricing plans (Starter, Growth, Pro)
--   ✓ 5 users (1 admin, 2 advertisers, 2 drivers)
--   ✓ 4 campaigns (2 active, 1 pending, 1 completed)
--   ✓ 7 jobs (2 completed, 1 in_progress, 1 proof_uploaded, 2 open, 1 old completed)
--   ✓ 3 payouts (2 paid, 1 pending)
--   ✓ 2 enterprise leads
--   ✓ 4 landing page registrations
--
-- IMPORTANT: The demo user profiles above use placeholder UUIDs.
-- For login to work, you must FIRST create auth users in
-- Supabase Dashboard → Authentication → Users → Add user
-- with these emails/passwords, then UPDATE the user ids in
-- the users table to match the auth-generated UUIDs.
--
-- Quick test accounts to create in Auth:
--   admin@adwheels.com    / Admin@123    → role: admin
--   advertiser@test.com   / Test@123     → role: advertiser
--   driver@test.com       / Test@123     → role: driver
-- ═══════════════════════════════════════════════════════════════
