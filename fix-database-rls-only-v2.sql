-- Fix Database RLS Policies for Package Creation
-- Version 2: Uses lowercase status values

-- ========================================
-- 1. ACTIVITY_PACKAGES TABLE RLS
-- ========================================

-- Enable RLS
ALTER TABLE activity_packages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all published packages" ON activity_packages;
DROP POLICY IF EXISTS "Operators can view their own packages" ON activity_packages;
DROP POLICY IF EXISTS "Operators can insert their own packages" ON activity_packages;
DROP POLICY IF EXISTS "Operators can update their own packages" ON activity_packages;
DROP POLICY IF EXISTS "Operators can delete their own packages" ON activity_packages;

-- Policy 1: Anyone can view published packages (using lowercase 'published')
CREATE POLICY "Users can view all published packages"
ON activity_packages
FOR SELECT
TO public
USING (status = 'published');

-- Policy 2: Operators can view their own packages (all statuses)
CREATE POLICY "Operators can view their own packages"
ON activity_packages
FOR SELECT
TO authenticated
USING (operator_id = auth.uid());

-- Policy 3: Operators can insert their own packages (FIXES 409 CONFLICT)
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
-- 2. ACTIVITY_PACKAGE_IMAGES TABLE RLS
-- ========================================

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
-- 3. RELATED TABLES RLS (if they exist)
-- ========================================

-- Activity Package Time Slots
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_package_time_slots') THEN
    ALTER TABLE activity_package_time_slots ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Anyone can view time slots" ON activity_package_time_slots;
    CREATE POLICY "Anyone can view time slots"
    ON activity_package_time_slots FOR SELECT TO public USING (true);
    
    DROP POLICY IF EXISTS "Operators can manage time slots for their packages" ON activity_package_time_slots;
    CREATE POLICY "Operators can manage time slots for their packages"
    ON activity_package_time_slots FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM activity_packages 
        WHERE activity_packages.id = package_id 
        AND activity_packages.operator_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Activity Package Variants
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_package_variants') THEN
    ALTER TABLE activity_package_variants ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Anyone can view variants" ON activity_package_variants;
    CREATE POLICY "Anyone can view variants"
    ON activity_package_variants FOR SELECT TO public USING (true);
    
    DROP POLICY IF EXISTS "Operators can manage variants for their packages" ON activity_package_variants;
    CREATE POLICY "Operators can manage variants for their packages"
    ON activity_package_variants FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM activity_packages 
        WHERE activity_packages.id = package_id 
        AND activity_packages.operator_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Activity Package FAQs
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_package_faqs') THEN
    ALTER TABLE activity_package_faqs ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Anyone can view faqs" ON activity_package_faqs;
    CREATE POLICY "Anyone can view faqs"
    ON activity_package_faqs FOR SELECT TO public USING (true);
    
    DROP POLICY IF EXISTS "Operators can manage faqs for their packages" ON activity_package_faqs;
    CREATE POLICY "Operators can manage faqs for their packages"
    ON activity_package_faqs FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM activity_packages 
        WHERE activity_packages.id = package_id 
        AND activity_packages.operator_id = auth.uid()
      )
    );
  END IF;
END $$;

-- ========================================
-- 4. VERIFY POLICIES CREATED
-- ========================================

-- Check activity_packages policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'activity_packages'
ORDER BY cmd, policyname;

-- Check activity_package_images policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'activity_package_images'
ORDER BY cmd, policyname;

-- Done!

