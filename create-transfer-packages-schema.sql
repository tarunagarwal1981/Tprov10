-- ========================================
-- CREATE TRANSFER PACKAGES DATABASE SCHEMA
-- ========================================
-- This schema handles transfer/transportation packages

-- ========================================
-- 1. MAIN TRANSFER PACKAGES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS transfer_packages (
  -- Primary fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  title VARCHAR(100) NOT NULL,
  short_description VARCHAR(160) NOT NULL,
  full_description TEXT,
  
  -- Location & Destination
  destination_name VARCHAR(255) NOT NULL,
  destination_address TEXT,
  destination_city VARCHAR(100),
  destination_country VARCHAR(100),
  destination_coordinates JSONB, -- {latitude, longitude}
  
  -- Transfer Details
  transfer_type VARCHAR(20) NOT NULL CHECK (transfer_type IN ('ONE_WAY', 'ROUND_TRIP', 'MULTI_STOP')),
  
  -- Route Information
  total_distance DECIMAL(10, 2), -- in km or miles
  distance_unit VARCHAR(10) DEFAULT 'KM' CHECK (distance_unit IN ('KM', 'MILES')),
  estimated_duration_hours INTEGER,
  estimated_duration_minutes INTEGER,
  route_points JSONB, -- Array of route points
  
  -- Service Details
  meet_and_greet BOOLEAN DEFAULT false,
  name_board BOOLEAN DEFAULT false,
  driver_uniform BOOLEAN DEFAULT true,
  flight_tracking BOOLEAN DEFAULT false,
  luggage_assistance BOOLEAN DEFAULT true,
  door_to_door_service BOOLEAN DEFAULT true,
  contact_driver_in_advance BOOLEAN DEFAULT false,
  contact_lead_time INTEGER DEFAULT 2, -- hours
  real_time_tracking BOOLEAN DEFAULT false,
  
  -- Languages & Tags
  languages_supported TEXT[] DEFAULT ARRAY['EN'],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Policies
  cancellation_policy_type VARCHAR(20) DEFAULT 'MODERATE' CHECK (cancellation_policy_type IN ('FLEXIBLE', 'MODERATE', 'STRICT', 'CUSTOM')),
  cancellation_refund_percentage INTEGER DEFAULT 80,
  cancellation_deadline_hours INTEGER DEFAULT 24,
  no_show_policy TEXT,
  terms_and_conditions TEXT,
  
  -- Availability
  available_days TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['MON', 'TUE', 'WED', ...]
  advance_booking_hours INTEGER DEFAULT 2,
  maximum_advance_booking_days INTEGER DEFAULT 30,
  instant_confirmation BOOLEAN DEFAULT true,
  special_instructions TEXT,
  
  -- Status and Metadata
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'suspended')),
  featured BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  
  -- Indexes for performance
  CONSTRAINT transfer_packages_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES auth.users(id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_transfer_packages_operator_id ON transfer_packages(operator_id);
CREATE INDEX IF NOT EXISTS idx_transfer_packages_status ON transfer_packages(status);
CREATE INDEX IF NOT EXISTS idx_transfer_packages_transfer_type ON transfer_packages(transfer_type);
CREATE INDEX IF NOT EXISTS idx_transfer_packages_city ON transfer_packages(destination_city);
CREATE INDEX IF NOT EXISTS idx_transfer_packages_country ON transfer_packages(destination_country);
CREATE INDEX IF NOT EXISTS idx_transfer_packages_created_at ON transfer_packages(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_transfer_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_transfer_packages_updated_at
BEFORE UPDATE ON transfer_packages
FOR EACH ROW
EXECUTE FUNCTION update_transfer_packages_updated_at();

-- ========================================
-- 2. TRANSFER PACKAGE IMAGES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS transfer_package_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES transfer_packages(id) ON DELETE CASCADE,
  
  -- Image details
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  storage_path TEXT NOT NULL,
  public_url TEXT,
  
  -- Metadata
  alt_text TEXT,
  is_cover BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfer_package_images_package_id ON transfer_package_images(package_id);
CREATE INDEX IF NOT EXISTS idx_transfer_package_images_is_cover ON transfer_package_images(is_cover);

-- ========================================
-- 3. VEHICLE CONFIGURATIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS transfer_package_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES transfer_packages(id) ON DELETE CASCADE,
  
  -- Vehicle details
  vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('SEDAN', 'SUV', 'VAN', 'BUS', 'LUXURY', 'MINIBUS')),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Capacity
  passenger_capacity INTEGER NOT NULL,
  luggage_capacity INTEGER NOT NULL,
  
  -- Features (array of feature codes)
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfer_package_vehicles_package_id ON transfer_package_vehicles(package_id);
CREATE INDEX IF NOT EXISTS idx_transfer_package_vehicles_vehicle_type ON transfer_package_vehicles(vehicle_type);

-- ========================================
-- 4. VEHICLE IMAGES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS transfer_vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES transfer_package_vehicles(id) ON DELETE CASCADE,
  
  -- Image details
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  storage_path TEXT NOT NULL,
  public_url TEXT,
  
  -- Metadata
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfer_vehicle_images_vehicle_id ON transfer_vehicle_images(vehicle_id);

-- ========================================
-- 5. TRANSFER STOPS TABLE (for multi-stop transfers)
-- ========================================

CREATE TABLE IF NOT EXISTS transfer_package_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES transfer_packages(id) ON DELETE CASCADE,
  
  -- Stop location
  location_name VARCHAR(255) NOT NULL,
  location_address TEXT,
  location_coordinates JSONB, -- {latitude, longitude}
  
  -- Stop details
  duration_hours INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 30,
  description TEXT,
  stop_order INTEGER NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfer_package_stops_package_id ON transfer_package_stops(package_id);
CREATE INDEX IF NOT EXISTS idx_transfer_package_stops_order ON transfer_package_stops(package_id, stop_order);

-- ========================================
-- 6. ADDITIONAL SERVICES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS transfer_additional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES transfer_packages(id) ON DELETE CASCADE,
  
  -- Service details
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  is_included BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfer_additional_services_package_id ON transfer_additional_services(package_id);

-- ========================================
-- 7. PRICING RULES TABLE
-- ========================================

-- NOTE: As of 2025-12, pricing rules are not used by the current operator
-- transfer package UI. The table is kept for backwards compatibility and
-- potential future advanced pricing features, but should be treated as
-- "reserved / deprecated" for new development.
CREATE TABLE IF NOT EXISTS transfer_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES transfer_package_vehicles(id) ON DELETE CASCADE,
  
  -- Rule type
  rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('DISTANCE_BASED', 'TIME_BASED', 'ADDITIONAL_CHARGE')),
  
  -- Distance-based pricing
  min_distance DECIMAL(10, 2),
  max_distance DECIMAL(10, 2),
  price_per_km DECIMAL(10, 2),
  
  -- Time-based pricing
  time_start TIME,
  time_end TIME,
  surcharge_percentage INTEGER,
  
  -- Additional charges
  charge_name VARCHAR(100),
  charge_description TEXT,
  charge_type VARCHAR(20), -- 'FIXED', 'PER_HOUR', 'PERCENTAGE', 'PER_ITEM'
  charge_amount DECIMAL(10, 2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfer_pricing_rules_vehicle_id ON transfer_pricing_rules(vehicle_id);

-- ========================================
-- 8. TIME SLOTS TABLE
-- ========================================

-- NOTE: As of 2025-12, transfer_time_slots is not populated by the current
-- transfer package form. Availability is captured only via high-level
-- columns on transfer_packages. This table is kept for backwards
-- compatibility and potential future use.
CREATE TABLE IF NOT EXISTS transfer_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES transfer_packages(id) ON DELETE CASCADE,
  
  -- Time slot details
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  available_days TEXT[] NOT NULL, -- ['MON', 'TUE', ...]
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfer_time_slots_package_id ON transfer_time_slots(package_id);

-- ========================================
-- 9. BOOKING RESTRICTIONS TABLE
-- ========================================

-- NOTE: As of 2025-12, transfer_booking_restrictions is not populated by
-- the current transfer package form. Booking restrictions are not exposed
-- in the operator dashboard UI. This table is kept for backwards
-- compatibility and potential future use.
CREATE TABLE IF NOT EXISTS transfer_booking_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES transfer_packages(id) ON DELETE CASCADE,
  
  -- Restriction details
  restriction_type VARCHAR(20) NOT NULL CHECK (restriction_type IN ('DATE_RANGE', 'SPECIFIC_DATES', 'HOLIDAYS')),
  start_date DATE,
  end_date DATE,
  specific_dates JSONB, -- Array of dates
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfer_booking_restrictions_package_id ON transfer_booking_restrictions(package_id);

-- ========================================
-- 10. ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE transfer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_package_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_package_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_package_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_additional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_booking_restrictions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 11. RLS POLICIES - Transfer Packages
-- ========================================

-- Allow public to view published packages
CREATE POLICY "Public can view published transfer packages"
ON transfer_packages FOR SELECT
TO public
USING (status = 'published');

-- Allow operators to view their own packages
CREATE POLICY "Operators can view their own transfer packages"
ON transfer_packages FOR SELECT
TO authenticated
USING (operator_id = auth.uid());

-- Allow operators to create packages
CREATE POLICY "Operators can create transfer packages"
ON transfer_packages FOR INSERT
TO authenticated
WITH CHECK (operator_id = auth.uid());

-- Allow operators to update their own packages
CREATE POLICY "Operators can update their own transfer packages"
ON transfer_packages FOR UPDATE
TO authenticated
USING (operator_id = auth.uid())
WITH CHECK (operator_id = auth.uid());

-- Allow operators to delete their own packages
CREATE POLICY "Operators can delete their own transfer packages"
ON transfer_packages FOR DELETE
TO authenticated
USING (operator_id = auth.uid());

-- ========================================
-- 12. RLS POLICIES - Related Tables
-- ========================================

-- Images
CREATE POLICY "Anyone can view transfer package images"
ON transfer_package_images FOR SELECT
TO public USING (true);

CREATE POLICY "Operators can manage images for their packages"
ON transfer_package_images FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM transfer_packages 
  WHERE transfer_packages.id = package_id 
  AND transfer_packages.operator_id = auth.uid()
));

