-- ============================================================================
-- ENHANCE ITINERARY DAYS FOR CREATE ITINERARY FUNCTIONALITY
-- This migration adds support for arrival details, time slots, hotels, and meals
-- ============================================================================

-- Add columns to itinerary_days table
ALTER TABLE itinerary_days
ADD COLUMN IF NOT EXISTS arrival_flight_id UUID,
ADD COLUMN IF NOT EXISTS arrival_time TIME,
ADD COLUMN IF NOT EXISTS departure_flight_id UUID,
ADD COLUMN IF NOT EXISTS departure_time TIME,
ADD COLUMN IF NOT EXISTS hotel_id UUID,
ADD COLUMN IF NOT EXISTS hotel_name TEXT,
ADD COLUMN IF NOT EXISTS hotel_star_rating INTEGER,
ADD COLUMN IF NOT EXISTS room_type TEXT,
ADD COLUMN IF NOT EXISTS meal_plan TEXT, -- 'ROOM_ONLY', 'BED_BREAKFAST', 'HALF_BOARD', 'FULL_BOARD'
ADD COLUMN IF NOT EXISTS time_slots JSONB DEFAULT '{
  "morning": {"time": "", "activities": [], "transfers": []},
  "afternoon": {"time": "", "activities": [], "transfers": []},
  "evening": {"time": "", "activities": [], "transfers": []}
}'::jsonb,
ADD COLUMN IF NOT EXISTS lunch_included BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lunch_details TEXT,
ADD COLUMN IF NOT EXISTS dinner_included BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dinner_details TEXT,
ADD COLUMN IF NOT EXISTS arrival_description TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_itinerary_days_arrival_flight ON itinerary_days(arrival_flight_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_days_departure_flight ON itinerary_days(departure_flight_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_days_time_slots ON itinerary_days USING GIN (time_slots);

-- Add comments for documentation
COMMENT ON COLUMN itinerary_days.arrival_flight_id IS 'Reference to itinerary_flights table for arrival flight';
COMMENT ON COLUMN itinerary_days.arrival_time IS 'Time of arrival at destination (from flight or manual entry)';
COMMENT ON COLUMN itinerary_days.departure_flight_id IS 'Reference to itinerary_flights table for departure flight';
COMMENT ON COLUMN itinerary_days.departure_time IS 'Time of departure from destination';
COMMENT ON COLUMN itinerary_days.hotel_id IS 'Reference to hotel (can be from multi_city_hotel_package_city_hotels or standalone)';
COMMENT ON COLUMN itinerary_days.hotel_name IS 'Hotel name for display';
COMMENT ON COLUMN itinerary_days.hotel_star_rating IS 'Hotel star rating (1-5)';
COMMENT ON COLUMN itinerary_days.room_type IS 'Selected room type (e.g., Deluxe Double, Twin)';
COMMENT ON COLUMN itinerary_days.meal_plan IS 'Meal plan type: ROOM_ONLY, BED_BREAKFAST, HALF_BOARD, FULL_BOARD';
COMMENT ON COLUMN itinerary_days.time_slots IS 'JSONB structure: {"morning": {"time": "HH:MM", "activities": [item_ids], "transfers": [item_ids]}, ...}';
COMMENT ON COLUMN itinerary_days.lunch_included IS 'Whether lunch is included';
COMMENT ON COLUMN itinerary_days.lunch_details IS 'Details about lunch (restaurant, package, etc.)';
COMMENT ON COLUMN itinerary_days.dinner_included IS 'Whether dinner is included';
COMMENT ON COLUMN itinerary_days.dinner_details IS 'Details about dinner (restaurant, package, etc.)';
COMMENT ON COLUMN itinerary_days.arrival_description IS 'Description text for arrival information';


