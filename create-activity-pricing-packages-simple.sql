-- ========================================
-- SIMPLIFIED ACTIVITY PRICING PACKAGES SCHEMA
-- ========================================
-- This schema handles flexible pricing packages with optional transfers
-- Each package is a complete template with:
-- 1. Package name (e.g., "Basic Experience", "Premium VIP")
-- 2. Ticket pricing (adult/child/infant)
-- 3. Optional transfer pricing (shared shuttle or private car) - per person
-- 4. Flexible age ranges
-- 5. Included items list

-- ========================================
-- 1. DROP OLD TABLES (if they exist)
-- ========================================
-- Only if you want to start fresh with the new simplified structure
-- COMMENT THESE OUT if you want to keep existing data

-- DROP TABLE IF EXISTS activity_ticket_only_pricing CASCADE;
-- DROP TABLE IF EXISTS activity_ticket_with_transfer_pricing CASCADE;

-- ========================================
-- 2. CREATE SIMPLIFIED PRICING PACKAGES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS activity_pricing_packages (
  -- Primary fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES activity_packages(id) ON DELETE CASCADE,
  
  -- Package Template Name
  package_name VARCHAR(100) NOT NULL, -- e.g., "Basic Experience", "Premium VIP", "Family Package"
  description TEXT,
  
  -- ========================================
  -- TICKET PRICING (Required)
  -- ========================================
  
  -- Adult Pricing
  adult_price DECIMAL(10, 2) NOT NULL CHECK (adult_price >= 0),
  
  -- Child Pricing
  child_price DECIMAL(10, 2) NOT NULL CHECK (child_price >= 0),
  child_min_age INTEGER NOT NULL DEFAULT 3 CHECK (child_min_age >= 0),
  child_max_age INTEGER NOT NULL DEFAULT 12 CHECK (child_max_age > child_min_age),
  
  -- Infant Pricing (Optional - can be 0 for free)
  infant_price DECIMAL(10, 2) DEFAULT 0 CHECK (infant_price >= 0),
  infant_max_age INTEGER DEFAULT 2 CHECK (infant_max_age >= 0),
  
  -- ========================================
  -- OPTIONAL TRANSFER PRICING (Per Person)
  -- ========================================
  
  -- Transfer included flag
  transfer_included BOOLEAN DEFAULT false,
  
  -- Transfer Type: 'SHARED' (shared shuttle) or 'PRIVATE' (private car)
  transfer_type VARCHAR(20) CHECK (transfer_type IN ('SHARED', 'PRIVATE') OR transfer_type IS NULL),
  
  -- Transfer pricing per person (additional cost on top of ticket price)
  transfer_price_adult DECIMAL(10, 2) CHECK (transfer_price_adult >= 0 OR transfer_price_adult IS NULL),
  transfer_price_child DECIMAL(10, 2) CHECK (transfer_price_child >= 0 OR transfer_price_child IS NULL),
  transfer_price_infant DECIMAL(10, 2) CHECK (transfer_price_infant >= 0 OR transfer_price_infant IS NULL),
  
  -- Transfer details
  pickup_location VARCHAR(255),
  pickup_instructions TEXT,
  dropoff_location VARCHAR(255),
  dropoff_instructions TEXT,
  
  -- ========================================
  -- WHAT'S INCLUDED
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_activity_pricing_packages_package_id 
  ON activity_pricing_packages(package_id);

CREATE INDEX IF NOT EXISTS idx_activity_pricing_packages_active 
  ON activity_pricing_packages(package_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_activity_pricing_packages_featured 
  ON activity_pricing_packages(package_id, is_featured) 
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_activity_pricing_packages_display_order 
  ON activity_pricing_packages(package_id, display_order);

-- ========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE activity_pricing_packages ENABLE ROW LEVEL SECURITY;

-- Allow operators to view their own pricing packages
CREATE POLICY "Operators can view their own pricing packages"
  ON activity_pricing_packages
  FOR SELECT
  USING (
    package_id IN (
      SELECT id FROM activity_packages WHERE operator_id = auth.uid()
    )
  );

-- Allow operators to create pricing packages for their own activity packages
CREATE POLICY "Operators can create pricing packages"
  ON activity_pricing_packages
  FOR INSERT
  WITH CHECK (
    package_id IN (
      SELECT id FROM activity_packages WHERE operator_id = auth.uid()
    )
  );

-- Allow operators to update their own pricing packages
CREATE POLICY "Operators can update their own pricing packages"
  ON activity_pricing_packages
  FOR UPDATE
  USING (
    package_id IN (
      SELECT id FROM activity_packages WHERE operator_id = auth.uid()
    )
  )
  WITH CHECK (
    package_id IN (
      SELECT id FROM activity_packages WHERE operator_id = auth.uid()
    )
  );

-- Allow operators to delete their own pricing packages
CREATE POLICY "Operators can delete their own pricing packages"
  ON activity_pricing_packages
  FOR DELETE
  USING (
    package_id IN (
      SELECT id FROM activity_packages WHERE operator_id = auth.uid()
    )
  );

-- Allow public to view active pricing packages for published activities
CREATE POLICY "Public can view active pricing packages"
  ON activity_pricing_packages
  FOR SELECT
  USING (
    is_active = true 
    AND package_id IN (
      SELECT id FROM activity_packages WHERE status = 'published'
    )
  );

-- ========================================
-- 5. TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ========================================

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_activity_pricing_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_activity_pricing_packages_updated_at 
  ON activity_pricing_packages;

CREATE TRIGGER trigger_update_activity_pricing_packages_updated_at
  BEFORE UPDATE ON activity_pricing_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_pricing_packages_updated_at();

-- ========================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE activity_pricing_packages IS 
  'Flexible pricing packages for activity packages with optional transfers. Each row is a complete package template (e.g., Basic, Premium, VIP) with ticket pricing and optional transfer add-ons.';

COMMENT ON COLUMN activity_pricing_packages.package_name IS 
  'User-defined package name (e.g., "Basic Experience", "Premium VIP", "Family Package")';

COMMENT ON COLUMN activity_pricing_packages.transfer_included IS 
  'Whether this package includes transfer service';

COMMENT ON COLUMN activity_pricing_packages.transfer_type IS 
  'Type of transfer: SHARED (shared shuttle) or PRIVATE (private car)';

COMMENT ON COLUMN activity_pricing_packages.transfer_price_adult IS 
  'Additional per-person transfer cost for adults (added to ticket price)';

COMMENT ON COLUMN activity_pricing_packages.is_featured IS 
  'Mark as featured/recommended (e.g., "Most Popular", "Best Value")';

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check if table was created
SELECT 'Table Created' as status,
       COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'activity_pricing_packages';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'activity_pricing_packages';

-- Check RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'activity_pricing_packages';

