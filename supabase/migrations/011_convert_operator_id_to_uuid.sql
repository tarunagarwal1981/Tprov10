-- Migration: Convert operator_id columns from TEXT to UUID
-- This migration converts all operator_id columns to UUID type to match users.id
-- and enables foreign key constraints for data integrity.

-- Step 1: Convert package tables first (no dependencies)
-- These tables don't have foreign key constraints yet, so we can convert them safely

-- Convert activity_packages.operator_id
ALTER TABLE activity_packages 
  ALTER COLUMN operator_id TYPE uuid USING operator_id::uuid;

-- Convert transfer_packages.operator_id
ALTER TABLE transfer_packages 
  ALTER COLUMN operator_id TYPE uuid USING operator_id::uuid;

-- Convert multi_city_packages.operator_id
ALTER TABLE multi_city_packages 
  ALTER COLUMN operator_id TYPE uuid USING operator_id::uuid;

-- Convert multi_city_hotel_packages.operator_id
ALTER TABLE multi_city_hotel_packages 
  ALTER COLUMN operator_id TYPE uuid USING operator_id::uuid;

-- Convert fixed_departure_flight_packages.operator_id
ALTER TABLE fixed_departure_flight_packages 
  ALTER COLUMN operator_id TYPE uuid USING operator_id::uuid;

-- Step 2: Convert itinerary_items.operator_id
-- This table may have invalid references, but we'll convert the type first
-- Invalid references will be handled separately
ALTER TABLE itinerary_items 
  ALTER COLUMN operator_id TYPE uuid USING operator_id::uuid;

-- Step 3: Add foreign key constraint (only if all references are valid)
-- Note: This will fail if there are invalid operator_id references
-- If it fails, we'll need to clean up invalid references first
DO $$
BEGIN
  -- Check if there are any invalid references
  IF NOT EXISTS (
    SELECT 1 
    FROM itinerary_items ii
    LEFT JOIN users u ON ii.operator_id = u.id
    WHERE ii.operator_id IS NOT NULL AND u.id IS NULL
  ) THEN
    -- All references are valid, add the constraint
    ALTER TABLE itinerary_items
      ADD CONSTRAINT fk_itinerary_items_operator_id 
      FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraint added successfully';
  ELSE
    RAISE WARNING 'Skipping foreign key constraint: Invalid operator_id references found';
    RAISE WARNING 'Run cleanup script to fix invalid references, then add constraint manually';
  END IF;
END $$;

