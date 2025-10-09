-- Fix RLS Policies Step by Step
-- Run each section ONE AT A TIME in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Run this first (drop view policy)
-- ============================================================================
DROP POLICY "Users can view own profile" ON public.users;

-- ============================================================================
-- STEP 2: Run this second (drop update policy)
-- ============================================================================
DROP POLICY "Users can update own profile" ON public.users;

-- ============================================================================
-- STEP 3: Run this third (drop insert policy)
-- ============================================================================
DROP POLICY "Users can insert own profile" ON public.users;

-- ============================================================================
-- STEP 4: Run this fourth (create view policy with authenticated role)
-- ============================================================================
CREATE POLICY "Users can view own profile" 
  ON public.users
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- ============================================================================
-- STEP 5: Run this fifth (create update policy with authenticated role)
-- ============================================================================
CREATE POLICY "Users can update own profile" 
  ON public.users
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- STEP 6: Run this sixth (create insert policy with authenticated role)
-- ============================================================================
CREATE POLICY "Users can insert own profile" 
  ON public.users
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- STEP 7: Run this last (grant permissions)
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;

-- ============================================================================
-- STEP 8: Verify (run this to check the result)
-- ============================================================================
SELECT 
  policyname,
  roles,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

-- You should see roles = {authenticated} for all three policies

