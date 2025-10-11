-- Fix Storage Bucket and RLS Policies for Package Creation
-- Run this in Supabase SQL Editor

-- ========================================
-- 1. CHECK STORAGE BUCKET
-- ========================================

-- Check if storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'activity-packages';

-- If bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public)
VALUES ('activity-packages', 'activity-packages', true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 2. STORAGE RLS POLICIES (Fix 500 Error)
-- ========================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload activity package images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view activity package images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own activity package images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own activity package images" ON storage.objects;

-- Policy 1: Allow authenticated users to upload images to activity-packages bucket
CREATE POLICY "Allow authenticated users to upload activity package images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'activity-packages'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Allow public to view images (for public package listings)
CREATE POLICY "Allow public to view activity package images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'activity-packages');

-- Policy 3: Allow users to delete their own images
CREATE POLICY "Allow users to delete their own activity package images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'activity-packages'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow users to update their own images
CREATE POLICY "Allow users to update their own activity package images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'activity-packages'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ========================================
-- 3. ACTIVITY_PACKAGES TABLE RLS (Fix 409 Conflict)
-- ========================================

-- Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'activity_packages';

-- Enable RLS on activity_packages table
ALTER TABLE activity_packages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all published packages" ON activity_packages;
DROP POLICY IF EXISTS "Operators can insert their own packages" ON activity_packages;
DROP POLICY IF EXISTS "Operators can update their own packages" ON activity_packages;
DROP POLICY IF EXISTS "Operators can delete their own packages" ON activity_packages;

-- Policy 1: Anyone can view published packages
CREATE POLICY "Users can view all published packages"
ON activity_packages
FOR SELECT
TO public
USING (status = 'PUBLISHED' OR status = 'published');

-- Policy 2: Operators can view their own packages (all statuses)
CREATE POLICY "Operators can view their own packages"
ON activity_packages
FOR SELECT
TO authenticated
USING (operator_id = auth.uid());

-- Policy 3: Operators can insert their own packages (THIS IS THE KEY ONE)
CREATE POLICY "Operators can insert their own packages"
ON activity_packages
FOR INSERT
TO authenticated
WITH CHECK (operator_id = auth.uid());

-- Policy 4: Operators can update their own packages
CREATE POLICY "Operators can update their own packages"
ON activity_packages
FOR UPDATE
TO authenticated
USING (operator_id = auth.uid())
WITH CHECK (operator_id = auth.uid());

-- Policy 5: Operators can delete their own packages
CREATE POLICY "Operators can delete their own packages"
ON activity_packages
FOR DELETE
TO authenticated
USING (operator_id = auth.uid());

-- ========================================
-- 4. ACTIVITY_PACKAGE_IMAGES TABLE RLS
-- ========================================

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'activity_package_images'
);

-- Enable RLS
ALTER TABLE activity_package_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view package images" ON activity_package_images;
DROP POLICY IF EXISTS "Operators can insert images for their packages" ON activity_package_images;
DROP POLICY IF EXISTS "Operators can update images for their packages" ON activity_package_images;
DROP POLICY IF EXISTS "Operators can delete images for their packages" ON activity_package_images;

-- Policy 1: Anyone can view images
CREATE POLICY "Anyone can view package images"
ON activity_package_images
FOR SELECT
TO public
USING (true);

-- Policy 2: Operators can insert images (with subquery to check package ownership)
CREATE POLICY "Operators can insert images for their packages"
ON activity_package_images
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM activity_packages 
    WHERE activity_packages.id = package_id 
    AND activity_packages.operator_id = auth.uid()
  )
);

-- Policy 3: Operators can update images for their packages
CREATE POLICY "Operators can update images for their packages"
ON activity_package_images
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM activity_packages 
    WHERE activity_packages.id = package_id 
    AND activity_packages.operator_id = auth.uid()
  )
);

-- Policy 4: Operators can delete images for their packages
CREATE POLICY "Operators can delete images for their packages"
ON activity_package_images
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM activity_packages 
    WHERE activity_packages.id = package_id 
    AND activity_packages.operator_id = auth.uid()
  )
);

-- ========================================
-- 5. CHECK CONSTRAINTS ON ACTIVITY_PACKAGES
-- ========================================

-- Check for unique constraints that might cause 409 error
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'activity_packages'
  AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- ========================================
-- 6. VERIFY SETUP
-- ========================================

-- Test 1: Check storage bucket
SELECT 
  id, 
  name, 
  public,
  created_at 
FROM storage.buckets 
WHERE id = 'activity-packages';

-- Test 2: Count policies on storage.objects
SELECT COUNT(*) as storage_policy_count
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- Test 3: Count policies on activity_packages
SELECT COUNT(*) as activity_packages_policy_count
FROM pg_policies 
WHERE tablename = 'activity_packages';

-- Test 4: Count policies on activity_package_images
SELECT COUNT(*) as images_policy_count
FROM pg_policies 
WHERE tablename = 'activity_package_images';

-- ========================================
-- 7. TEST INSERT (Optional - for debugging)
-- ========================================

-- Test if you can insert a package (replace USER_ID with actual user ID)
-- Uncomment to test:
/*
INSERT INTO activity_packages (
  title,
  description,
  operator_id,
  status,
  base_price,
  currency,
  duration_days
) VALUES (
  'Test Package',
  'Test Description',
  '0afbb77a-e2fa-4de8-8a24-2ed473ab7c2c', -- Replace with your user ID
  'DRAFT',
  100.00,
  'USD',
  1
) RETURNING id;
*/

