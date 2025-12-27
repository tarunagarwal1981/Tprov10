-- ========================================
-- ACTIVITY PACKAGE VEHICLES SCHEMA
-- ========================================
-- This schema handles vehicles for private transfer pricing packages
-- Each vehicle is linked to a specific pricing package

-- ========================================
-- 1. CREATE VEHICLES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS activity_package_vehicles (
  -- Primary fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_package_id UUID NOT NULL REFERENCES activity_pricing_packages(id) ON DELETE CASCADE,
  
  -- Vehicle Information
  vehicle_type VARCHAR(100) NOT NULL, -- Standard types or custom "Others" text
  max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
  vehicle_category VARCHAR(100) NOT NULL, -- e.g., "Sedan", "SUV", "Van", "Bus", etc.
  
  -- Additional details
  description TEXT,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_activity_package_vehicles_pricing_package_id 
  ON activity_package_vehicles(pricing_package_id);

CREATE INDEX IF NOT EXISTS idx_activity_package_vehicles_display_order 
  ON activity_package_vehicles(pricing_package_id, display_order);

-- ========================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS
-- RLS disabled (not used in AWS RDS)

-- Allow operators to view vehicles for their own pricing packages
-- RLS Policy removed (not used in AWS RDS)

-- Allow operators to create vehicles for their own pricing packages
-- RLS Policy removed (not used in AWS RDS)

-- Allow operators to update their own package vehicles
-- RLS Policy removed (not used in AWS RDS)

-- Allow operators to delete their own package vehicles
-- RLS Policy removed (not used in AWS RDS)

-- Allow public to view vehicles for active pricing packages of published activities
-- RLS Policy removed (not used in AWS RDS)

-- ========================================
-- 4. TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ========================================

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_activity_package_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_activity_package_vehicles_updated_at 
  ON activity_package_vehicles;

CREATE TRIGGER trigger_update_activity_package_vehicles_updated_at
  BEFORE UPDATE ON activity_package_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_package_vehicles_updated_at();

-- ========================================
-- 5. COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE activity_package_vehicles IS 
  'Vehicles available for private transfer pricing packages. Each vehicle is linked to a specific pricing package.';

COMMENT ON COLUMN activity_package_vehicles.vehicle_type IS 
  'Type of vehicle from standard list or custom text when "Others" is selected';

COMMENT ON COLUMN activity_package_vehicles.max_capacity IS 
  'Maximum passenger capacity for this vehicle';

COMMENT ON COLUMN activity_package_vehicles.vehicle_category IS 
  'Category/type of vehicle (e.g., Sedan, SUV, Van, Bus, Luxury, etc.)';

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check if table was created
SELECT 'Table Created' as status,
       COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'activity_package_vehicles';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'activity_package_vehicles';

-- Check RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'activity_package_vehicles';

