-- Fix RLS Policies for Users Table
-- The policies were created for 'public' role but should be for 'authenticated' role
-- Run this in Supabase SQL Editor

-- ============================================================================
-- Step 1: Drop the existing incorrect policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- ============================================================================
-- Step 2: Create correct policies for 'authenticated' role
-- ============================================================================

-- Policy for SELECT (viewing own profile)
CREATE POLICY "Users can view own profile" 
  ON public.users
  FOR SELECT 
  TO authenticated  -- This is the key change!
  USING (auth.uid() = id);

-- Policy for UPDATE (updating own profile)
CREATE POLICY "Users can update own profile" 
  ON public.users
  FOR UPDATE 
  TO authenticated  -- This is the key change!
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy for INSERT (creating own profile)
CREATE POLICY "Users can insert own profile" 
  ON public.users
  FOR INSERT 
  TO authenticated  -- This is the key change!
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- Step 3: Verify the policies are correct
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

-- You should now see roles = {authenticated} instead of {public}

-- ============================================================================
-- Step 4: Grant necessary permissions
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- After running this, your login should work without the 5-second timeout!
-- The app will be able to read the user profile from the database.

