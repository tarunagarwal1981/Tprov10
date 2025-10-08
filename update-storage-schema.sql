-- Update storage path fields to handle proper file paths
-- Run this in Supabase SQL Editor

-- Change storage_path and public_url to TEXT to handle longer paths
ALTER TABLE activity_package_images 
ALTER COLUMN storage_path TYPE TEXT;

ALTER TABLE activity_package_images 
ALTER COLUMN public_url TYPE TEXT;
