-- Disable RLS on Users Table
-- Run this in Supabase SQL Editor to disable Row-Level Security

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Should show rls_enabled = false

