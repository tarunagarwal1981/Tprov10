-- Quick RLS Test
-- Run these one at a time to diagnose the issue

-- Test 1: Simple select (should work - you're superuser in SQL editor)
SELECT * FROM public.users WHERE email = 'operator@gmail.com';

-- Test 2: Temporarily disable RLS to test if that's the issue
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Now try logging in from your app - it should work instantly!
-- After testing, come back and re-enable RLS:

-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

