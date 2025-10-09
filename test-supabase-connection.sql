-- Test if the users table is accessible
-- Run this in Supabase SQL Editor

-- 1. Check if table exists
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_name = 'users';

-- 2. Try a simple count query
SELECT COUNT(*) as total_users FROM public.users;

-- 3. Try to select the operator user
SELECT id, email, name, role, created_at
FROM public.users
WHERE email = 'operator@gmail.com';

-- 4. Check if there are any locks on the table
SELECT 
  pid,
  usename,
  pg_blocking_pids(pid) as blocked_by,
  query as blocked_query
FROM pg_stat_activity
WHERE datname = current_database()
AND state != 'idle'
AND query NOT LIKE '%pg_stat_activity%';

-- 5. Check for long-running queries
SELECT pid, now() - query_start as duration, state, query
FROM pg_stat_activity
WHERE state != 'idle'
AND now() - query_start > interval '5 seconds'
ORDER BY duration DESC;

