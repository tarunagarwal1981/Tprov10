-- ============================================================================
-- MULTI-CITY PACKAGE PRICING STRUCTURE
-- Two pricing models: Standard (per person) and Group (per person + vehicles)
-- ============================================================================

-- ============================================================================
-- 1. CREATE PRICING TYPE ENUM
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE multi_city_pricing_type AS ENUM ('STANDARD', 'GROUP');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. CREATE MAIN PRICING TABLE
-- ============================================================================
-- This table stores ONE pricing configuration per package
-- Either STANDARD (per person only) OR GROUP (per person + vehicles)

CREATE TABLE IF NOT EXISTS multi_city_pricing_packages (
  -- Primary fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_packages(id) ON DELETE CASCADE,
  
  -- Pricing Type
  pricing_type multi_city_pricing_type NOT NULL DEFAULT 'STANDARD',
  
  -- ========================================
  -- PER PERSON PRICING (Used by both types)
  -- ========================================
  
  -- Adult Pricing
  adult_price DECIMAL(10, 2) NOT NULL CHECK (adult_price >= 0),
  
  -- Child Pricing
  child_price DECIMAL(10, 2) NOT NULL CHECK (child_price >= 0),
  child_min_age INTEGER NOT NULL DEFAULT 3 CHECK (child_min_age >= 0),
  child_max_age INTEGER NOT NULL DEFAULT 12 CHECK (child_max_age > child_min_age),
  
  -- Infant Pricing
  infant_price DECIMAL(10, 2) DEFAULT 0 CHECK (infant_price >= 0),
  infant_max_age INTEGER DEFAULT 2 CHECK (infant_max_age >= 0),
  
  -- ========================================
  -- METADATA
  -- ========================================
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE VEHICLES TABLE (for GROUP pricing type)
-- ============================================================================
-- Similar to activity_package_vehicles
-- Only used when pricing_type = 'GROUP'

CREATE TABLE IF NOT EXISTS multi_city_pricing_vehicles (
  -- Primary fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_package_id UUID NOT NULL REFERENCES multi_city_pricing_packages(id) ON DELETE CASCADE,
  
  -- Vehicle Information
  vehicle_type VARCHAR(100) NOT NULL, -- e.g., "Sedan", "SUV", "Van", "Minibus"
  max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0), -- Total price for this vehicle
  
  -- Additional details
  description TEXT,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. UPDATE MAIN PACKAGE TABLE
-- ============================================================================

-- Add package validity field
ALTER TABLE multi_city_packages
  ADD COLUMN IF NOT EXISTS package_validity_date DATE;

-- Add comment
COMMENT ON COLUMN multi_city_packages.package_validity_date IS 
  'Last date this package is valid for bookings';

-- Keep old pricing fields for now (will remove in future migration)
-- Mark them as deprecated
COMMENT ON COLUMN multi_city_packages.pricing_mode IS 
  'DEPRECATED: Use multi_city_pricing_packages table instead';
COMMENT ON COLUMN multi_city_packages.fixed_price IS 
  'DEPRECATED: Use multi_city_pricing_packages table instead';
COMMENT ON COLUMN multi_city_packages.per_person_price IS 
  'DEPRECATED: Use multi_city_pricing_packages table instead';

-- ============================================================================
-- 5. CREATE INDEXES
-- ============================================================================

-- Pricing packages indexes
CREATE INDEX IF NOT EXISTS idx_multi_city_pricing_packages_package_id 
  ON multi_city_pricing_packages(package_id);

CREATE INDEX IF NOT EXISTS idx_multi_city_pricing_packages_type 
  ON multi_city_pricing_packages(package_id, pricing_type);

-- Vehicles indexes
CREATE INDEX IF NOT EXISTS idx_multi_city_pricing_vehicles_pricing_package_id 
  ON multi_city_pricing_vehicles(pricing_package_id);

CREATE INDEX IF NOT EXISTS idx_multi_city_pricing_vehicles_display_order 
  ON multi_city_pricing_vehicles(pricing_package_id, display_order);

CREATE INDEX IF NOT EXISTS idx_multi_city_pricing_vehicles_capacity 
  ON multi_city_pricing_vehicles(max_capacity);

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE multi_city_pricing_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_pricing_vehicles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Operators can view their own pricing packages" ON multi_city_pricing_packages;
DROP POLICY IF EXISTS "Operators can create pricing packages" ON multi_city_pricing_packages;
DROP POLICY IF EXISTS "Operators can update their own pricing packages" ON multi_city_pricing_packages;
DROP POLICY IF EXISTS "Operators can delete their own pricing packages" ON multi_city_pricing_packages;
DROP POLICY IF EXISTS "Public can view pricing packages for published tours" ON multi_city_pricing_packages;

DROP POLICY IF EXISTS "Operators can view their own pricing vehicles" ON multi_city_pricing_vehicles;
DROP POLICY IF EXISTS "Operators can create pricing vehicles" ON multi_city_pricing_vehicles;
DROP POLICY IF EXISTS "Operators can update their own pricing vehicles" ON multi_city_pricing_vehicles;
DROP POLICY IF EXISTS "Operators can delete their own pricing vehicles" ON multi_city_pricing_vehicles;
DROP POLICY IF EXISTS "Public can view vehicles for published tours" ON multi_city_pricing_vehicles;

-- Pricing packages policies
CREATE POLICY "Operators can view their own pricing packages"
  ON multi_city_pricing_packages FOR SELECT
  USING (
    package_id IN (
      SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
    )
  );

CREATE POLICY "Operators can create pricing packages"
  ON multi_city_pricing_packages FOR INSERT
  WITH CHECK (
    package_id IN (
      SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
    )
  );

CREATE POLICY "Operators can update their own pricing packages"
  ON multi_city_pricing_packages FOR UPDATE
  USING (
    package_id IN (
      SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
    )
  );

CREATE POLICY "Operators can delete their own pricing packages"
  ON multi_city_pricing_packages FOR DELETE
  USING (
    package_id IN (
      SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
    )
  );

CREATE POLICY "Public can view pricing packages for published tours"
  ON multi_city_pricing_packages FOR SELECT
  USING (
    package_id IN (
      SELECT id FROM multi_city_packages WHERE status = 'published'
    )
  );

-- Vehicles policies
CREATE POLICY "Operators can view their own pricing vehicles"
  ON multi_city_pricing_vehicles FOR SELECT
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can create pricing vehicles"
  ON multi_city_pricing_vehicles FOR INSERT
  WITH CHECK (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can update their own pricing vehicles"
  ON multi_city_pricing_vehicles FOR UPDATE
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can delete their own pricing vehicles"
  ON multi_city_pricing_vehicles FOR DELETE
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view vehicles for published tours"
  ON multi_city_pricing_vehicles FOR SELECT
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE status = 'published'
      )
    )
  );

