-- ============================================================================
-- ADD CUSTOMER FIELDS TO LEAD_MARKETPLACE TABLE
-- ============================================================================
-- Adds customer details fields to lead_marketplace table
-- These fields store customer info that is hidden until lead is purchased
-- ============================================================================

-- Add customer information columns (hidden until purchase)
ALTER TABLE lead_marketplace
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS detailed_requirements TEXT;

-- Add comments
COMMENT ON COLUMN lead_marketplace.customer_name IS 'Customer name - hidden until purchase';
COMMENT ON COLUMN lead_marketplace.customer_email IS 'Customer email - hidden until purchase';
COMMENT ON COLUMN lead_marketplace.customer_phone IS 'Customer phone - hidden until purchase';
COMMENT ON COLUMN lead_marketplace.detailed_requirements IS 'Detailed customer requirements - hidden until purchase';

-- Note: RLS policies should prevent agents from seeing these fields
-- until they purchase the lead (via the purchase policy)

