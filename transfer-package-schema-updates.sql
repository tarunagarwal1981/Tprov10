-- SQL queries to update transfer packages schema
-- Run these queries in your Supabase SQL editor
-- Based on the actual schema: transfer_packages table contains all transfer data

-- Add pickup date and time columns to the main transfer_packages table
ALTER TABLE transfer_packages 
ADD COLUMN IF NOT EXISTS pickup_date DATE,
ADD COLUMN IF NOT EXISTS pickup_time TIME;

-- Add return date and time columns for round-trip transfers
ALTER TABLE transfer_packages 
ADD COLUMN IF NOT EXISTS return_date DATE,
ADD COLUMN IF NOT EXISTS return_time TIME;

-- Add pickup location details (if not already present)
ALTER TABLE transfer_packages 
ADD COLUMN IF NOT EXISTS pickup_location_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS pickup_location_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_location_coordinates JSONB;

-- Add dropoff location details (if not already present)
ALTER TABLE transfer_packages 
ADD COLUMN IF NOT EXISTS dropoff_location_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS dropoff_location_address TEXT,
ADD COLUMN IF NOT EXISTS dropoff_location_coordinates JSONB;

-- Add passenger and luggage details
ALTER TABLE transfer_packages 
ADD COLUMN IF NOT EXISTS number_of_passengers INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS number_of_luggage_pieces INTEGER DEFAULT 0;

-- Optional: Add comments to document the new columns
COMMENT ON COLUMN transfer_packages.pickup_date IS 'Date when the transfer pickup is scheduled';
COMMENT ON COLUMN transfer_packages.pickup_time IS 'Time when the transfer pickup is scheduled';
COMMENT ON COLUMN transfer_packages.return_date IS 'Date when the round-trip return is scheduled';
COMMENT ON COLUMN transfer_packages.return_time IS 'Time when the round-trip return is scheduled';
COMMENT ON COLUMN transfer_packages.pickup_location_name IS 'Name of the pickup location';
COMMENT ON COLUMN transfer_packages.pickup_location_address IS 'Address of the pickup location';
COMMENT ON COLUMN transfer_packages.pickup_location_coordinates IS 'Coordinates of the pickup location';
COMMENT ON COLUMN transfer_packages.dropoff_location_name IS 'Name of the dropoff location';
COMMENT ON COLUMN transfer_packages.dropoff_location_address IS 'Address of the dropoff location';
COMMENT ON COLUMN transfer_packages.dropoff_location_coordinates IS 'Coordinates of the dropoff location';
COMMENT ON COLUMN transfer_packages.number_of_passengers IS 'Number of passengers for the transfer';
COMMENT ON COLUMN transfer_packages.number_of_luggage_pieces IS 'Number of luggage pieces for the transfer';

-- Create indexes for better query performance on date/time fields
CREATE INDEX IF NOT EXISTS idx_transfer_packages_pickup_date ON transfer_packages(pickup_date);
CREATE INDEX IF NOT EXISTS idx_transfer_packages_pickup_time ON transfer_packages(pickup_time);
CREATE INDEX IF NOT EXISTS idx_transfer_packages_return_date ON transfer_packages(return_date);

-- Create indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_transfer_packages_pickup_location ON transfer_packages(pickup_location_name);
CREATE INDEX IF NOT EXISTS idx_transfer_packages_dropoff_location ON transfer_packages(dropoff_location_name);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'transfer_packages' 
AND column_name IN (
  'pickup_date', 'pickup_time', 'return_date', 'return_time', 
  'pickup_location_name', 'dropoff_location_name',
  'number_of_passengers', 'number_of_luggage_pieces'
)
ORDER BY column_name;