-- Diagnostic Queries for RLS Issue
-- Run these in Supabase SQL Editor to diagnose why the query is timing out

-- ============================================================================
-- 1. CHECK IF USER EXISTS IN USERS TABLE
-- ============================================================================
SELECT 
  id,
  email,
  name,
  role,
  phone,
  created_at,
  updated_at
FROM public.users
WHERE email = 'operator@gmail.com';

-- ============================================================================
-- 2. CHECK IF RLS IS ENABLED ON USERS TABLE
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'users';

-- ============================================================================
-- 3. LIST ALL RLS POLICIES ON USERS TABLE
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

-- ============================================================================
-- 4. CHECK AUTH USER ID
-- ============================================================================
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'operator@gmail.com';

-- ============================================================================
-- 5. CHECK IF THE IDs MATCH
-- ============================================================================
SELECT 
  'auth.users' as source,
  id,
  email
FROM auth.users
WHERE email = 'operator@gmail.com'
UNION ALL
SELECT 
  'public.users' as source,
  id,
  email
FROM public.users
WHERE email = 'operator@gmail.com';

-- ============================================================================
-- 6. TEST RLS POLICY (This simulates what the app does)
-- ============================================================================
-- First, get the user ID
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'operator@gmail.com';
  RAISE NOTICE 'User ID from auth.users: %', user_id;
  
  -- Try to select as that user would (this tests if RLS policies work)
  RAISE NOTICE 'Testing RLS access...';
END $$;

-- ============================================================================
-- 7. CHECK TABLE PERMISSIONS
-- ============================================================================
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'users'
AND grantee IN ('authenticated', 'anon', 'public');

-- ============================================================================
-- 8. FIX: If RLS policies are missing or wrong, run this
-- ============================================================================
-- UNCOMMENT AND RUN ONLY IF POLICIES ARE MISSING OR INCORRECT:

/*
-- Disable RLS temporarily to test
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- OR: Fix the policies if they exist but are wrong
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create correct policies
CREATE POLICY "Users can view own profile" 
  ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.users
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
*/

-- ============================================================================
-- 9. GRANT PERMISSIONS (run if needed)
-- ============================================================================
/*
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;
*/

