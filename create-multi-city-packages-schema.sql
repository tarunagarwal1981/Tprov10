-- ============================================================================
-- MULTI-CITY PACKAGES SCHEMA
-- Complete database schema for multi-city tour packages
-- ============================================================================

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS multi_city_package_addons CASCADE;
DROP TABLE IF EXISTS multi_city_package_day_activities CASCADE;
DROP TABLE IF EXISTS multi_city_package_day_plans CASCADE;
DROP TABLE IF EXISTS multi_city_package_departures CASCADE;
DROP TABLE IF EXISTS multi_city_package_cancellation_tiers CASCADE;
DROP TABLE IF EXISTS multi_city_package_exclusions CASCADE;
DROP TABLE IF EXISTS multi_city_package_inclusions CASCADE;
DROP TABLE IF EXISTS multi_city_package_connections CASCADE;
DROP TABLE IF EXISTS multi_city_package_cities CASCADE;
DROP TABLE IF EXISTS multi_city_package_images CASCADE;
DROP TABLE IF EXISTS multi_city_packages CASCADE;

-- Create enums
DO $$ BEGIN
  CREATE TYPE transport_type AS ENUM ('FLIGHT', 'TRAIN', 'BUS', 'CAR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE transport_class AS ENUM ('ECONOMY', 'BUSINESS', 'FIRST', 'STANDARD');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE inclusion_category AS ENUM ('Transport', 'Activities', 'Meals', 'Guide Services', 'Entry Fees', 'Insurance');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE pricing_mode AS ENUM ('FIXED', 'PER_PERSON', 'GROUP_TIERED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE insurance_requirement AS ENUM ('REQUIRED', 'OPTIONAL', 'NA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 1. MAIN PACKAGE TABLE
-- ============================================================================
CREATE TABLE multi_city_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic Information
  title VARCHAR(255) NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT,
  destination_region VARCHAR(255),
  
  -- Transport
  include_intercity_transport BOOLEAN DEFAULT false,
  
  -- Pricing
  pricing_mode pricing_mode DEFAULT 'FIXED',
  fixed_price DECIMAL(10,2),
  per_person_price DECIMAL(10,2),
  group_min INTEGER,
  group_max INTEGER,
  currency VARCHAR(3) DEFAULT 'USD',
  validity_start DATE,
  validity_end DATE,
  seasonal_notes TEXT,
  
  -- Policies
  deposit_percent INTEGER DEFAULT 0,
  balance_due_days INTEGER DEFAULT 7,
  payment_methods TEXT[],
  visa_requirements TEXT,
  insurance_requirement insurance_requirement DEFAULT 'OPTIONAL',
  health_requirements TEXT,
  terms_and_conditions TEXT,
  
  -- Calculated fields
  total_nights INTEGER DEFAULT 0,
  total_days INTEGER DEFAULT 0,
  total_cities INTEGER DEFAULT 0,
  base_price DECIMAL(10,2),
  
  -- Status & Meta
  status package_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT positive_prices CHECK (
    (fixed_price IS NULL OR fixed_price >= 0) AND
    (per_person_price IS NULL OR per_person_price >= 0) AND
    (base_price IS NULL OR base_price >= 0)
  )
);

-- ============================================================================
-- 2. PACKAGE IMAGES
-- ============================================================================
CREATE TABLE multi_city_package_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_packages(id) ON DELETE CASCADE,
  
  file_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  is_cover BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CITY STOPS
-- ============================================================================
CREATE TABLE multi_city_package_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_packages(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  nights INTEGER NOT NULL CHECK (nights >= 1),
  highlights TEXT[],
  activities_included TEXT[],
  
  city_order INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. CONNECTIONS (Transport between cities)
-- ============================================================================
CREATE TABLE multi_city_package_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_packages(id) ON DELETE CASCADE,
  
  from_city_id UUID NOT NULL REFERENCES multi_city_package_cities(id) ON DELETE CASCADE,
  to_city_id UUID NOT NULL REFERENCES multi_city_package_cities(id) ON DELETE CASCADE,
  
  transport_type transport_type NOT NULL,
  transport_class transport_class DEFAULT 'STANDARD',
  provider VARCHAR(255),
  duration_hours INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  layover_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. INCLUSIONS
-- ============================================================================
CREATE TABLE multi_city_package_inclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_packages(id) ON DELETE CASCADE,
  
  category inclusion_category NOT NULL,
  text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. EXCLUSIONS
-- ============================================================================
CREATE TABLE multi_city_package_exclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_packages(id) ON DELETE CASCADE,
  
  text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. CANCELLATION TIERS
-- ============================================================================
CREATE TABLE multi_city_package_cancellation_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_packages(id) ON DELETE CASCADE,
  
  days_before INTEGER NOT NULL CHECK (days_before >= 0),
  refund_percent INTEGER NOT NULL CHECK (refund_percent >= 0 AND refund_percent <= 100),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. DEPARTURE DATES
-- ============================================================================
CREATE TABLE multi_city_package_departures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_packages(id) ON DELETE CASCADE,
  
  departure_date DATE NOT NULL,
  available_seats INTEGER,
  price DECIMAL(10,2),
  cutoff_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. DAY PLANS
-- ============================================================================
CREATE TABLE multi_city_package_day_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_packages(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES multi_city_package_cities(id) ON DELETE CASCADE,
  
  day_number INTEGER NOT NULL CHECK (day_number >= 1),
  
  -- Meals
  includes_breakfast BOOLEAN DEFAULT false,
  includes_lunch BOOLEAN DEFAULT false,
  includes_dinner BOOLEAN DEFAULT false,
  
  accommodation_type VARCHAR(255),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. DAY ACTIVITIES
-- ============================================================================
CREATE TABLE multi_city_package_day_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_plan_id UUID NOT NULL REFERENCES multi_city_package_day_plans(id) ON DELETE CASCADE,
  
  time_period VARCHAR(20) NOT NULL CHECK (time_period IN ('morning', 'afternoon', 'evening')),
  time VARCHAR(10),
  description TEXT NOT NULL,
  
  activity_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 11. ADD-ONS
-- ============================================================================
CREATE TABLE multi_city_package_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_packages(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Main package indexes
CREATE INDEX idx_multi_city_packages_operator ON multi_city_packages(operator_id);
CREATE INDEX idx_multi_city_packages_status ON multi_city_packages(status);
CREATE INDEX idx_multi_city_packages_created ON multi_city_packages(created_at DESC);
CREATE INDEX idx_multi_city_packages_region ON multi_city_packages(destination_region);

-- Image indexes
CREATE INDEX idx_multi_city_images_package ON multi_city_package_images(package_id);
CREATE INDEX idx_multi_city_images_cover ON multi_city_package_images(package_id, is_cover);

-- City indexes
CREATE INDEX idx_multi_city_cities_package ON multi_city_package_cities(package_id);
CREATE INDEX idx_multi_city_cities_order ON multi_city_package_cities(package_id, city_order);

-- Connection indexes
CREATE INDEX idx_multi_city_connections_package ON multi_city_package_connections(package_id);
CREATE INDEX idx_multi_city_connections_from ON multi_city_package_connections(from_city_id);
CREATE INDEX idx_multi_city_connections_to ON multi_city_package_connections(to_city_id);

-- Inclusion/Exclusion indexes
CREATE INDEX idx_multi_city_inclusions_package ON multi_city_package_inclusions(package_id);
CREATE INDEX idx_multi_city_exclusions_package ON multi_city_package_exclusions(package_id);

-- Cancellation indexes
CREATE INDEX idx_multi_city_cancellation_package ON multi_city_package_cancellation_tiers(package_id);

-- Departure indexes
CREATE INDEX idx_multi_city_departures_package ON multi_city_package_departures(package_id);
CREATE INDEX idx_multi_city_departures_date ON multi_city_package_departures(departure_date);

-- Day plan indexes
CREATE INDEX idx_multi_city_day_plans_package ON multi_city_package_day_plans(package_id);
CREATE INDEX idx_multi_city_day_plans_city ON multi_city_package_day_plans(city_id);
CREATE INDEX idx_multi_city_day_plans_day ON multi_city_package_day_plans(package_id, day_number);

-- Activity indexes
CREATE INDEX idx_multi_city_activities_day ON multi_city_package_day_activities(day_plan_id);

-- Add-on indexes
CREATE INDEX idx_multi_city_addons_package ON multi_city_package_addons(package_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE multi_city_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_package_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_package_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_package_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_package_inclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_package_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_package_cancellation_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_package_departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_package_day_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_package_day_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_package_addons ENABLE ROW LEVEL SECURITY;

-- Main package policies
CREATE POLICY "Users can view published multi-city packages"
  ON multi_city_packages FOR SELECT
  USING (status = 'published' OR operator_id = auth.uid());

CREATE POLICY "Operators can insert their own multi-city packages"
  ON multi_city_packages FOR INSERT
  WITH CHECK (operator_id = auth.uid());

CREATE POLICY "Operators can update their own multi-city packages"
  ON multi_city_packages FOR UPDATE
  USING (operator_id = auth.uid());

CREATE POLICY "Operators can delete their own multi-city packages"
  ON multi_city_packages FOR DELETE
  USING (operator_id = auth.uid());

-- Image policies
CREATE POLICY "Anyone can view multi-city package images"
  ON multi_city_package_images FOR SELECT
  USING (true);

CREATE POLICY "Operators can manage their package images"
  ON multi_city_package_images FOR ALL
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_images.package_id
    AND operator_id = auth.uid()
  ));

-- City policies
CREATE POLICY "Anyone can view cities for published packages"
  ON multi_city_package_cities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_cities.package_id
    AND (status = 'published' OR operator_id = auth.uid())
  ));

CREATE POLICY "Operators can manage their package cities"
  ON multi_city_package_cities FOR ALL
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_cities.package_id
    AND operator_id = auth.uid()
  ));

