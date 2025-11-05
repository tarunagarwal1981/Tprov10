-- ============================================================================
-- UPDATE MULTI-CITY PRICING: GROUP -> PRIVATE PACKAGE with Tabular Format
-- ============================================================================
-- Changes:
-- 1. Rename GROUP pricing type to PRIVATE_PACKAGE
-- 2. Create table for private package pricing rows (adults, children, car type, vehicle capacity, total price)
-- 3. Update existing GROUP records to PRIVATE_PACKAGE
-- ============================================================================

-- ============================================================================
-- 1. UPDATE ENUM: GROUP -> PRIVATE_PACKAGE
-- ============================================================================

-- First, update any existing GROUP records to PRIVATE_PACKAGE
UPDATE multi_city_pricing_packages 
SET pricing_type = 'PRIVATE_PACKAGE'::text::multi_city_pricing_type
WHERE pricing_type = 'GROUP';

UPDATE multi_city_hotel_pricing_packages 
SET pricing_type = 'PRIVATE_PACKAGE'::text::multi_city_pricing_type
WHERE pricing_type = 'GROUP';

UPDATE fixed_departure_flight_pricing_packages 
SET pricing_type = 'PRIVATE_PACKAGE'::text::multi_city_pricing_type
WHERE pricing_type = 'GROUP';

-- Add PRIVATE_PACKAGE to enum (if it doesn't exist)
DO $$ 
BEGIN
  -- Check if PRIVATE_PACKAGE already exists in enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'PRIVATE_PACKAGE' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'multi_city_pricing_type')
  ) THEN
    -- Add PRIVATE_PACKAGE to enum
    ALTER TYPE multi_city_pricing_type ADD VALUE 'PRIVATE_PACKAGE';
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE PRIVATE PACKAGE PRICING ROWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_private_package_rows (
  -- Primary fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_package_id UUID NOT NULL REFERENCES multi_city_pricing_packages(id) ON DELETE CASCADE,
  
  -- Tabular pricing columns
  number_of_adults INTEGER NOT NULL CHECK (number_of_adults >= 0),
  number_of_children INTEGER NOT NULL DEFAULT 0 CHECK (number_of_children >= 0),
  car_type VARCHAR(100) NOT NULL, -- e.g., "Sedan", "SUV", "Van", "Minibus"
  vehicle_capacity INTEGER NOT NULL CHECK (vehicle_capacity > 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  
  -- Display order
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE INDEXES FOR PRIVATE PACKAGE ROWS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_multi_city_private_package_rows_pricing_package_id 
  ON multi_city_private_package_rows(pricing_package_id);

CREATE INDEX IF NOT EXISTS idx_multi_city_private_package_rows_display_order 
  ON multi_city_private_package_rows(pricing_package_id, display_order);

CREATE INDEX IF NOT EXISTS idx_multi_city_private_package_rows_car_type 
  ON multi_city_private_package_rows(car_type);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY FOR PRIVATE PACKAGE ROWS
-- ============================================================================

ALTER TABLE multi_city_private_package_rows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Operators can view their own private package rows" ON multi_city_private_package_rows;
DROP POLICY IF EXISTS "Operators can create private package rows" ON multi_city_private_package_rows;
DROP POLICY IF EXISTS "Operators can update their own private package rows" ON multi_city_private_package_rows;
DROP POLICY IF EXISTS "Operators can delete their own private package rows" ON multi_city_private_package_rows;
DROP POLICY IF EXISTS "Public can view private package rows for published tours" ON multi_city_private_package_rows;

-- Private package rows policies
CREATE POLICY "Operators can view their own private package rows"
  ON multi_city_private_package_rows FOR SELECT
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can create private package rows"
  ON multi_city_private_package_rows FOR INSERT
  WITH CHECK (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can update their own private package rows"
  ON multi_city_private_package_rows FOR UPDATE
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can delete their own private package rows"
  ON multi_city_private_package_rows FOR DELETE
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view private package rows for published tours"
  ON multi_city_private_package_rows FOR SELECT
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE status = 'published'
      )
    )
  );

-- ============================================================================
-- 5. CREATE TRIGGER FOR PRIVATE PACKAGE ROWS UPDATE TIMESTAMP
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_multi_city_private_package_rows_updated_at ON multi_city_private_package_rows;

-- Update timestamp for private package rows
CREATE OR REPLACE FUNCTION update_multi_city_private_package_rows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_multi_city_private_package_rows_updated_at
  BEFORE UPDATE ON multi_city_private_package_rows
  FOR EACH ROW
  EXECUTE FUNCTION update_multi_city_private_package_rows_updated_at();

-- ============================================================================
-- 6. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE multi_city_private_package_rows IS 
  'Tabular pricing rows for Private Package pricing. Each row represents a pricing combination with number of adults, children, car type, vehicle capacity, and total price.';

COMMENT ON COLUMN multi_city_private_package_rows.number_of_adults IS 
  'Number of adults for this pricing row';

COMMENT ON COLUMN multi_city_private_package_rows.number_of_children IS 
  'Number of children for this pricing row (can be 0)';

COMMENT ON COLUMN multi_city_private_package_rows.car_type IS 
  'Type of car/vehicle (e.g., Sedan, SUV, Van, Minibus)';

COMMENT ON COLUMN multi_city_private_package_rows.vehicle_capacity IS 
  'Maximum capacity of the vehicle';

