-- ============================================================================
-- CLEANUP SCRIPT: Delete Old Test Packages from test-insert-multi-city-packages.sql
-- ============================================================================
-- This script safely deletes the test packages created by the old script
-- before running the new v2 script with proper SIC/PRIVATE_PACKAGE structure
-- ============================================================================
-- 
-- IMPORTANT: 
-- - This will delete ALL packages created by the old test script
-- - Related data (cities, images, pricing, etc.) will be automatically deleted via CASCADE
-- - Only run this if you want to clean up old test data
-- - Check for any references in itinerary_items or other tables first if needed
-- ============================================================================

-- ============================================================================
-- 1. DELETE OLD MULTI-CITY PACKAGES
-- ============================================================================
-- Delete packages that match the titles from the old test script
-- These are the packages from test-insert-multi-city-packages.sql

DELETE FROM multi_city_packages
WHERE title IN (
  'Thailand Paradise: Phuket, Krabi & Bangkok Adventure',
  'Thailand Highlights Express: Phuket & Bangkok',
  'Bali Island Paradise: Ubud & Seminyak'
)
OR (title LIKE 'Thailand Paradise%' AND created_at < NOW() - INTERVAL '1 day')
OR (title LIKE 'Thailand Highlights%' AND created_at < NOW() - INTERVAL '1 day')
OR (title LIKE 'Bali Island Paradise%' AND created_at < NOW() - INTERVAL '1 day');

-- ============================================================================
-- 2. DELETE OLD MULTI-CITY HOTEL PACKAGES
-- ============================================================================
-- Delete hotel packages that match the titles from the old test script

DELETE FROM multi_city_hotel_packages
WHERE title IN (
  'Luxury Thailand: Phuket, Krabi & Bangkok',
  'Thailand Beach & City: Phuket & Bangkok',
  'Bali Luxury Stay: Ubud & Seminyak'
)
OR (title LIKE 'Luxury Thailand%' AND created_at < NOW() - INTERVAL '1 day')
OR (title LIKE 'Thailand Beach & City%' AND created_at < NOW() - INTERVAL '1 day')
OR (title LIKE 'Bali Luxury Stay%' AND created_at < NOW() - INTERVAL '1 day');

-- ============================================================================
-- 3. VERIFICATION QUERIES
-- ============================================================================
-- Run these after the cleanup to verify packages are deleted

-- Check remaining multi-city packages
SELECT id, title, status, created_at 
FROM multi_city_packages 
ORDER BY created_at DESC 
LIMIT 10;

-- Check remaining multi-city hotel packages
SELECT id, title, status, created_at 
FROM multi_city_hotel_packages 
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================================================
-- ALTERNATIVE: Delete ALL test packages for a specific operator
-- ============================================================================
-- If you want to delete ALL packages for a test operator, uncomment below:
-- 
-- DELETE FROM multi_city_packages
-- WHERE operator_id = (SELECT id FROM users WHERE role = 'TOUR_OPERATOR' LIMIT 1);
-- 
-- DELETE FROM multi_city_hotel_packages
-- WHERE operator_id = (SELECT id FROM users WHERE role = 'TOUR_OPERATOR' LIMIT 1);
-- ============================================================================

