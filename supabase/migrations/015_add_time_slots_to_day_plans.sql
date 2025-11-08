-- ============================================================================
-- ADD TIME SLOTS TO DAY PLANS
-- This migration adds time_slots JSONB column to store structured activities
-- and transfers organized by morning, afternoon, and evening time slots
-- ============================================================================

-- Add time_slots column to multi_city_package_day_plans
ALTER TABLE multi_city_package_day_plans
ADD COLUMN IF NOT EXISTS time_slots JSONB DEFAULT '{
  "morning": {"time": "", "activities": [], "transfers": []},
  "afternoon": {"time": "", "activities": [], "transfers": []},
  "evening": {"time": "", "activities": [], "transfers": []}
}'::jsonb;

-- Add time_slots column to multi_city_hotel_package_day_plans
ALTER TABLE multi_city_hotel_package_day_plans
ADD COLUMN IF NOT EXISTS time_slots JSONB DEFAULT '{
  "morning": {"time": "", "activities": [], "transfers": []},
  "afternoon": {"time": "", "activities": [], "transfers": []},
  "evening": {"time": "", "activities": [], "transfers": []}
}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN multi_city_package_day_plans.time_slots IS 'Structured time slots with activities and transfers organized by morning, afternoon, and evening. Format: {"morning": {"time": "HH:MM", "activities": ["..."], "transfers": ["..."]}, ...}';
COMMENT ON COLUMN multi_city_hotel_package_day_plans.time_slots IS 'Structured time slots with activities and transfers organized by morning, afternoon, and evening. Format: {"morning": {"time": "HH:MM", "activities": ["..."], "transfers": ["..."]}, ...}';

-- Create indexes for JSONB queries (optional but recommended for performance)
CREATE INDEX IF NOT EXISTS idx_multi_city_day_plans_time_slots ON multi_city_package_day_plans USING GIN (time_slots);
CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_day_plans_time_slots ON multi_city_hotel_package_day_plans USING GIN (time_slots);

