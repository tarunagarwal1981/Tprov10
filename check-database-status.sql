-- Diagnostic Query: Check Database Status
-- Run this in Supabase SQL Editor to see what's configured

-- 1. Check if users table exists
SELECT 
  'users table' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    ) THEN 'EXISTS ✅'
    ELSE 'MISSING ❌'
  END as status;

-- 2. Check if users table has RLS enabled
SELECT 
  'RLS on users table' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'users' 
      AND rowsecurity = true
    ) THEN 'ENABLED ✅'
    ELSE 'DISABLED ❌'
  END as status;

-- 3. Check RLS policies on users table
SELECT 
  'RLS policies count' as check_type,
  COUNT(*)::text || ' policies' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- 4. List all RLS policies on users table
SELECT 
  policyname as policy_name,
  cmd as command,
  qual as using_expression
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

-- 5. Check if operator user exists in users table
SELECT 
  'operator@gmail.com in users table' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE email = 'operator@gmail.com'
    ) THEN 'EXISTS ✅'
    ELSE 'MISSING ❌'
  END as status;

-- 6. Check operator user details (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) THEN
    -- If users table exists, show the operator record
    RAISE NOTICE 'Checking operator user...';
  END IF;
END $$;

SELECT 
  id,
  email,
  name,
  role,
  created_at,
  updated_at
FROM public.users
WHERE email = 'operator@gmail.com'
LIMIT 1;

-- 7. Check auth.users for operator
SELECT 
  'operator@gmail.com in auth.users' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM auth.users 
      WHERE email = 'operator@gmail.com'
    ) THEN 'EXISTS ✅'
    ELSE 'MISSING ❌'
  END as status;

-- 8. Check operator auth metadata
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'role' as metadata_role,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'operator@gmail.com'
LIMIT 1;

