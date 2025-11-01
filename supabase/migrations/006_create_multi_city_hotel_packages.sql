-- ============================================================================
-- MULTI-CITY HOTEL PACKAGE TABLES
-- This migration creates tables for multi-city hotel packages
-- Structure is identical to multi_city_packages but for hotel-focused tours
-- ============================================================================

-- ============================================================================
-- 1. CREATE MAIN MULTI-CITY HOTEL PACKAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_hotel_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic Information
  title VARCHAR(255) NOT NULL,
  short_description TEXT,
  destination_region VARCHAR(100),
  package_validity_date DATE,
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Policy Information
  deposit_percent INTEGER DEFAULT 0 CHECK (deposit_percent >= 0 AND deposit_percent <= 100),
  balance_due_days INTEGER DEFAULT 7 CHECK (balance_due_days >= 0),
  payment_methods TEXT[],
  visa_requirements TEXT,
  insurance_requirement VARCHAR(20) DEFAULT 'OPTIONAL' CHECK (insurance_requirement IN ('REQUIRED', 'OPTIONAL', 'NA')),
  health_requirements TEXT,
  terms_and_conditions TEXT,
  
  -- Status and Metadata
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE CITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_hotel_package_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_hotel_packages(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  country VARCHAR(100),
  nights INTEGER NOT NULL CHECK (nights > 0),
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE CITY HOTELS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_hotel_package_city_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES multi_city_hotel_package_cities(id) ON DELETE CASCADE,
  
  hotel_name VARCHAR(255) NOT NULL,
  hotel_type VARCHAR(50), -- 1 Star, 2 Star, etc.
  room_type VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. CREATE DAY PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_hotel_package_day_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_hotel_packages(id) ON DELETE CASCADE,
  city_id UUID REFERENCES multi_city_hotel_package_cities(id) ON DELETE SET NULL,
  
  day_number INTEGER NOT NULL CHECK (day_number > 0),
  city_name VARCHAR(100),
  description TEXT,
  photo_url TEXT,
  has_flights BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. CREATE DAY FLIGHTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_hotel_package_day_flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_plan_id UUID NOT NULL REFERENCES multi_city_hotel_package_day_plans(id) ON DELETE CASCADE,
  
  departure_city VARCHAR(100) NOT NULL,
  departure_time VARCHAR(50),
  arrival_city VARCHAR(100) NOT NULL,
  arrival_time VARCHAR(50),
  airline VARCHAR(100),
  flight_number VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. CREATE PRICING PACKAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_hotel_pricing_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_hotel_packages(id) ON DELETE CASCADE,
  
  pricing_type VARCHAR(20) NOT NULL DEFAULT 'STANDARD' CHECK (pricing_type IN ('STANDARD', 'GROUP')),
  
  -- Per Person Pricing
  adult_price DECIMAL(10, 2) NOT NULL CHECK (adult_price >= 0),
  child_price DECIMAL(10, 2) NOT NULL CHECK (child_price >= 0),
  child_min_age INTEGER NOT NULL DEFAULT 3 CHECK (child_min_age >= 0),
  child_max_age INTEGER NOT NULL DEFAULT 12 CHECK (child_max_age > child_min_age),
  infant_price DECIMAL(10, 2) DEFAULT 0 CHECK (infant_price >= 0),
  infant_max_age INTEGER DEFAULT 2 CHECK (infant_max_age >= 0),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. CREATE PRICING VEHICLES TABLE (for GROUP pricing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_hotel_pricing_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_package_id UUID NOT NULL REFERENCES multi_city_hotel_pricing_packages(id) ON DELETE CASCADE,
  
  vehicle_type VARCHAR(100) NOT NULL,
  max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  description TEXT,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. CREATE INCLUSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_hotel_package_inclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_hotel_packages(id) ON DELETE CASCADE,
  
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. CREATE EXCLUSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_hotel_package_exclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_hotel_packages(id) ON DELETE CASCADE,
  
  description TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. CREATE ADD-ONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_hotel_package_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_hotel_packages(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  max_quantity INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 11. CREATE CANCELLATION TIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_hotel_package_cancellation_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_hotel_packages(id) ON DELETE CASCADE,
  
  days_before INTEGER NOT NULL CHECK (days_before >= 0),
  refund_percent INTEGER NOT NULL CHECK (refund_percent >= 0 AND refund_percent <= 100),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_packages_operator ON multi_city_hotel_packages(operator_id);
CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_packages_status ON multi_city_hotel_packages(status);
CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_packages_published ON multi_city_hotel_packages(published_at) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_package_cities_package ON multi_city_hotel_package_cities(package_id);
CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_package_city_hotels_city ON multi_city_hotel_package_city_hotels(city_id);
CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_package_day_plans_package ON multi_city_hotel_package_day_plans(package_id);
CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_package_day_flights_day_plan ON multi_city_hotel_package_day_flights(day_plan_id);

CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_pricing_packages_package ON multi_city_hotel_pricing_packages(package_id);
CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_pricing_vehicles_pricing ON multi_city_hotel_pricing_vehicles(pricing_package_id);

CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_package_inclusions_package ON multi_city_hotel_package_inclusions(package_id);
CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_package_exclusions_package ON multi_city_hotel_package_exclusions(package_id);
CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_package_addons_package ON multi_city_hotel_package_addons(package_id);
CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_package_cancellation_package ON multi_city_hotel_package_cancellation_tiers(package_id);

-- ============================================================================
-- 13. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE multi_city_hotel_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_hotel_package_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_hotel_package_city_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_hotel_package_day_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_hotel_package_day_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_hotel_pricing_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_hotel_pricing_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_hotel_package_inclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_hotel_package_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_hotel_package_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_hotel_package_cancellation_tiers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 13. CREATE RLS POLICIES
-- ============================================================================

-- Main packages table policies
DROP POLICY IF EXISTS "Operators can view their own hotel packages" ON multi_city_hotel_packages;
CREATE POLICY "Operators can view their own hotel packages"
  ON multi_city_hotel_packages FOR SELECT
  USING (operator_id = auth.uid());

DROP POLICY IF EXISTS "Operators can create hotel packages" ON multi_city_hotel_packages;
CREATE POLICY "Operators can create hotel packages"
  ON multi_city_hotel_packages FOR INSERT
  WITH CHECK (operator_id = auth.uid());

DROP POLICY IF EXISTS "Operators can update their own hotel packages" ON multi_city_hotel_packages;
CREATE POLICY "Operators can update their own hotel packages"
  ON multi_city_hotel_packages FOR UPDATE
  USING (operator_id = auth.uid());

DROP POLICY IF EXISTS "Operators can delete their own hotel packages" ON multi_city_hotel_packages;
CREATE POLICY "Operators can delete their own hotel packages"
  ON multi_city_hotel_packages FOR DELETE
  USING (operator_id = auth.uid());

DROP POLICY IF EXISTS "Public can view published hotel packages" ON multi_city_hotel_packages;
CREATE POLICY "Public can view published hotel packages"
  ON multi_city_hotel_packages FOR SELECT
  USING (status = 'published');

-- Related tables policies (cities, day plans, flights, etc.)
DROP POLICY IF EXISTS "Operators can manage their hotel package cities" ON multi_city_hotel_package_cities;
CREATE POLICY "Operators can manage their hotel package cities"
  ON multi_city_hotel_package_cities FOR ALL
  USING (package_id IN (SELECT id FROM multi_city_hotel_packages WHERE operator_id = auth.uid()));

DROP POLICY IF EXISTS "Operators can manage their hotel package city hotels" ON multi_city_hotel_package_city_hotels;
CREATE POLICY "Operators can manage their hotel package city hotels"
  ON multi_city_hotel_package_city_hotels FOR ALL
  USING (city_id IN (
    SELECT id FROM multi_city_hotel_package_cities WHERE package_id IN (
      SELECT id FROM multi_city_hotel_packages WHERE operator_id = auth.uid()
    )
  ));

DROP POLICY IF EXISTS "Operators can manage their hotel package day plans" ON multi_city_hotel_package_day_plans;
CREATE POLICY "Operators can manage their hotel package day plans"
  ON multi_city_hotel_package_day_plans FOR ALL
  USING (package_id IN (SELECT id FROM multi_city_hotel_packages WHERE operator_id = auth.uid()));

DROP POLICY IF EXISTS "Operators can manage their hotel package day flights" ON multi_city_hotel_package_day_flights;
CREATE POLICY "Operators can manage their hotel package day flights"
  ON multi_city_hotel_package_day_flights FOR ALL
  USING (day_plan_id IN (
    SELECT id FROM multi_city_hotel_package_day_plans WHERE package_id IN (
      SELECT id FROM multi_city_hotel_packages WHERE operator_id = auth.uid()
    )
  ));

DROP POLICY IF EXISTS "Operators can manage their hotel package pricing" ON multi_city_hotel_pricing_packages;
CREATE POLICY "Operators can manage their hotel package pricing"
  ON multi_city_hotel_pricing_packages FOR ALL
  USING (package_id IN (SELECT id FROM multi_city_hotel_packages WHERE operator_id = auth.uid()));

DROP POLICY IF EXISTS "Operators can manage their hotel package vehicles" ON multi_city_hotel_pricing_vehicles;
CREATE POLICY "Operators can manage their hotel package vehicles"
  ON multi_city_hotel_pricing_vehicles FOR ALL
  USING (pricing_package_id IN (
    SELECT id FROM multi_city_hotel_pricing_packages WHERE package_id IN (
      SELECT id FROM multi_city_hotel_packages WHERE operator_id = auth.uid()
    )
  ));

DROP POLICY IF EXISTS "Operators can manage their hotel package inclusions" ON multi_city_hotel_package_inclusions;
CREATE POLICY "Operators can manage their hotel package inclusions"
  ON multi_city_hotel_package_inclusions FOR ALL
  USING (package_id IN (SELECT id FROM multi_city_hotel_packages WHERE operator_id = auth.uid()));

DROP POLICY IF EXISTS "Operators can manage their hotel package exclusions" ON multi_city_hotel_package_exclusions;
CREATE POLICY "Operators can manage their hotel package exclusions"
  ON multi_city_hotel_package_exclusions FOR ALL
  USING (package_id IN (SELECT id FROM multi_city_hotel_packages WHERE operator_id = auth.uid()));

DROP POLICY IF EXISTS "Operators can manage their hotel package addons" ON multi_city_hotel_package_addons;
CREATE POLICY "Operators can manage their hotel package addons"
  ON multi_city_hotel_package_addons FOR ALL
  USING (package_id IN (SELECT id FROM multi_city_hotel_packages WHERE operator_id = auth.uid()));

DROP POLICY IF EXISTS "Operators can manage their hotel package cancellation tiers" ON multi_city_hotel_package_cancellation_tiers;
CREATE POLICY "Operators can manage their hotel package cancellation tiers"
  ON multi_city_hotel_package_cancellation_tiers FOR ALL
  USING (package_id IN (SELECT id FROM multi_city_hotel_packages WHERE operator_id = auth.uid()));

-- Public read policies for published packages
DROP POLICY IF EXISTS "Public can view published hotel package details" ON multi_city_hotel_package_cities;
CREATE POLICY "Public can view published hotel package details"
  ON multi_city_hotel_package_cities FOR SELECT
  USING (package_id IN (SELECT id FROM multi_city_hotel_packages WHERE status = 'published'));

DROP POLICY IF EXISTS "Public can view published hotel package city hotels" ON multi_city_hotel_package_city_hotels;
CREATE POLICY "Public can view published hotel package city hotels"
  ON multi_city_hotel_package_city_hotels FOR SELECT
  USING (city_id IN (
    SELECT id FROM multi_city_hotel_package_cities WHERE package_id IN (
      SELECT id FROM multi_city_hotel_packages WHERE status = 'published'
    )
  ));

DROP POLICY IF EXISTS "Public can view published hotel package day plans" ON multi_city_hotel_package_day_plans;
CREATE POLICY "Public can view published hotel package day plans"
  ON multi_city_hotel_package_day_plans FOR SELECT
  USING (package_id IN (SELECT id FROM multi_city_hotel_packages WHERE status = 'published'));

DROP POLICY IF EXISTS "Public can view published hotel package flights" ON multi_city_hotel_package_day_flights;
CREATE POLICY "Public can view published hotel package flights"
  ON multi_city_hotel_package_day_flights FOR SELECT
  USING (day_plan_id IN (
    SELECT id FROM multi_city_hotel_package_day_plans WHERE package_id IN (
      SELECT id FROM multi_city_hotel_packages WHERE status = 'published'
    )
  ));

DROP POLICY IF EXISTS "Public can view published hotel package pricing" ON multi_city_hotel_pricing_packages;
CREATE POLICY "Public can view published hotel package pricing"
  ON multi_city_hotel_pricing_packages FOR SELECT
  USING (package_id IN (SELECT id FROM multi_city_hotel_packages WHERE status = 'published'));

DROP POLICY IF EXISTS "Public can view published hotel package vehicles" ON multi_city_hotel_pricing_vehicles;
CREATE POLICY "Public can view published hotel package vehicles"
  ON multi_city_hotel_pricing_vehicles FOR SELECT
  USING (pricing_package_id IN (
    SELECT id FROM multi_city_hotel_pricing_packages WHERE package_id IN (
      SELECT id FROM multi_city_hotel_packages WHERE status = 'published'
    )
  ));

DROP POLICY IF EXISTS "Public can view published hotel package inclusions" ON multi_city_hotel_package_inclusions;
CREATE POLICY "Public can view published hotel package inclusions"
  ON multi_city_hotel_package_inclusions FOR SELECT
  USING (package_id IN (SELECT id FROM multi_city_hotel_packages WHERE status = 'published'));

DROP POLICY IF EXISTS "Public can view published hotel package exclusions" ON multi_city_hotel_package_exclusions;
CREATE POLICY "Public can view published hotel package exclusions"
  ON multi_city_hotel_package_exclusions FOR SELECT
  USING (package_id IN (SELECT id FROM multi_city_hotel_packages WHERE status = 'published'));

DROP POLICY IF EXISTS "Public can view active hotel package addons" ON multi_city_hotel_package_addons;
CREATE POLICY "Public can view active hotel package addons"
  ON multi_city_hotel_package_addons FOR SELECT
  USING (is_active = true AND package_id IN (SELECT id FROM multi_city_hotel_packages WHERE status = 'published'));

-- ============================================================================
-- 14. CREATE TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_multi_city_hotel_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_multi_city_hotel_packages_updated_at ON multi_city_hotel_packages;
CREATE TRIGGER trigger_update_multi_city_hotel_packages_updated_at
  BEFORE UPDATE ON multi_city_hotel_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_multi_city_hotel_packages_updated_at();

-- Update timestamp trigger for hotels
CREATE OR REPLACE FUNCTION update_multi_city_hotel_package_city_hotels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_multi_city_hotel_package_city_hotels_updated_at ON multi_city_hotel_package_city_hotels;
CREATE TRIGGER trigger_update_multi_city_hotel_package_city_hotels_updated_at
  BEFORE UPDATE ON multi_city_hotel_package_city_hotels
  FOR EACH ROW
  EXECUTE FUNCTION update_multi_city_hotel_package_city_hotels_updated_at();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Multi-city hotel package tables created successfully!';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - multi_city_hotel_packages';
  RAISE NOTICE '  - multi_city_hotel_package_cities';
  RAISE NOTICE '  - multi_city_hotel_package_day_plans';
  RAISE NOTICE '  - multi_city_hotel_package_day_flights';
  RAISE NOTICE '  - multi_city_hotel_pricing_packages';
  RAISE NOTICE '  - multi_city_hotel_pricing_vehicles';
  RAISE NOTICE '  - multi_city_hotel_package_inclusions';
  RAISE NOTICE '  - multi_city_hotel_package_exclusions';
  RAISE NOTICE '  - multi_city_hotel_package_addons';
  RAISE NOTICE '  - multi_city_hotel_package_cancellation_tiers';
END $$;

