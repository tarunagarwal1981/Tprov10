-- ========================================
-- CREATE TRANSFER PRICING OPTIONS SCHEMA
-- ========================================
-- This schema handles hourly and point-to-point pricing options for transfer packages

-- ========================================
-- 1. HOURLY PRICING OPTIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS transfer_hourly_pricing (
  -- Primary fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES transfer_packages(id) ON DELETE CASCADE,
  
  -- Hourly Details
  hours INTEGER NOT NULL CHECK (hours > 0),
  
  -- Vehicle Information
  vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('SEDAN', 'SUV', 'VAN', 'BUS', 'LUXURY', 'MINIBUS')),
  vehicle_name VARCHAR(100) NOT NULL,
  
  -- Capacity
  max_passengers INTEGER NOT NULL CHECK (max_passengers > 0),
  
  -- Pricing
  rate_usd DECIMAL(10, 2) NOT NULL CHECK (rate_usd >= 0),
  
  -- Additional Information
  description TEXT,
  features TEXT[], -- Array of vehicle features
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. POINT-TO-POINT PRICING OPTIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS transfer_point_to_point_pricing (
  -- Primary fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES transfer_packages(id) ON DELETE CASCADE,
  
  -- Location Details
  from_location VARCHAR(255) NOT NULL,
  from_address TEXT,
  from_coordinates JSONB, -- {latitude, longitude}
  
  to_location VARCHAR(255) NOT NULL,
  to_address TEXT,
  to_coordinates JSONB, -- {latitude, longitude}
  
  -- Distance Information (optional, for reference)
  distance DECIMAL(10, 2),
  distance_unit VARCHAR(10) DEFAULT 'KM' CHECK (distance_unit IN ('KM', 'MILES')),
  estimated_duration_minutes INTEGER,
  
  -- Vehicle Information
  vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('SEDAN', 'SUV', 'VAN', 'BUS', 'LUXURY', 'MINIBUS')),
  vehicle_name VARCHAR(100) NOT NULL,
  
  -- Capacity
  max_passengers INTEGER NOT NULL CHECK (max_passengers > 0),
  
  -- Pricing
  cost_usd DECIMAL(10, 2) NOT NULL CHECK (cost_usd >= 0),
  
  -- Additional Information
  description TEXT,
  features TEXT[], -- Array of vehicle features
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. INDEXES FOR PERFORMANCE
-- ========================================

-- Hourly pricing indexes
CREATE INDEX IF NOT EXISTS idx_transfer_hourly_pricing_package_id 
  ON transfer_hourly_pricing(package_id);

