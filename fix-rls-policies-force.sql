-- Force Fix RLS Policies for Users Table
-- This script forcefully drops and recreates the policies

-- ============================================================================
-- Step 1: Drop existing policies (CASCADE to force removal)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users CASCADE;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users CASCADE;

-- Wait a moment to ensure drops complete
DO $$ BEGIN PERFORM pg_sleep(0.1); END $$;

-- ============================================================================
-- Step 2: Create correct policies for 'authenticated' role
-- ============================================================================

CREATE POLICY "Users can view own profile" 
  ON public.users
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.users
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.users
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- Step 3: Grant permissions
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;

-- ============================================================================
-- Step 4: Verify the fix
-- ============================================================================
SELECT 
  policyname,
  roles,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

