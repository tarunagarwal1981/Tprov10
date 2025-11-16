-- ============================================================================
-- UPDATE MULTI-CITY PRICING: STANDARD -> SIC with Tabular Format
-- ============================================================================
-- Changes:
-- 1. Rename STANDARD pricing type to SIC
-- 2. Create table for tabular pricing rows (adults, children, total price)
-- 3. Add child age fields (min_age, max_age) - conditional
-- 4. Remove per-person pricing fields (make nullable/deprecated)
-- ============================================================================

-- ============================================================================
-- 1. UPDATE ENUM: STANDARD -> SIC
-- ============================================================================

-- First, update any existing STANDARD records to SIC
UPDATE multi_city_pricing_packages 
SET pricing_type = 'SIC'::text::multi_city_pricing_type
WHERE pricing_type = 'STANDARD';

-- Add SIC to enum (if it doesn't exist)
DO $$ 
BEGIN
  -- Check if SIC already exists in enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'SIC' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'multi_city_pricing_type')
  ) THEN
    -- Add SIC to enum
    ALTER TYPE multi_city_pricing_type ADD VALUE 'SIC';
  END IF;
END $$;

-- Note: We cannot remove 'STANDARD' from enum if it's still referenced
-- We'll keep it for backward compatibility but use SIC going forward

-- ============================================================================
-- 2. CREATE TABULAR PRICING ROWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_city_pricing_rows (
  -- Primary fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_package_id UUID NOT NULL REFERENCES multi_city_pricing_packages(id) ON DELETE CASCADE,
  
  -- Tabular pricing columns
  number_of_adults INTEGER NOT NULL CHECK (number_of_adults >= 0),
  number_of_children INTEGER NOT NULL DEFAULT 0 CHECK (number_of_children >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0), -- Total price (adult + child)
  
  -- Display order
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique combination per pricing package
  CONSTRAINT unique_pricing_row UNIQUE (pricing_package_id, number_of_adults, number_of_children)
);

-- ============================================================================
-- 3. UPDATE MAIN PRICING TABLE: Add child age fields
-- ============================================================================

-- Add child age fields (conditional - only if checkbox is selected)
ALTER TABLE multi_city_pricing_packages
  ADD COLUMN IF NOT EXISTS has_child_age_restriction BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS child_min_age INTEGER CHECK (child_min_age >= 0),
  ADD COLUMN IF NOT EXISTS child_max_age INTEGER CHECK (child_max_age > child_min_age);

-- Make old per-person pricing fields nullable (deprecated but kept for migration)
ALTER TABLE multi_city_pricing_packages
  ALTER COLUMN adult_price DROP NOT NULL,
  ALTER COLUMN child_price DROP NOT NULL,
  ALTER COLUMN child_min_age DROP NOT NULL,
  ALTER COLUMN child_max_age DROP NOT NULL;

-- Add constraint: child age fields are required if has_child_age_restriction is true
ALTER TABLE multi_city_pricing_packages
  ADD CONSTRAINT child_age_restriction_check 
  CHECK (
    (has_child_age_restriction = false) OR 
    (has_child_age_restriction = true AND child_min_age IS NOT NULL AND child_max_age IS NOT NULL)
  );

-- ============================================================================
-- 4. CREATE INDEXES FOR PRICING ROWS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_multi_city_pricing_rows_pricing_package_id 
  ON multi_city_pricing_rows(pricing_package_id);

CREATE INDEX IF NOT EXISTS idx_multi_city_pricing_rows_display_order 
  ON multi_city_pricing_rows(pricing_package_id, display_order);

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY FOR PRICING ROWS
-- ============================================================================

ALTER TABLE multi_city_pricing_rows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Operators can view their own pricing rows" ON multi_city_pricing_rows;
DROP POLICY IF EXISTS "Operators can create pricing rows" ON multi_city_pricing_rows;
DROP POLICY IF EXISTS "Operators can update their own pricing rows" ON multi_city_pricing_rows;
DROP POLICY IF EXISTS "Operators can delete their own pricing rows" ON multi_city_pricing_rows;
DROP POLICY IF EXISTS "Public can view pricing rows for published tours" ON multi_city_pricing_rows;

-- Pricing rows policies
CREATE POLICY "Operators can view their own pricing rows"
  ON multi_city_pricing_rows FOR SELECT
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can create pricing rows"
  ON multi_city_pricing_rows FOR INSERT
  WITH CHECK (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can update their own pricing rows"
  ON multi_city_pricing_rows FOR UPDATE
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators can delete their own pricing rows"
  ON multi_city_pricing_rows FOR DELETE
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE operator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view pricing rows for published tours"
  ON multi_city_pricing_rows FOR SELECT
  USING (
    pricing_package_id IN (
      SELECT id FROM multi_city_pricing_packages 
      WHERE package_id IN (
        SELECT id FROM multi_city_packages WHERE status = 'published'
      )
    )
  );

-- ============================================================================
-- 6. CREATE TRIGGER FOR PRICING ROWS UPDATE TIMESTAMP
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_multi_city_pricing_rows_updated_at ON multi_city_pricing_rows;

-- Update timestamp for pricing rows
CREATE OR REPLACE FUNCTION update_multi_city_pricing_rows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_multi_city_pricing_rows_updated_at
  BEFORE UPDATE ON multi_city_pricing_rows
  FOR EACH ROW
  EXECUTE FUNCTION update_multi_city_pricing_rows_updated_at();

-- ============================================================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE multi_city_pricing_rows IS 
  'Tabular pricing rows for SIC pricing. Each row represents a pricing combination with number of adults, children, and total price.';

COMMENT ON COLUMN multi_city_pricing_rows.number_of_adults IS 
  'Number of adults for this pricing row';

COMMENT ON COLUMN multi_city_pricing_rows.number_of_children IS 
  'Number of children for this pricing row (can be 0)';

COMMENT ON COLUMN multi_city_pricing_rows.total_price IS 
  'Total price for this combination (adult + child combined price)';

COMMENT ON COLUMN multi_city_pricing_packages.has_child_age_restriction IS 
  'Whether child age restrictions are enabled. If true, child_min_age and child_max_age must be set.';

COMMENT ON COLUMN multi_city_pricing_packages.child_min_age IS 
  'Minimum age for children (required if has_child_age_restriction is true)';

COMMENT ON COLUMN multi_city_pricing_packages.child_max_age IS 
  'Maximum age for children (required if has_child_age_restriction is true)';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Multi-city pricing updated to SIC with tabular format!';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Added SIC to pricing_type enum';
  RAISE NOTICE '  - Created multi_city_pricing_rows table for tabular pricing';
  RAISE NOTICE '  - Added child age restriction fields (has_child_age_restriction, child_min_age, child_max_age)';
  RAISE NOTICE '  - Made old per-person pricing fields nullable (deprecated)';
  RAISE NOTICE '  - Added RLS policies for pricing rows';
  RAISE NOTICE '  - Created indexes for performance';
END $$;

