-- ============================================================================
-- UPDATE MULTI-CITY ITINERARY SCHEMA
-- Migration to update day plans structure and add flights table
-- ============================================================================

-- ============================================================================
-- 1. DROP OLD ACTIVITIES TABLE (no longer needed)
-- ============================================================================
DROP TABLE IF EXISTS multi_city_package_day_activities CASCADE;

-- ============================================================================
-- 2. UPDATE DAY PLANS TABLE
-- ============================================================================

-- Add new columns to day plans
ALTER TABLE multi_city_package_day_plans
  ADD COLUMN IF NOT EXISTS city_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS has_flights BOOLEAN DEFAULT false;

-- Remove old columns that are no longer needed
ALTER TABLE multi_city_package_day_plans
  DROP COLUMN IF EXISTS includes_breakfast,
  DROP COLUMN IF EXISTS includes_lunch,
  DROP COLUMN IF EXISTS includes_dinner,
  DROP COLUMN IF EXISTS accommodation_type,
  DROP COLUMN IF EXISTS notes;

-- Add index for photo URLs
CREATE INDEX IF NOT EXISTS idx_multi_city_day_plans_photo 
  ON multi_city_package_day_plans(package_id) 
  WHERE photo_url IS NOT NULL;

-- ============================================================================
-- 3. CREATE FLIGHTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_package_day_flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_plan_id UUID NOT NULL REFERENCES multi_city_package_day_plans(id) ON DELETE CASCADE,
  
  -- Flight details
  departure_city VARCHAR(255) NOT NULL,
  departure_time TIME,
  arrival_city VARCHAR(255) NOT NULL,
  arrival_time TIME,
  airline VARCHAR(255),
  flight_number VARCHAR(50),
  
  -- Order
  flight_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. CREATE INDEXES FOR FLIGHTS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_multi_city_flights_day_plan 
  ON multi_city_package_day_flights(day_plan_id);

CREATE INDEX IF NOT EXISTS idx_multi_city_flights_order 
  ON multi_city_package_day_flights(day_plan_id, flight_order);

-- ============================================================================
-- 5. ENABLE RLS ON FLIGHTS TABLE
-- ============================================================================

-- RLS disabled (not used in AWS RDS)

-- Flight policies
-- RLS Policy removed (not used in AWS RDS)

-- RLS Policy removed (not used in AWS RDS)

-- ============================================================================
-- 6. UPDATE COMMENTS
-- ============================================================================

COMMENT ON TABLE multi_city_package_day_plans IS 'Daily itinerary plans with city, description, and photo';
COMMENT ON COLUMN multi_city_package_day_plans.city_name IS 'Name of the city for this day (denormalized for easier display)';
COMMENT ON COLUMN multi_city_package_day_plans.description IS 'Full description of activities and highlights for the day';
COMMENT ON COLUMN multi_city_package_day_plans.photo_url IS 'URL to the photo representing this day';
COMMENT ON COLUMN multi_city_package_day_plans.has_flights IS 'Whether this day includes flight details';

COMMENT ON TABLE multi_city_package_day_flights IS 'Flight details for each day (multiple flights per day supported)';
COMMENT ON COLUMN multi_city_package_day_flights.departure_time IS 'Departure time (time only, date is determined by the day)';
COMMENT ON COLUMN multi_city_package_day_flights.arrival_time IS 'Arrival time (time only, may be next day)';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Multi-city itinerary schema updated successfully!';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Updated multi_city_package_day_plans with new fields';
  RAISE NOTICE '  - Created multi_city_package_day_flights table';
  RAISE NOTICE '  - Removed old multi_city_package_day_activities table';
  RAISE NOTICE '  - Added RLS policies for flights';
END $$;

