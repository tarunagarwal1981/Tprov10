-- ============================================================================
-- Fix Storage Objects File Size Type Issue
-- ============================================================================
-- This fixes the error: column "file_size" is of type bigint but expression is of type text
-- The issue is that Supabase Storage internal table has a type mismatch

-- Check current column types in storage.objects
SELECT 
  column_name, 
  data_type, 
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'storage' 
  AND table_name = 'objects'
  AND column_name IN ('file_size', 'metadata', 'user_metadata')
ORDER BY ordinal_position;

-- If you see file_size as text or varchar, this query will fix it:
-- NOTE: This should not be necessary in a standard Supabase project
-- Run this ONLY if the above query shows file_size is not bigint

-- First, backup the table (optional but recommended)
-- CREATE TABLE storage.objects_backup AS SELECT * FROM storage.objects;

-- Try to fix the column type if needed
-- ALTER TABLE storage.objects 
--   ALTER COLUMN file_size TYPE bigint USING (file_size::bigint);

-- If the above doesn't work, the issue might be in the bucket configuration
-- Check bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'activity-package-images';

-- Ensure the bucket has proper configuration
UPDATE storage.buckets
SET 
  public = true,
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
WHERE id = 'activity-package-images';

-- If the bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'activity-package-images',
  'activity-package-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Verify the bucket exists and is configured correctly
SELECT * FROM storage.buckets WHERE id = 'activity-package-images';

