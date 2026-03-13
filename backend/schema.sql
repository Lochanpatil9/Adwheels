-- ═══════════════════════════════════════════
-- AdWheels Database Schema
-- Copy this ENTIRE file → Supabase Dashboard → SQL Editor → New query → Paste → Run
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'indore',
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver', 'advertiser')),
  vehicle_number TEXT,
  upi_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins full access" ON users;
CREATE POLICY "Admins full access" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price NUMERIC NOT NULL,
  duration_days INTEGER NOT NULL,
  impressions TEXT,
  features JSONB DEFAULT '[]',
  popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read plans" ON plans;
CREATE POLICY "Anyone can read plans" ON plans FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  business_name TEXT NOT NULL,
  banner_url TEXT,
  city TEXT NOT NULL DEFAULT 'indore',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'completed', 'rejected')),
  start_date DATE,
  end_date DATE,
  amount_paid NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Advertisers can read own campaigns" ON campaigns;
CREATE POLICY "Advertisers can read own campaigns" ON campaigns FOR SELECT USING (auth.uid() = advertiser_id);
DROP POLICY IF EXISTS "Advertisers can insert own campaigns" ON campaigns;
CREATE POLICY "Advertisers can insert own campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = advertiser_id);
DROP POLICY IF EXISTS "Admins can read all campaigns" ON campaigns;
CREATE POLICY "Admins can read all campaigns" ON campaigns FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Admins can update campaigns" ON campaigns;
CREATE POLICY "Admins can update campaigns" ON campaigns FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id),
  city TEXT NOT NULL DEFAULT 'indore',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'proof_uploaded', 'completed')),
  earning NUMERIC DEFAULT 0,
  proof_url TEXT,
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Drivers can read available and own jobs" ON jobs;
CREATE POLICY "Drivers can read available and own jobs" ON jobs FOR SELECT USING (
  driver_id = auth.uid() OR status = 'open'
);
DROP POLICY IF EXISTS "Drivers can update assigned jobs" ON jobs;
CREATE POLICY "Drivers can update assigned jobs" ON jobs FOR UPDATE USING (driver_id = auth.uid());
DROP POLICY IF EXISTS "Admins can manage all jobs" ON jobs;
CREATE POLICY "Admins can manage all jobs" ON jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  upi_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Drivers can read own payouts" ON payouts;
CREATE POLICY "Drivers can read own payouts" ON payouts FOR SELECT USING (auth.uid() = driver_id);
DROP POLICY IF EXISTS "Drivers can insert own payouts" ON payouts;
CREATE POLICY "Drivers can insert own payouts" ON payouts FOR INSERT WITH CHECK (auth.uid() = driver_id);
DROP POLICY IF EXISTS "Admins can manage payouts" ON payouts;
CREATE POLICY "Admins can manage payouts" ON payouts FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE TABLE IF NOT EXISTS enterprise_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT NOT NULL,
  budget TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE enterprise_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read leads" ON enterprise_leads;
CREATE POLICY "Admins can read leads" ON enterprise_leads FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Anyone can insert leads" ON enterprise_leads;
CREATE POLICY "Anyone can insert leads" ON enterprise_leads FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert registrations" ON registrations;
CREATE POLICY "Anyone can insert registrations" ON registrations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can read registrations" ON registrations;
CREATE POLICY "Admins can read registrations" ON registrations FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload banners" ON storage.objects;
CREATE POLICY "Authenticated users can upload banners" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banners');
DROP POLICY IF EXISTS "Anyone can read banners" ON storage.objects;
CREATE POLICY "Anyone can read banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
DROP POLICY IF EXISTS "Authenticated users can upload proofs" ON storage.objects;
CREATE POLICY "Authenticated users can upload proofs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'proofs');
DROP POLICY IF EXISTS "Anyone can read proofs" ON storage.objects;
CREATE POLICY "Anyone can read proofs" ON storage.objects FOR SELECT USING (bucket_id = 'proofs');
