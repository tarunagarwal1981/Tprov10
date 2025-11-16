-- ============================================================================
-- FIX STORAGE TRIGGER WITH CASCADE - RUN THIS NOW
-- ============================================================================

-- Drop the trigger first
DROP TRIGGER IF EXISTS handle_activity_package_image_upload_trigger ON storage.objects;

-- Now drop the function (should work without CASCADE now)
DROP FUNCTION IF EXISTS public.handle_activity_package_image_upload();

-- Verify it's gone
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_schema = 'storage'
  AND event_object_table = 'objects'
  AND trigger_name LIKE '%activity%';

-- Should return empty (no results) if successfully dropped


