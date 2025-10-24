-- ========================================
-- CREATE ACTIVITY PACKAGE PRICING OPTIONS SCHEMA
-- ========================================
-- This schema handles two types of pricing for activity packages:
-- 1. Ticket Only Pricing - Adult and child tickets with age specifications
-- 2. Ticket with Transfer Pricing - Includes vehicle options

-- ========================================
-- 1. TICKET ONLY PRICING TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS activity_ticket_only_pricing (
  -- Primary fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES activity_packages(id) ON DELETE CASCADE,
  
  -- Pricing Name/Description
  option_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Adult Pricing
  adult_price DECIMAL(10, 2) NOT NULL CHECK (adult_price >= 0),
  
  -- Child Pricing
  child_price DECIMAL(10, 2) NOT NULL CHECK (child_price >= 0),
  child_min_age INTEGER NOT NULL DEFAULT 2 CHECK (child_min_age >= 0),
  child_max_age INTEGER NOT NULL DEFAULT 12 CHECK (child_max_age > child_min_age),
  
  -- Infant Pricing (Optional)
  infant_price DECIMAL(10, 2) DEFAULT 0 CHECK (infant_price >= 0),
  infant_max_age INTEGER DEFAULT 2 CHECK (infant_max_age > 0),
  
  -- Additional Information
  included_items TEXT[], -- Array of what's included with this ticket
  excluded_items TEXT[], -- Array of what's not included
  
  -- Status and Display
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. TICKET WITH TRANSFER PRICING TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS activity_ticket_with_transfer_pricing (
  -- Primary fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES activity_packages(id) ON DELETE CASCADE,
  
  -- Pricing Name/Description
  option_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Vehicle Information
  vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('SEDAN', 'SUV', 'VAN', 'BUS', 'LUXURY', 'MINIBUS', 'MINIVAN')),
  vehicle_name VARCHAR(100) NOT NULL,
  max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
  
  -- Vehicle Features
  vehicle_features TEXT[], -- Array of vehicle features (e.g., 'AC', 'WiFi', 'Leather Seats')
  
  -- Pricing per Person (with transfer included)
  adult_price DECIMAL(10, 2) NOT NULL CHECK (adult_price >= 0),
  child_price DECIMAL(10, 2) NOT NULL CHECK (child_price >= 0),
  child_min_age INTEGER NOT NULL DEFAULT 2 CHECK (child_min_age >= 0),
  child_max_age INTEGER NOT NULL DEFAULT 12 CHECK (child_max_age > child_min_age),
  
  -- Infant Pricing (Optional)
  infant_price DECIMAL(10, 2) DEFAULT 0 CHECK (infant_price >= 0),
  infant_max_age INTEGER DEFAULT 2 CHECK (infant_max_age > 0),
  
  -- Transfer Details
  pickup_location VARCHAR(255),
  pickup_instructions TEXT,
  dropoff_location VARCHAR(255),
  dropoff_instructions TEXT,
  
  -- Additional Information
  included_items TEXT[], -- Array of what's included (activity + transfer)
  excluded_items TEXT[], -- Array of what's not included
  
  -- Status and Display
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. INDEXES FOR PERFORMANCE
-- ========================================

-- Ticket only pricing indexes
CREATE INDEX IF NOT EXISTS idx_activity_ticket_only_pricing_package_id 
  ON activity_ticket_only_pricing(package_id);

CREATE INDEX IF NOT EXISTS idx_activity_ticket_only_pricing_active 
  ON activity_ticket_only_pricing(package_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_activity_ticket_only_pricing_featured 
  ON activity_ticket_only_pricing(package_id, is_featured) 
  WHERE is_featured = true;

-- Ticket with transfer pricing indexes
CREATE INDEX IF NOT EXISTS idx_activity_ticket_transfer_pricing_package_id 
  ON activity_ticket_with_transfer_pricing(package_id);

CREATE INDEX IF NOT EXISTS idx_activity_ticket_transfer_pricing_active 
  ON activity_ticket_with_transfer_pricing(package_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_activity_ticket_transfer_pricing_vehicle 
  ON activity_ticket_with_transfer_pricing(package_id, vehicle_type);

CREATE INDEX IF NOT EXISTS idx_activity_ticket_transfer_pricing_featured 
  ON activity_ticket_with_transfer_pricing(package_id, is_featured) 
  WHERE is_featured = true;

-- ========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on both tables
ALTER TABLE activity_ticket_only_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_ticket_with_transfer_pricing ENABLE ROW LEVEL SECURITY;

-- ========================================
-- TICKET ONLY PRICING POLICIES
-- ========================================

-- Allow operators to manage their own pricing options
CREATE POLICY "Operators can view their own ticket-only pricing options"
  ON activity_ticket_only_pricing
  FOR SELECT
  USING (
    package_id IN (
      SELECT id FROM activity_packages WHERE operator_id = auth.uid()
    )
  );

CREATE POLICY "Operators can insert their own ticket-only pricing options"
  ON activity_ticket_only_pricing
  FOR INSERT
  WITH CHECK (
    package_id IN (
      SELECT id FROM activity_packages WHERE operator_id = auth.uid()
    )
  );

CREATE POLICY "Operators can update their own ticket-only pricing options"
  ON activity_ticket_only_pricing
  FOR UPDATE
  USING (
    package_id IN (
      SELECT id FROM activity_packages WHERE operator_id = auth.uid()
    )
  );

CREATE POLICY "Operators can delete their own ticket-only pricing options"
  ON activity_ticket_only_pricing
  FOR DELETE
  USING (
    package_id IN (
      SELECT id FROM activity_packages WHERE operator_id = auth.uid()
    )
  );

-- Allow public to view active pricing options for published packages
CREATE POLICY "Public can view active ticket-only pricing for published packages"
  ON activity_ticket_only_pricing
  FOR SELECT
  USING (
    is_active = true
    AND package_id IN (
      SELECT id FROM activity_packages WHERE status = 'published'
    )
  );

-- ========================================
-- TICKET WITH TRANSFER PRICING POLICIES
-- ========================================

-- Allow operators to manage their own pricing options
CREATE POLICY "Operators can view their own ticket-transfer pricing options"
  ON activity_ticket_with_transfer_pricing
  FOR SELECT
  USING (
    package_id IN (
      SELECT id FROM activity_packages WHERE operator_id = auth.uid()
    )
  );

CREATE POLICY "Operators can insert their own ticket-transfer pricing options"
  ON activity_ticket_with_transfer_pricing
  FOR INSERT
  WITH CHECK (
    package_id IN (
      SELECT id FROM activity_packages WHERE operator_id = auth.uid()
    )
  );

CREATE POLICY "Operators can update their own ticket-transfer pricing options"
  ON activity_ticket_with_transfer_pricing
  FOR UPDATE
  USING (
    package_id IN (
      SELECT id FROM activity_packages WHERE operator_id = auth.uid()
    )
  );

CREATE POLICY "Operators can delete their own ticket-transfer pricing options"
  ON activity_ticket_with_transfer_pricing
  FOR DELETE
  USING (
    package_id IN (
      SELECT id FROM activity_packages WHERE operator_id = auth.uid()
    )
  );

-- Allow public to view active pricing options for published packages
CREATE POLICY "Public can view active ticket-transfer pricing for published packages"
  ON activity_ticket_with_transfer_pricing
  FOR SELECT
  USING (
    is_active = true
    AND package_id IN (
      SELECT id FROM activity_packages WHERE status = 'published'
    )
  );

-- ========================================
-- 5. TRIGGERS FOR UPDATED_AT TIMESTAMP
-- ========================================

-- Function to update updated_at timestamp (reuse if exists)
CREATE OR REPLACE FUNCTION update_activity_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ticket only pricing
CREATE TRIGGER update_activity_ticket_only_pricing_timestamp
  BEFORE UPDATE ON activity_ticket_only_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_pricing_updated_at();

-- Trigger for ticket with transfer pricing
CREATE TRIGGER update_activity_ticket_transfer_pricing_timestamp
  BEFORE UPDATE ON activity_ticket_with_transfer_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_pricing_updated_at();

-- ========================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE activity_ticket_only_pricing IS 'Stores ticket-only pricing options for activity packages with adult and child pricing';
COMMENT ON TABLE activity_ticket_with_transfer_pricing IS 'Stores ticket with transfer pricing options including vehicle details and capacity';

COMMENT ON COLUMN activity_ticket_only_pricing.adult_price IS 'Price for adult tickets';
COMMENT ON COLUMN activity_ticket_only_pricing.child_price IS 'Price for child tickets';
COMMENT ON COLUMN activity_ticket_only_pricing.child_min_age IS 'Minimum age for child pricing (inclusive)';
COMMENT ON COLUMN activity_ticket_only_pricing.child_max_age IS 'Maximum age for child pricing (inclusive)';

COMMENT ON COLUMN activity_ticket_with_transfer_pricing.vehicle_type IS 'Type of vehicle for transfer';
COMMENT ON COLUMN activity_ticket_with_transfer_pricing.vehicle_name IS 'Specific name/model of the vehicle';
COMMENT ON COLUMN activity_ticket_with_transfer_pricing.max_capacity IS 'Maximum number of passengers (including children)';
COMMENT ON COLUMN activity_ticket_with_transfer_pricing.adult_price IS 'Price per adult including ticket and transfer';
COMMENT ON COLUMN activity_ticket_with_transfer_pricing.child_price IS 'Price per child including ticket and transfer';

-- ========================================
-- 7. SAMPLE DATA (Optional - for testing)
-- ========================================

-- You can add sample pricing options after creating your first activity package
-- Example:
/*
INSERT INTO activity_ticket_only_pricing (
  package_id,
  option_name,
  description,
  adult_price,
  child_price,
  child_min_age,
  child_max_age,
  included_items
) VALUES (
  'YOUR_PACKAGE_ID',
  'Standard Admission',
  'General admission ticket to the activity',
  50.00,
  25.00,
  3,
  12,
  ARRAY['Activity entrance', 'Safety equipment', 'Professional guide']
);

INSERT INTO activity_ticket_with_transfer_pricing (
  package_id,
  option_name,
  description,
  vehicle_type,
  vehicle_name,
  max_capacity,
  adult_price,
  child_price,
  child_min_age,
  child_max_age,
  vehicle_features,
  included_items
) VALUES (
  'YOUR_PACKAGE_ID',
  'Premium Package with Hotel Transfer',
  'Activity ticket with round-trip hotel transfer',
  'SEDAN',
  'Mercedes E-Class',
  4,
  75.00,
  40.00,
  3,
  12,
  ARRAY['Air conditioning', 'WiFi', 'Leather seats', 'Bottled water'],
  ARRAY['Activity entrance', 'Safety equipment', 'Professional guide', 'Round-trip transfer', 'Hotel pickup/dropoff']
);
*/

