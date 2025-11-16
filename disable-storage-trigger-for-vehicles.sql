-- ============================================================================
-- DISABLE AUTOMATIC STORAGE TRIGGER FOR VEHICLE IMAGES
-- ============================================================================
-- This trigger is causing issues when uploading vehicle images because:
-- 1. It tries to insert into activity_package_images (wrong table for vehicles)
-- 2. It has incorrect type casting (file_size as text instead of bigint)
-- 
-- We handle database inserts manually in our application code, so this
-- automatic trigger is not needed and is actually causing 500 errors.
-- ============================================================================

-- First, check what triggers exist on the storage.objects table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'storage'
  AND event_object_table = 'objects'
  AND trigger_name LIKE '%activity%';

-- Option 1: Drop the trigger completely (recommended)
-- DROP TRIGGER IF EXISTS handle_activity_package_image_upload ON storage.objects;

-- Option 2: Disable the trigger (can be re-enabled later)
-- ALTER TABLE storage.objects DISABLE TRIGGER handle_activity_package_image_upload;

-- Option 3: Modify the trigger to handle vehicle images correctly
-- (This is more complex and requires recreating the trigger function)


