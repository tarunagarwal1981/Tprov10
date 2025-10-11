-- ============================================================================
-- VERIFY TRANSFER PACKAGES TABLES EXIST
-- Run this in Supabase SQL Editor to check if tables are set up
-- ============================================================================

-- Check if transfer_packages table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public'
  AND table_name = 'transfer_packages'
) AS transfer_packages_exists;

-- Check if transfer_package_vehicles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public'
  AND table_name = 'transfer_package_vehicles'
) AS transfer_vehicles_exists;

-- Check if transfer_package_images table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public'
  AND table_name = 'transfer_package_images'
) AS transfer_images_exists;

-- Check if transfer_package_stops table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public'
  AND table_name = 'transfer_package_stops'
) AS transfer_stops_exists;

-- Check if transfer_additional_services table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public'
  AND table_name = 'transfer_additional_services'
) AS transfer_services_exists;

-- If all show 'f' (false), you need to run create-transfer-packages-schema-safe.sql first!
-- If all show 't' (true), your tables are set up correctly!