COMMENT ON COLUMN multi_city_private_package_rows.total_price IS 
  'Total price for this combination';

-- ============================================================================
-- 7. CREATE PRIVATE PACKAGE ROWS TABLE FOR MULTI-CITY HOTEL PACKAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_hotel_private_package_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_package_id UUID NOT NULL REFERENCES multi_city_hotel_pricing_packages(id) ON DELETE CASCADE,
  number_of_adults INTEGER NOT NULL CHECK (number_of_adults >= 0),
  number_of_children INTEGER NOT NULL DEFAULT 0 CHECK (number_of_children >= 0),
  car_type VARCHAR(100) NOT NULL,
  vehicle_capacity INTEGER NOT NULL CHECK (vehicle_capacity > 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_private_package_rows_pricing_package_id 
  ON multi_city_hotel_private_package_rows(pricing_package_id);

ALTER TABLE multi_city_hotel_private_package_rows ENABLE ROW LEVEL SECURITY;

-- RLS policies for multi_city_hotel_private_package_rows
CREATE POLICY "Operators can view their own hotel private package rows"
  ON multi_city_hotel_private_package_rows FOR SELECT
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_hotel_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_hotel_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can create hotel private package rows"
  ON multi_city_hotel_private_package_rows FOR INSERT
  WITH CHECK (
    pricing_package_id IN (
      SELECT id FROM multi_city_hotel_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_hotel_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can update their own hotel private package rows"
  ON multi_city_hotel_private_package_rows FOR UPDATE
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_hotel_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_hotel_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can delete their own hotel private package rows"
  ON multi_city_hotel_private_package_rows FOR DELETE
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_hotel_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_hotel_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view hotel private package rows for published tours"
  ON multi_city_hotel_private_package_rows FOR SELECT
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_hotel_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_hotel_packages WHERE status = 'published'
      )
    )
  );

-- ============================================================================
-- 8. CREATE PRIVATE PACKAGE ROWS TABLE FOR FIXED DEPARTURE FLIGHT PACKAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS fixed_departure_flight_private_package_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_package_id UUID NOT NULL REFERENCES fixed_departure_flight_pricing_packages(id) ON DELETE CASCADE,
  number_of_adults INTEGER NOT NULL CHECK (number_of_adults >= 0),
  number_of_children INTEGER NOT NULL DEFAULT 0 CHECK (number_of_children >= 0),
  car_type VARCHAR(100) NOT NULL,
  vehicle_capacity INTEGER NOT NULL CHECK (vehicle_capacity > 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fixed_departure_flight_private_package_rows_pricing_package_id 
  ON fixed_departure_flight_private_package_rows(pricing_package_id);

ALTER TABLE fixed_departure_flight_private_package_rows ENABLE ROW LEVEL SECURITY;

-- RLS policies for fixed_departure_flight_private_package_rows
CREATE POLICY "Operators can view their own flight private package rows"
  ON fixed_departure_flight_private_package_rows FOR SELECT
  USING (
    pricing_package_id IN (
      SELECT id FROM fixed_departure_flight_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM fixed_departure_flight_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can create flight private package rows"
  ON fixed_departure_flight_private_package_rows FOR INSERT
  WITH CHECK (
    pricing_package_id IN (
      SELECT id FROM fixed_departure_flight_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM fixed_departure_flight_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can update their own flight private package rows"
  ON fixed_departure_flight_private_package_rows FOR UPDATE
  USING (
    pricing_package_id IN (
      SELECT id FROM fixed_departure_flight_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM fixed_departure_flight_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can delete their own flight private package rows"
  ON fixed_departure_flight_private_package_rows FOR DELETE
  USING (
    pricing_package_id IN (
      SELECT id FROM fixed_departure_flight_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM fixed_departure_flight_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view flight private package rows for published tours"
  ON fixed_departure_flight_private_package_rows FOR SELECT
  USING (
    pricing_package_id IN (
      SELECT id FROM fixed_departure_flight_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM fixed_departure_flight_packages WHERE status = 'published'
      )
    )
  );

-- ============================================================================
-- 9. CREATE TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_multi_city_hotel_private_package_rows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_multi_city_hotel_private_package_rows_updated_at
  BEFORE UPDATE ON multi_city_hotel_private_package_rows
  FOR EACH ROW
  EXECUTE FUNCTION update_multi_city_hotel_private_package_rows_updated_at();

CREATE OR REPLACE FUNCTION update_fixed_departure_flight_private_package_rows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fixed_departure_flight_private_package_rows_updated_at
  BEFORE UPDATE ON fixed_departure_flight_private_package_rows
  FOR EACH ROW
  EXECUTE FUNCTION update_fixed_departure_flight_private_package_rows_updated_at();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Multi-city pricing updated: GROUP -> PRIVATE PACKAGE with tabular format!';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Added PRIVATE_PACKAGE to pricing_type enum';
  RAISE NOTICE '  - Created multi_city_private_package_rows table for tabular pricing';
  RAISE NOTICE '  - Created multi_city_hotel_private_package_rows table';
  RAISE NOTICE '  - Created fixed_departure_flight_private_package_rows table';
  RAISE NOTICE '  - Table includes: number_of_adults, number_of_children, car_type, vehicle_capacity, total_price';
  RAISE NOTICE '  - Added RLS policies for all private package rows tables';
  RAISE NOTICE '  - Created indexes for performance';
END $$;

