-- ========================================
-- CLEANUP UNUSED DATABASE TABLES
-- ========================================
-- This script removes unused tables from the transfer packages schema
-- 
-- ⚠️ IMPORTANT: Backup your database before running this script!
--
-- Tables to be removed:
-- 1. transfer_pricing_rules
-- 2. transfer_vehicle_images
-- 3. transfer_time_slots
-- 4. transfer_booking_restrictions
--
-- These tables are not being used in the application code and were
-- created as part of the initial schema but never implemented in the UI/service layer.
-- ========================================

-- Step 1: Show current transfer tables
SELECT 
  'BEFORE CLEANUP - Current Transfer Tables:' as status,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'transfer_%';

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'transfer_%'
ORDER BY table_name;

-- ========================================
-- Step 2: Drop RLS policies first (if they exist)
-- ========================================

-- Drop policies for transfer_pricing_rules
DROP POLICY IF EXISTS "Anyone can view pricing rules" ON transfer_pricing_rules;
DROP POLICY IF EXISTS "Operators can manage pricing rules" ON transfer_pricing_rules;

-- Drop policies for transfer_vehicle_images
DROP POLICY IF EXISTS "Anyone can view vehicle images" ON transfer_vehicle_images;
DROP POLICY IF EXISTS "Operators can manage vehicle images" ON transfer_vehicle_images;

-- Drop policies for transfer_time_slots
DROP POLICY IF EXISTS "Anyone can view time slots" ON transfer_time_slots;
DROP POLICY IF EXISTS "Operators can manage time slots" ON transfer_time_slots;

-- Drop policies for transfer_booking_restrictions
DROP POLICY IF EXISTS "Anyone can view booking restrictions" ON transfer_booking_restrictions;
DROP POLICY IF EXISTS "Operators can manage booking restrictions" ON transfer_booking_restrictions;

-- ========================================
-- Step 3: Drop indexes (if they exist)
-- ========================================

DROP INDEX IF EXISTS idx_transfer_pricing_rules_vehicle_id;
DROP INDEX IF EXISTS idx_transfer_vehicle_images_vehicle_id;
DROP INDEX IF EXISTS idx_transfer_time_slots_package_id;
DROP INDEX IF EXISTS idx_transfer_booking_restrictions_package_id;

-- ========================================
-- Step 4: Drop the unused tables
-- ========================================

-- Drop in correct order (tables with foreign keys first)
DROP TABLE IF EXISTS transfer_pricing_rules CASCADE;
DROP TABLE IF EXISTS transfer_vehicle_images CASCADE;
DROP TABLE IF EXISTS transfer_time_slots CASCADE;
DROP TABLE IF EXISTS transfer_booking_restrictions CASCADE;

-- ========================================
-- Step 5: Verify cleanup
-- ========================================

SELECT 
  'AFTER CLEANUP - Remaining Transfer Tables:' as status,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'transfer_%';

-- List remaining tables (should be 7)
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'transfer_packages' THEN '✅ Main table'
    WHEN table_name = 'transfer_package_images' THEN '✅ Gallery images'
    WHEN table_name = 'transfer_package_vehicles' THEN '✅ Vehicle options'
    WHEN table_name = 'transfer_package_stops' THEN '✅ Multi-stop routes'
    WHEN table_name = 'transfer_additional_services' THEN '✅ Add-on services'
    WHEN table_name = 'transfer_hourly_pricing' THEN '✅ Hourly pricing'
    WHEN table_name = 'transfer_point_to_point_pricing' THEN '✅ Point-to-point pricing'
    ELSE '❓ Unknown'
  END as description
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'transfer_%'
ORDER BY table_name;

-- ========================================
-- Step 6: Final validation
-- ========================================

DO $$ 
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name LIKE 'transfer_%';
  
  IF remaining_count = 7 THEN
    RAISE NOTICE '✅ SUCCESS: Cleanup completed successfully! 4 tables removed, 7 active tables remain.';
  ELSE
    RAISE WARNING '⚠️ WARNING: Expected 7 remaining tables, but found %', remaining_count;
  END IF;
END $$;

-- ========================================
-- COMPLETION STATUS
-- ========================================

SELECT 
  '✅ Cleanup script completed!' as status,
  'Removed 4 unused tables from transfer packages schema' as description,
  NOW() as completed_at;

-- Expected remaining transfer tables:
-- 1. transfer_additional_services
-- 2. transfer_hourly_pricing  
-- 3. transfer_package_images
-- 4. transfer_package_stops
-- 5. transfer_package_vehicles
-- 6. transfer_packages
-- 7. transfer_point_to_point_pricing

