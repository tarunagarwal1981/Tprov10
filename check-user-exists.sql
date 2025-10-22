-- ============================================================================
-- STEP 1: Check if the operator user exists in the database
-- ============================================================================

-- Check if user exists
SELECT 
  id, 
  email, 
  name, 
  role, 
  profile,
  phone,
  created_at,
  updated_at
FROM public.users
WHERE id = '0afbb77a-e2fa-4de8-8a24-2ed473ab7c2c';

-- Expected result: Should return 1 row with the operator user details
-- If it returns 0 rows, the user doesn't exist (proceed to STEP 2)
-- If it returns 1 row, the user exists (proceed to STEP 3 for RLS check)

-- ============================================================================
-- STEP 2: Create the user if it doesn't exist
-- ============================================================================

-- Only run this if STEP 1 returned no rows
INSERT INTO public.users (id, email, name, role, profile, phone, created_at, updated_at)
VALUES (
  '0afbb77a-e2fa-4de8-8a24-2ed473ab7c2c',
  'operator@gmail.com',
  'Tour Operator',
  'TOUR_OPERATOR',
  '{"timezone": "UTC", "language": "en", "currency": "USD", "notification_preferences": {"email": true, "sms": false, "push": true, "marketing": false}}'::jsonb,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify it was created
SELECT id, email, name, role FROM public.users WHERE id = '0afbb77a-e2fa-4de8-8a24-2ed473ab7c2c';

-- ============================================================================
-- STEP 3: Check RLS (Row Level Security) status
-- ============================================================================

-- Check if RLS is enabled on the users table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Check existing RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- ============================================================================
-- STEP 4: Fix RLS policies if needed
-- ============================================================================

-- Drop existing policies if they're wrong
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;

-- Create correct RLS policies
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

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Test the query as an authenticated user
-- ============================================================================

-- This simulates what the app does
-- Note: You need to be logged in as the user for this to work in SQL editor
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.profile,
  auth.uid() as current_auth_user,
  (auth.uid() = u.id) as can_access
FROM public.users u
WHERE u.id = '0afbb77a-e2fa-4de8-8a24-2ed473ab7c2c';

-- Expected: Should return the user data if RLS is working correctly

-- ============================================================================
-- STEP 6: If still not working, temporarily disable RLS for testing
-- ============================================================================

-- WARNING: Only do this for testing, not in production!
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Test again, then re-enable:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Final check - this should return 1 row
SELECT 
  'User exists: ' || COUNT(*)::text as status
FROM public.users
WHERE id = '0afbb77a-e2fa-4de8-8a24-2ed473ab7c2c';

-- This should return 3 policies
SELECT 
  'RLS policies: ' || COUNT(*)::text as status
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