-- Connection policies
CREATE POLICY "Anyone can view connections for published packages"
  ON multi_city_package_connections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_connections.package_id
    AND (status = 'published' OR operator_id = auth.uid())
  ));

CREATE POLICY "Operators can manage their package connections"
  ON multi_city_package_connections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_connections.package_id
    AND operator_id = auth.uid()
  ));

-- Inclusion policies
CREATE POLICY "Anyone can view inclusions for published packages"
  ON multi_city_package_inclusions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_inclusions.package_id
    AND (status = 'published' OR operator_id = auth.uid())
  ));

CREATE POLICY "Operators can manage their package inclusions"
  ON multi_city_package_inclusions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_inclusions.package_id
    AND operator_id = auth.uid()
  ));

-- Exclusion policies
CREATE POLICY "Anyone can view exclusions for published packages"
  ON multi_city_package_exclusions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_exclusions.package_id
    AND (status = 'published' OR operator_id = auth.uid())
  ));

CREATE POLICY "Operators can manage their package exclusions"
  ON multi_city_package_exclusions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_exclusions.package_id
    AND operator_id = auth.uid()
  ));

-- Cancellation policies
CREATE POLICY "Anyone can view cancellation tiers for published packages"
  ON multi_city_package_cancellation_tiers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_cancellation_tiers.package_id
    AND (status = 'published' OR operator_id = auth.uid())
  ));

