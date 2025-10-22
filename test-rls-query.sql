-- Test if RLS is blocking the query
-- Run this in Supabase SQL Editor while logged in as the operator user

-- 1. Check current auth context
SELECT 
  auth.uid() as current_user_id,
  auth.jwt() as current_jwt;

-- 2. Try the exact query the app is doing
SELECT *
FROM public.users
WHERE id = '0afbb77a-e2fa-4de8-8a24-2ed473ab7c2c';

-- 3. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- 4. Test query performance
EXPLAIN ANALYZE
SELECT *
FROM public.users
WHERE id = '0afbb77a-e2fa-4de8-8a24-2ed473ab7c2c';

-- 5. Check if there are any slow indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users';


