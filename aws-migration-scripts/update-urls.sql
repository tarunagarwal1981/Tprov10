-- Update Database URLs from Supabase to S3
-- Run this directly with psql

-- Update public_url
UPDATE activity_package_images
SET public_url = REPLACE(
  public_url,
    'https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public/activity-package-images/',
    'https://travel-app-storage-1769.s3.us-east-1.amazonaws.com/activity-package-images/'
)
WHERE public_url LIKE '%supabase.co%';

-- Update storage_path
UPDATE activity_package_images
SET storage_path = REPLACE(
    storage_path,
    'https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public/activity-package-images/',
    'activity-package-images/'
)
WHERE storage_path LIKE '%supabase.co%';

-- Verify
SELECT 
    COUNT(*) FILTER (WHERE public_url LIKE '%supabase.co%' OR storage_path LIKE '%supabase.co%') as remaining,
    COUNT(*) FILTER (WHERE public_url LIKE '%s3.amazonaws.com%') as s3_count
FROM activity_package_images;

-- Show sample
SELECT id, LEFT(public_url, 80) as url
FROM activity_package_images
WHERE public_url LIKE '%s3.amazonaws.com%'
LIMIT 3;
