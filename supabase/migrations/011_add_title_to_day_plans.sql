-- ============================================================================
-- ADD TITLE COLUMN TO DAY PLANS TABLES
-- Migration to add title field to all multi-city package day plans tables
-- ============================================================================

-- ============================================================================
-- 1. ADD TITLE COLUMN TO multi_city_package_day_plans
-- ============================================================================

ALTER TABLE multi_city_package_day_plans
  ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Add comment
COMMENT ON COLUMN multi_city_package_day_plans.title IS 'Title for this day (e.g., "Exploring Ubud", "Beach Day in Kuta")';

-- ============================================================================
-- 2. ADD TITLE COLUMN TO multi_city_hotel_package_day_plans
-- ============================================================================

ALTER TABLE multi_city_hotel_package_day_plans
  ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Add comment
COMMENT ON COLUMN multi_city_hotel_package_day_plans.title IS 'Title for this day (e.g., "Exploring Ubud", "Beach Day in Kuta")';

-- ============================================================================
-- 3. ADD TITLE COLUMN TO fixed_departure_flight_package_day_plans
-- ============================================================================

ALTER TABLE fixed_departure_flight_package_day_plans
  ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Add comment
COMMENT ON COLUMN fixed_departure_flight_package_day_plans.title IS 'Title for this day (e.g., "Exploring Ubud", "Beach Day in Kuta")';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Title column added to all day plans tables successfully!';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Added title column to multi_city_package_day_plans';
  RAISE NOTICE '  - Added title column to multi_city_hotel_package_day_plans';
  RAISE NOTICE '  - Added title column to fixed_departure_flight_package_day_plans';
END $$;

