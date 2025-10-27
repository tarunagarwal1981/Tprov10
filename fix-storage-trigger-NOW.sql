-- ============================================================================
-- FIX STORAGE TRIGGER - RUN THIS IN SUPABASE SQL EDITOR NOW
-- ============================================================================

-- Step 1: Check what triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'storage'
  AND event_object_table = 'objects'
ORDER BY trigger_name;

-- Step 2: Find the problematic function
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%activity%'
  AND routine_name LIKE '%image%';

-- Step 3: DROP the problematic trigger and function
-- (This is safe - we handle inserts manually in our app code)

DROP TRIGGER IF EXISTS handle_activity_package_image_upload ON storage.objects;
DROP FUNCTION IF EXISTS public.handle_activity_package_image_upload();

-- Step 4: Verify triggers are gone
SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'storage'
  AND event_object_table = 'objects'
  AND trigger_name LIKE '%activity%';

-- Should return no results if successfully dropped

-- ============================================================================
-- EXPLANATION:
-- The trigger was trying to auto-insert into activity_package_images table
-- when ANY file was uploaded to activity-package-images bucket.
-- 
-- Problems:
-- 1. Vehicle images should go to transfer_vehicle_images, not activity_package_images
-- 2. The trigger had incorrect type casting (metadata->>'size' returns text, not bigint)
-- 3. We already handle database inserts manually in our application code
-- 
-- Solution: Remove the trigger completely since it's redundant and broken
-- ============================================================================