-- ============================================================================
-- 7. CREATE TRIGGERS
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_multi_city_pricing_packages_updated_at ON multi_city_pricing_packages;
DROP TRIGGER IF EXISTS trigger_update_multi_city_pricing_vehicles_updated_at ON multi_city_pricing_vehicles;

-- Update timestamp for pricing packages
CREATE OR REPLACE FUNCTION update_multi_city_pricing_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_multi_city_pricing_packages_updated_at
  BEFORE UPDATE ON multi_city_pricing_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_multi_city_pricing_packages_updated_at();

-- Update timestamp for pricing vehicles
CREATE OR REPLACE FUNCTION update_multi_city_pricing_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_multi_city_pricing_vehicles_updated_at
  BEFORE UPDATE ON multi_city_pricing_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_multi_city_pricing_vehicles_updated_at();

-- ============================================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE multi_city_pricing_packages IS 
  'Main pricing configuration for multi-city tours. ONE record per package. Stores per-person pricing for both STANDARD and GROUP types.';

COMMENT ON COLUMN multi_city_pricing_packages.pricing_type IS 
  'Type of pricing: STANDARD (per person only) or GROUP (per person + vehicle options)';

COMMENT ON COLUMN multi_city_pricing_packages.adult_price IS 
  'Per person price for adults. Required for both STANDARD and GROUP types.';

COMMENT ON TABLE multi_city_pricing_vehicles IS 
  'Vehicle options for GROUP pricing type. Similar to activity_package_vehicles. Each vehicle has capacity and total price.';

COMMENT ON COLUMN multi_city_pricing_vehicles.price IS 
  'Total price for this vehicle (not per person)';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Multi-city pricing packages schema created successfully!';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Created multi_city_pricing_packages table (ONE record per package)';
  RAISE NOTICE '  - Created multi_city_pricing_vehicles table (vehicle options for GROUP pricing)';
  RAISE NOTICE '  - Added package_validity_date to multi_city_packages';
  RAISE NOTICE '  - Added RLS policies for both tables';
  RAISE NOTICE '  - Created indexes for performance';
END $$;