-- Vehicles
CREATE POLICY "Anyone can view transfer vehicles"
ON transfer_package_vehicles FOR SELECT
TO public USING (true);

CREATE POLICY "Operators can manage vehicles for their packages"
ON transfer_package_vehicles FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM transfer_packages 
  WHERE transfer_packages.id = package_id 
  AND transfer_packages.operator_id = auth.uid()
));

-- Vehicle Images
CREATE POLICY "Anyone can view vehicle images"
ON transfer_vehicle_images FOR SELECT
TO public USING (true);

CREATE POLICY "Operators can manage vehicle images"
ON transfer_vehicle_images FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM transfer_package_vehicles v
  JOIN transfer_packages p ON p.id = v.package_id
  WHERE v.id = vehicle_id 
  AND p.operator_id = auth.uid()
));

-- Stops
CREATE POLICY "Anyone can view transfer stops"
ON transfer_package_stops FOR SELECT
TO public USING (true);

CREATE POLICY "Operators can manage stops for their packages"
ON transfer_package_stops FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM transfer_packages 
  WHERE transfer_packages.id = package_id 
  AND transfer_packages.operator_id = auth.uid()
));

-- Additional Services
CREATE POLICY "Anyone can view additional services"
ON transfer_additional_services FOR SELECT
TO public USING (true);

