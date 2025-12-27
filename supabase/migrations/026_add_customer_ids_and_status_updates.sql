-- ============================================================================
-- ADD CUSTOMER ID FIELDS AND UPDATE ITINERARY STATUS
-- ============================================================================
-- This migration adds customer_id fields to itineraries and leads tables,
-- creates generation functions, and updates itinerary status constraint.
-- ============================================================================

-- 1. Add customer_id to itineraries
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS customer_id TEXT;
CREATE INDEX IF NOT EXISTS idx_itineraries_customer_id ON itineraries(customer_id);

-- 2. Add customer_id to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS customer_id TEXT;
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON leads(customer_id);

-- 3. Create function to generate itinerary customer_id (format: IT250001)
CREATE OR REPLACE FUNCTION generate_itinerary_customer_id()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    next_number INTEGER;
    new_customer_id TEXT;
BEGIN
    year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM itineraries
    WHERE customer_id LIKE 'IT' || year_suffix || '%'
      AND LENGTH(customer_id) = 8;
    
    new_customer_id := 'IT' || year_suffix || LPAD(next_number::TEXT, 4, '0');
    RETURN new_customer_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to generate lead customer_id (format: LD250001)
CREATE OR REPLACE FUNCTION generate_lead_customer_id()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    next_number INTEGER;
    new_customer_id TEXT;
BEGIN
    year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM leads
    WHERE customer_id LIKE 'LD' || year_suffix || '%'
      AND LENGTH(customer_id) = 8;
    
    new_customer_id := 'LD' || year_suffix || LPAD(next_number::TEXT, 4, '0');
    RETURN new_customer_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Update itinerary status constraint to include new statuses
-- First, drop the existing constraint
ALTER TABLE itineraries DROP CONSTRAINT IF EXISTS itineraries_status_check;

-- Add new constraint with all statuses
ALTER TABLE itineraries ADD CONSTRAINT itineraries_status_check 
    CHECK (status IN ('draft', 'completed', 'sent', 'approved', 'rejected', 'invoice_sent', 'payment_received', 'confirmed', 'locked'));

-- 6. Add unique constraint on customer_id for itineraries (if not already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'itineraries_customer_id_unique'
    ) THEN
        ALTER TABLE itineraries ADD CONSTRAINT itineraries_customer_id_unique UNIQUE (customer_id);
    END IF;
END $$;

-- 7. Add unique constraint on customer_id for leads (if not already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'leads_customer_id_unique'
    ) THEN
        ALTER TABLE leads ADD CONSTRAINT leads_customer_id_unique UNIQUE (customer_id);
    END IF;
END $$;

