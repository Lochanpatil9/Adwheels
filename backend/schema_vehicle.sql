-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  AdWheels — Vehicle & Profile Schema Extensions             ║
-- ║  Run this ENTIRE block in Supabase Dashboard → SQL Editor   ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════
-- 1. Profile extensions (avatar, DOB, email)
-- ═══════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') THEN
    ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email') THEN
    ALTER TABLE public.users ADD COLUMN email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='date_of_birth') THEN
    ALTER TABLE public.users ADD COLUMN date_of_birth DATE;
  END IF;
END $$;

-- ═══════════════════════════════════════
-- 2. Vehicle classification columns
-- ═══════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='vehicle_type') THEN
    ALTER TABLE public.users ADD COLUMN vehicle_type TEXT CHECK (vehicle_type IN ('auto_rickshaw', 'e_rickshaw', 'cycle_rickshaw'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='fuel_type') THEN
    ALTER TABLE public.users ADD COLUMN fuel_type TEXT CHECK (fuel_type IN ('petrol', 'cng', 'electric', 'manual'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='vehicle_size') THEN
    ALTER TABLE public.users ADD COLUMN vehicle_size TEXT CHECK (vehicle_size IN ('small', 'medium', 'large'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='vehicle_year') THEN
    ALTER TABLE public.users ADD COLUMN vehicle_year INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='vehicle_make') THEN
    ALTER TABLE public.users ADD COLUMN vehicle_make TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='vehicle_model') THEN
    ALTER TABLE public.users ADD COLUMN vehicle_model TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='has_back_panel') THEN
    ALTER TABLE public.users ADD COLUMN has_back_panel BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='has_side_panels') THEN
    ALTER TABLE public.users ADD COLUMN has_side_panels BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ad_space_sqft') THEN
    ALTER TABLE public.users ADD COLUMN ad_space_sqft NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='vehicle_photo_url') THEN
    ALTER TABLE public.users ADD COLUMN vehicle_photo_url TEXT;
  END IF;
END $$;

-- ═══════════════════════════════════════
-- 3. Create avatars storage bucket
-- ═══════════════════════════════════════
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can read avatars" ON storage.objects;
CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');

-- ═══════════════════════════════════════
-- 4. Create vehicle_photos storage bucket
-- ═══════════════════════════════════════
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle_photos', 'vehicle_photos', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload vehicle photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload vehicle photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle_photos');

DROP POLICY IF EXISTS "Anyone can read vehicle photos" ON storage.objects;
CREATE POLICY "Anyone can read vehicle photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle_photos');

-- ═══════════════════════════════════════
-- 5. DONE!
-- ═══════════════════════════════════════
SELECT 'Vehicle & Profile schema extensions applied successfully!' AS result;
