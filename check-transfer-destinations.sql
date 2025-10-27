-- ============================================================================
-- Check Transfer Package Destinations
-- ============================================================================
-- Run this BEFORE the migration to see what data needs to be fixed

-- Check for NULL or empty destination_city
SELECT 
  id,
  title,
  destination_city,
  destination_country,
  destination_name,
  status
FROM transfer_packages
WHERE destination_city IS NULL 
   OR trim(destination_city) = ''
   OR destination_country IS NULL 
   OR trim(destination_country) = '';

-- Count packages with missing destinations
SELECT 
  COUNT(*) as total_packages,
  COUNT(CASE WHEN destination_city IS NULL OR trim(destination_city) = '' THEN 1 END) as missing_city,
  COUNT(CASE WHEN destination_country IS NULL OR trim(destination_country) = '' THEN 1 END) as missing_country
FROM transfer_packages;

-- Show all destinations to verify quality
SELECT 
  id,
  title,
  destination_city,
  destination_country,
  created_at
FROM transfer_packages
ORDER BY created_at DESC;