CREATE INDEX IF NOT EXISTS idx_transfer_hourly_pricing_active 
  ON transfer_hourly_pricing(package_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_transfer_hourly_pricing_vehicle_type 
  ON transfer_hourly_pricing(package_id, vehicle_type);

-- Point-to-point pricing indexes
CREATE INDEX IF NOT EXISTS idx_transfer_p2p_pricing_package_id 
  ON transfer_point_to_point_pricing(package_id);

CREATE INDEX IF NOT EXISTS idx_transfer_p2p_pricing_active 
  ON transfer_point_to_point_pricing(package_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_transfer_p2p_pricing_vehicle_type 
  ON transfer_point_to_point_pricing(package_id, vehicle_type);

CREATE INDEX IF NOT EXISTS idx_transfer_p2p_pricing_locations 
  ON transfer_point_to_point_pricing(package_id, from_location, to_location);

-- ========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on both tables
ALTER TABLE transfer_hourly_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_point_to_point_pricing ENABLE ROW LEVEL SECURITY;

-- Hourly pricing policies
-- Allow operators to manage their own pricing options
CREATE POLICY "Operators can view their own hourly pricing options"
  ON transfer_hourly_pricing
  FOR SELECT
  USING (
    package_id IN (
      SELECT id FROM transfer_packages WHERE operator_id = auth.uid()
    )
  );

CREATE POLICY "Operators can insert their own hourly pricing options"
  ON transfer_hourly_pricing
  FOR INSERT
  WITH CHECK (
    package_id IN (
      SELECT id FROM transfer_packages WHERE operator_id = auth.uid()
    )
  );

CREATE POLICY "Operators can update their own hourly pricing options"
  ON transfer_hourly_pricing
  FOR UPDATE
  USING (
    package_id IN (
      SELECT id FROM transfer_packages WHERE operator_id = auth.uid()
    )
  );

CREATE POLICY "Operators can delete their own hourly pricing options"
  ON transfer_hourly_pricing
  FOR DELETE
  USING (
    package_id IN (
      SELECT id FROM transfer_packages WHERE operator_id = auth.uid()
    )
  );

-- Allow public to view active pricing options for published packages
CREATE POLICY "Public can view active hourly pricing for published packages"
  ON transfer_hourly_pricing
  FOR SELECT
  USING (
    is_active = true
    AND package_id IN (
      SELECT id FROM transfer_packages WHERE status = 'published'
    )
  );

-- Point-to-point pricing policies
-- Allow operators to manage their own pricing options
CREATE POLICY "Operators can view their own p2p pricing options"
  ON transfer_point_to_point_pricing
  FOR SELECT
  USING (
    package_id IN (
      SELECT id FROM transfer_packages WHERE operator_id = auth.uid()
    )
  );

CREATE POLICY "Operators can insert their own p2p pricing options"
  ON transfer_point_to_point_pricing
  FOR INSERT
  WITH CHECK (
    package_id IN (
      SELECT id FROM transfer_packages WHERE operator_id = auth.uid()
    )
  );

CREATE POLICY "Operators can update their own p2p pricing options"
  ON transfer_point_to_point_pricing
  FOR UPDATE
  USING (
    package_id IN (
      SELECT id FROM transfer_packages WHERE operator_id = auth.uid()
    )
  );

CREATE POLICY "Operators can delete their own p2p pricing options"
  ON transfer_point_to_point_pricing
  FOR DELETE
  USING (
    package_id IN (
      SELECT id FROM transfer_packages WHERE operator_id = auth.uid()
    )
  );

-- Allow public to view active pricing options for published packages
CREATE POLICY "Public can view active p2p pricing for published packages"
  ON transfer_point_to_point_pricing
  FOR SELECT
  USING (
    is_active = true
    AND package_id IN (
      SELECT id FROM transfer_packages WHERE status = 'published'
    )
  );

-- ========================================
-- 5. TRIGGERS FOR UPDATED_AT TIMESTAMP
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transfer_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for hourly pricing
CREATE TRIGGER update_transfer_hourly_pricing_timestamp
  BEFORE UPDATE ON transfer_hourly_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_transfer_pricing_updated_at();

-- Trigger for point-to-point pricing
CREATE TRIGGER update_transfer_p2p_pricing_timestamp
  BEFORE UPDATE ON transfer_point_to_point_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_transfer_pricing_updated_at();

-- ========================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE transfer_hourly_pricing IS 'Stores hourly-based pricing options for transfer packages';
COMMENT ON TABLE transfer_point_to_point_pricing IS 'Stores point-to-point (location-based) pricing options for transfer packages';

COMMENT ON COLUMN transfer_hourly_pricing.hours IS 'Number of hours for this pricing option';
COMMENT ON COLUMN transfer_hourly_pricing.rate_usd IS 'Hourly rate in USD';
COMMENT ON COLUMN transfer_hourly_pricing.max_passengers IS 'Maximum number of passengers for this vehicle option';

COMMENT ON COLUMN transfer_point_to_point_pricing.from_location IS 'Starting location name';
COMMENT ON COLUMN transfer_point_to_point_pricing.to_location IS 'Destination location name';
COMMENT ON COLUMN transfer_point_to_point_pricing.cost_usd IS 'Total cost for this route in USD';
COMMENT ON COLUMN transfer_point_to_point_pricing.max_passengers IS 'Maximum number of passengers for this vehicle option';