CREATE POLICY "Operators can manage additional services"
ON transfer_additional_services FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM transfer_packages 
  WHERE transfer_packages.id = package_id 
  AND transfer_packages.operator_id = auth.uid()
));

-- Pricing Rules
CREATE POLICY "Anyone can view pricing rules"
ON transfer_pricing_rules FOR SELECT
TO public USING (true);

CREATE POLICY "Operators can manage pricing rules"
ON transfer_pricing_rules FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM transfer_package_vehicles v
  JOIN transfer_packages p ON p.id = v.package_id
  WHERE v.id = vehicle_id 
  AND p.operator_id = auth.uid()
));

-- Time Slots
CREATE POLICY "Anyone can view time slots"
ON transfer_time_slots FOR SELECT
TO public USING (true);

CREATE POLICY "Operators can manage time slots"
ON transfer_time_slots FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM transfer_packages 
  WHERE transfer_packages.id = package_id 
  AND transfer_packages.operator_id = auth.uid()
));

-- Booking Restrictions
CREATE POLICY "Anyone can view booking restrictions"
ON transfer_booking_restrictions FOR SELECT
TO public USING (true);

CREATE POLICY "Operators can manage booking restrictions"
ON transfer_booking_restrictions FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM transfer_packages 
  WHERE transfer_packages.id = package_id 
  AND transfer_packages.operator_id = auth.uid()
));

-- ========================================
-- 13. VERIFICATION
-- ========================================

-- Verify tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'transfer_%'
ORDER BY table_name;

-- Verify policies created
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename LIKE 'transfer_%'
ORDER BY tablename, cmd;

-- Done!
SELECT 'Transfer packages schema created successfully!' as status;

