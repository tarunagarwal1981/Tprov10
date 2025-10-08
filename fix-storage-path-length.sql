-- Fix storage_path field length issue
-- Run this in Supabase SQL Editor

-- Increase the storage_path field length to handle base64 data
ALTER TABLE activity_package_images 
ALTER COLUMN storage_path TYPE TEXT;

-- Also increase public_url field length for consistency
ALTER TABLE activity_package_images 
ALTER COLUMN public_url TYPE TEXT;
