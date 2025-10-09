-- Test Query to Verify RLS Access
-- This simulates exactly what the app is trying to do

-- ============================================================================
-- 1. Test: Can we query the users table directly? (as superuser)
-- ============================================================================
SELECT 
  id,
  email,
  name,
  role,
  profile,
  created_at
FROM public.users
WHERE email = 'operator@gmail.com';

-- ============================================================================
-- 2. Test: Check the profile column type
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. Test: Check for any triggers on the users table
-- ============================================================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'users';

-- ============================================================================
-- 4. Test: Check table statistics (is the table too large?)
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND tablename = 'users';

-- ============================================================================
-- 5. Test: Look for slow queries or locks
-- ============================================================================
SELECT 
  pid,
  usename,
  state,
  query,
  query_start,
  state_change
FROM pg_stat_activity
WHERE datname = current_database()
AND state != 'idle'
AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start;

-- ============================================================================
-- 6. IMPORTANT: Test the exact query the app uses (simulated as authenticated user)
-- ============================================================================
-- This uses security definer to test as the actual user
CREATE OR REPLACE FUNCTION test_user_select()
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  profile JSONB
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.role::TEXT,
    u.profile
  FROM public.users u
  WHERE u.id = (SELECT id FROM auth.users WHERE email = 'operator@gmail.com' LIMIT 1);
END;
$$;

-- Run the test function
SELECT * FROM test_user_select();

-- Clean up
DROP FUNCTION IF EXISTS test_user_select();

-- ============================================================================
-- 7. Check if there's an issue with the auth.uid() function
-- ============================================================================
SELECT 
  'auth.uid() test' as test_name,
  CASE 
    WHEN auth.uid() IS NULL THEN 'NULL (not authenticated in SQL editor - this is expected)'
    ELSE auth.uid()::TEXT
  END as result;

