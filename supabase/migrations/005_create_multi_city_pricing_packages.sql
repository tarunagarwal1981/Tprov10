-- ============================================================================
-- MULTI-CITY PACKAGE PRICING STRUCTURE
-- Two pricing models: Standard (per person) and Group (capacity-based)
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
-- 2. CREATE PRICING PACKAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_pricing_packages (
  -- Primary fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_packages(id) ON DELETE CASCADE,
  
  -- Pricing Type
  pricing_type multi_city_pricing_type NOT NULL DEFAULT 'STANDARD',
  
  -- Package Template Details
  package_name VARCHAR(100) NOT NULL, -- e.g., "Basic", "Premium", "VIP"
  description TEXT,
  
  -- ========================================
  -- STANDARD PRICING (Per Person)
  -- Only used when pricing_type = 'STANDARD'
  -- ========================================
  
  -- Adult Pricing
  adult_price DECIMAL(10, 2) CHECK (adult_price IS NULL OR adult_price >= 0),
  
  -- Child Pricing
  child_price DECIMAL(10, 2) CHECK (child_price IS NULL OR child_price >= 0),
  child_min_age INTEGER CHECK (child_min_age IS NULL OR child_min_age >= 0),
  child_max_age INTEGER CHECK (child_max_age IS NULL OR child_max_age > child_min_age),
  
  -- Infant Pricing
  infant_price DECIMAL(10, 2) CHECK (infant_price IS NULL OR infant_price >= 0),
  infant_max_age INTEGER CHECK (infant_max_age IS NULL OR infant_max_age >= 0),
  
  -- ========================================
  -- WHAT'S INCLUDED/EXCLUDED
  -- ========================================
  
  included_items TEXT[], -- Array of what's included with this package
  excluded_items TEXT[], -- Array of what's NOT included
  
  -- ========================================
  -- STATUS AND DISPLAY
  -- ========================================
  
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Highlight as "Most Popular", "Best Value", etc.
  display_order INTEGER DEFAULT 0,
  
  -- ========================================
  -- METADATA
  -- ========================================
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ========================================
  -- CONSTRAINTS
  -- ========================================
  
  -- For STANDARD pricing, adult_price must be set
  CONSTRAINT standard_pricing_requires_adult_price 
    CHECK (pricing_type != 'STANDARD' OR adult_price IS NOT NULL),
  
  -- For STANDARD pricing, child age ranges must be valid
  CONSTRAINT standard_pricing_child_ages 
    CHECK (
      pricing_type != 'STANDARD' 
      OR child_price IS NULL 
      OR (child_min_age IS NOT NULL AND child_max_age IS NOT NULL)
    )
);

-- ============================================================================
-- 3. CREATE GROUP PRICING TIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_pricing_groups (
  -- Primary fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_package_id UUID NOT NULL REFERENCES multi_city_pricing_packages(id) ON DELETE CASCADE,
  
  -- Group Size Details
  group_name VARCHAR(100) NOT NULL, -- e.g., "Small Group", "Large Group"
  min_capacity INTEGER NOT NULL CHECK (min_capacity > 0),
  max_capacity INTEGER NOT NULL CHECK (max_capacity >= min_capacity),
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0), -- Total price for the group
  
  -- Optional Details
  vehicle_type VARCHAR(100), -- e.g., "Minivan", "Coach Bus"
  accommodation_notes TEXT,
  description TEXT,
  
  -- Display
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

CREATE INDEX IF NOT EXISTS idx_multi_city_pricing_packages_active 
  ON multi_city_pricing_packages(package_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_multi_city_pricing_packages_featured 
  ON multi_city_pricing_packages(package_id, is_featured) 
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_multi_city_pricing_packages_display_order 
  ON multi_city_pricing_packages(package_id, display_order);

CREATE INDEX IF NOT EXISTS idx_multi_city_pricing_packages_type 
  ON multi_city_pricing_packages(package_id, pricing_type);

-- Group pricing indexes
CREATE INDEX IF NOT EXISTS idx_multi_city_pricing_groups_pricing_package_id 
  ON multi_city_pricing_groups(pricing_package_id);

CREATE INDEX IF NOT EXISTS idx_multi_city_pricing_groups_display_order 
  ON multi_city_pricing_groups(pricing_package_id, display_order);

CREATE INDEX IF NOT EXISTS idx_multi_city_pricing_groups_capacity 
  ON multi_city_pricing_groups(min_capacity, max_capacity);

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE multi_city_pricing_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_pricing_groups ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Public can view active pricing packages"
  ON multi_city_pricing_packages FOR SELECT
  USING (
    is_active = true 
    AND package_id IN (
      SELECT id FROM multi_city_packages WHERE status = 'published'
    )
  );

-- Group pricing policies
CREATE POLICY "Operators can view their own pricing groups"
  ON multi_city_pricing_groups FOR SELECT
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can create pricing groups"
  ON multi_city_pricing_groups FOR INSERT
  WITH CHECK (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can update their own pricing groups"
  ON multi_city_pricing_groups FOR UPDATE
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can delete their own pricing groups"
  ON multi_city_pricing_groups FOR DELETE
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view active pricing groups"
  ON multi_city_pricing_groups FOR SELECT
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE is_active = true 
      AND package_id IN (
        SELECT id FROM multi_city_packages WHERE status = 'published'
      )
    )
  );

-- ============================================================================
-- 7. CREATE TRIGGERS
-- ============================================================================

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

-- Update timestamp for pricing groups
CREATE OR REPLACE FUNCTION update_multi_city_pricing_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_multi_city_pricing_groups_updated_at
  BEFORE UPDATE ON multi_city_pricing_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_multi_city_pricing_groups_updated_at();

-- ============================================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE multi_city_pricing_packages IS 
  'Pricing packages for multi-city tours. Supports two types: STANDARD (per person) and GROUP (capacity-based).';

COMMENT ON COLUMN multi_city_pricing_packages.pricing_type IS 
  'Type of pricing: STANDARD (per person with age categories) or GROUP (capacity-based tiers)';

COMMENT ON COLUMN multi_city_pricing_packages.package_name IS 
  'Name of the pricing tier (e.g., Basic, Premium, VIP)';

COMMENT ON TABLE multi_city_pricing_groups IS 
  'Group size tiers for GROUP pricing type. Each tier defines a capacity range and total price.';

COMMENT ON COLUMN multi_city_pricing_groups.price IS 
  'Total price for the entire group (not per person)';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Multi-city pricing packages schema created successfully!';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Created multi_city_pricing_packages table';
  RAISE NOTICE '  - Created multi_city_pricing_groups table';
  RAISE NOTICE '  - Added package_validity_date to multi_city_packages';
  RAISE NOTICE '  - Added RLS policies for both tables';
  RAISE NOTICE '  - Created indexes for performance';
END $$;