CREATE POLICY "Operators can manage their package cancellation tiers"
  ON multi_city_package_cancellation_tiers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_cancellation_tiers.package_id
    AND operator_id = auth.uid()
  ));

-- Departure policies
CREATE POLICY "Anyone can view departures for published packages"
  ON multi_city_package_departures FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_departures.package_id
    AND (status = 'published' OR operator_id = auth.uid())
  ));

CREATE POLICY "Operators can manage their package departures"
  ON multi_city_package_departures FOR ALL
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_departures.package_id
    AND operator_id = auth.uid()
  ));

-- Day plan policies
CREATE POLICY "Anyone can view day plans for published packages"
  ON multi_city_package_day_plans FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_day_plans.package_id
    AND (status = 'published' OR operator_id = auth.uid())
  ));

CREATE POLICY "Operators can manage their package day plans"
  ON multi_city_package_day_plans FOR ALL
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_day_plans.package_id
    AND operator_id = auth.uid()
  ));

-- Activity policies
CREATE POLICY "Anyone can view activities for published packages"
  ON multi_city_package_day_activities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM multi_city_package_day_plans dp
    JOIN multi_city_packages p ON p.id = dp.package_id
    WHERE dp.id = multi_city_package_day_activities.day_plan_id
    AND (p.status = 'published' OR p.operator_id = auth.uid())
  ));

CREATE POLICY "Operators can manage their package activities"
  ON multi_city_package_day_activities FOR ALL
  USING (EXISTS (
    SELECT 1 FROM multi_city_package_day_plans dp
    JOIN multi_city_packages p ON p.id = dp.package_id
    WHERE dp.id = multi_city_package_day_activities.day_plan_id
    AND p.operator_id = auth.uid()
  ));

-- Add-on policies
CREATE POLICY "Anyone can view addons for published packages"
  ON multi_city_package_addons FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_addons.package_id
    AND (status = 'published' OR operator_id = auth.uid())
  ));

CREATE POLICY "Operators can manage their package addons"
  ON multi_city_package_addons FOR ALL
  USING (EXISTS (
    SELECT 1 FROM multi_city_packages
    WHERE id = multi_city_package_addons.package_id
    AND operator_id = auth.uid()
  ));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_multi_city_package_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_multi_city_packages_updated_at
  BEFORE UPDATE ON multi_city_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_multi_city_package_updated_at();

-- Auto-calculate total nights, days, and cities
CREATE OR REPLACE FUNCTION calculate_multi_city_package_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE multi_city_packages
  SET 
    total_nights = (
      SELECT COALESCE(SUM(nights), 0)
      FROM multi_city_package_cities
      WHERE package_id = NEW.package_id
    ),
    total_days = (
      SELECT COALESCE(SUM(nights), 0) + 1
      FROM multi_city_package_cities
      WHERE package_id = NEW.package_id
    ),
    total_cities = (
      SELECT COUNT(*)
      FROM multi_city_package_cities
      WHERE package_id = NEW.package_id
    )
  WHERE id = NEW.package_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_multi_city_package_totals_on_city_change
  AFTER INSERT OR UPDATE OR DELETE ON multi_city_package_cities
  FOR EACH ROW
  EXECUTE FUNCTION calculate_multi_city_package_totals();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Multi-city packages schema created successfully!';
  RAISE NOTICE 'Tables created: 11';
  RAISE NOTICE 'RLS policies: Enabled on all tables';
  RAISE NOTICE 'Indexes: Optimized for performance';
END $$;

