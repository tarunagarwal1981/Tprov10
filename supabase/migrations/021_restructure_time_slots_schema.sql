-- ============================================================================
-- RESTRUCTURE TIME SLOTS SCHEMA
-- Migration to change time_slots from arrays to structured fields
-- Changes: activities[] and transfers[] -> title, activityDescription, transfer
-- ============================================================================

-- Update default value for multi_city_package_day_plans
ALTER TABLE multi_city_package_day_plans
ALTER COLUMN time_slots SET DEFAULT '{
  "morning": {"time": "08:00", "title": "", "activityDescription": "", "transfer": ""},
  "afternoon": {"time": "12:30", "title": "", "activityDescription": "", "transfer": ""},
  "evening": {"time": "17:00", "title": "", "activityDescription": "", "transfer": ""}
}'::jsonb;

-- Update default value for multi_city_hotel_package_day_plans
ALTER TABLE multi_city_hotel_package_day_plans
ALTER COLUMN time_slots SET DEFAULT '{
  "morning": {"time": "08:00", "title": "", "activityDescription": "", "transfer": ""},
  "afternoon": {"time": "12:30", "title": "", "activityDescription": "", "transfer": ""},
  "evening": {"time": "17:00", "title": "", "activityDescription": "", "transfer": ""}
}'::jsonb;

-- Update column comments
COMMENT ON COLUMN multi_city_package_day_plans.time_slots IS 'Structured time slots with title, activity description, and transfer for morning, afternoon, and evening. Format: {"morning": {"time": "HH:MM", "title": "...", "activityDescription": "...", "transfer": "..."}, ...}';

COMMENT ON COLUMN multi_city_hotel_package_day_plans.time_slots IS 'Structured time slots with title, activity description, and transfer for morning, afternoon, and evening. Format: {"morning": {"time": "HH:MM", "title": "...", "activityDescription": "...", "transfer": "..."}, ...}';

-- Note: Existing data migration is handled in application code (API routes)
-- Old format: {"morning": {"time": "...", "activities": [...], "transfers": [...]}}
-- New format: {"morning": {"time": "...", "title": "...", "activityDescription": "...", "transfer": "..."}}
-- Migration logic converts arrays to strings when loading/saving data
