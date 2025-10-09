-- Re-enable RLS on Users Table
-- Run this in Supabase SQL Editor to properly enable Row-Level Security

-- ============================================================================
-- Step 1: Ensure RLS is enabled
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 2: Drop any existing policies to start fresh
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- ============================================================================
-- Step 3: Create correct RLS policies for 'authenticated' role
-- ============================================================================

-- Policy for SELECT (viewing own profile)
CREATE POLICY "Users can view own profile" 
  ON public.users
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- Policy for UPDATE (updating own profile)
CREATE POLICY "Users can update own profile" 
  ON public.users
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy for INSERT (creating own profile during registration)
CREATE POLICY "Users can insert own profile" 
  ON public.users
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- Step 4: Grant necessary permissions
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- ============================================================================
-- Step 5: Verify the policies
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd as command,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

-- Expected output:
-- All policies should show roles = {authenticated}

-- ============================================================================
-- Step 6: Test query as authenticated user
-- ============================================================================
-- This verifies the operator user can access their profile
SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM public.users
WHERE email = 'operator@gmail.com';

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- After running this:
-- ✅ RLS is enabled
-- ✅ Policies are correct (for authenticated role)
-- ✅ Login should work without timeout or fallback
-- ✅ User role will be loaded from database

