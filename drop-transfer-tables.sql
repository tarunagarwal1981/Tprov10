-- Drop Transfer Package Tables (Clean Slate)
-- Run this FIRST if you have existing transfer tables

-- Drop tables in reverse order (child tables first, then parent)
DROP TABLE IF EXISTS transfer_booking_restrictions CASCADE;
DROP TABLE IF EXISTS transfer_time_slots CASCADE;
DROP TABLE IF EXISTS transfer_pricing_rules CASCADE;
DROP TABLE IF EXISTS transfer_additional_services CASCADE;
DROP TABLE IF EXISTS transfer_package_stops CASCADE;
DROP TABLE IF EXISTS transfer_vehicle_images CASCADE;
DROP TABLE IF EXISTS transfer_package_vehicles CASCADE;
DROP TABLE IF EXISTS transfer_package_images CASCADE;
DROP TABLE IF EXISTS transfer_packages CASCADE;

-- Drop trigger function if it exists
DROP FUNCTION IF EXISTS update_transfer_packages_updated_at() CASCADE;

-- Verify all tables dropped
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'transfer_%'
ORDER BY table_name;

-- Should return no rows if all dropped successfully
SELECT 'All transfer tables dropped successfully!' as status;

