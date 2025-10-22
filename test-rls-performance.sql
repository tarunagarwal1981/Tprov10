-- Test RLS Performance and Connectivity
-- Run this in Supabase SQL Editor

-- Test 1: Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Test 2: Direct query (bypasses RLS - admin view)
SELECT id, email, name, role, created_at
FROM public.users
WHERE id = '0afbb77a-e2fa-4de8-8a24-2ed473ab7c2c';

-- Test 3: Check RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- Test 4: Test the exact query that the app uses
-- This simulates the query from an authenticated user's perspective
-- Note: This will only work if you're logged in as this user in the SQL editor
SELECT *
FROM public.users
WHERE id = '0afbb77a-e2fa-4de8-8a24-2ed473ab7c2c';

-- Test 5: Check for slow query issues
EXPLAIN ANALYZE
SELECT *
FROM public.users
WHERE id = '0afbb77a-e2fa-4de8-8a24-2ed473ab7c2c';

-- Test 6: Check if there's an index on id
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'users';

