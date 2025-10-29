-- ========================================
-- ADD PRICE COLUMN TO ACTIVITY PACKAGE VEHICLES
-- ========================================
-- This migration adds a price field to vehicle options in private transfer packages

-- Add price column
ALTER TABLE activity_package_vehicles 
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- Add constraint to ensure price is non-negative
ALTER TABLE activity_package_vehicles 
ADD CONSTRAINT check_vehicle_price_non_negative 
CHECK (price >= 0);

-- Comment for documentation
COMMENT ON COLUMN activity_package_vehicles.price IS 
  'Price for this vehicle option in the package currency';

-- Verification query
SELECT 'Price column added' as status,
       column_name, 
       data_type,
       column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'activity_package_vehicles'
  AND column_name = 'price';

