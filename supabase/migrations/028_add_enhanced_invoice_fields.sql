-- ============================================================================
-- ENHANCED INVOICE FIELDS AND LEAD LINKING
-- ============================================================================
-- This migration adds lead_id to invoices table and enhanced invoice fields
-- including billing address, tax information, line items, payment terms, etc.
-- ============================================================================

-- Add lead_id to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_invoices_lead_id ON invoices(lead_id);

-- Add enhanced invoice fields
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_address JSONB; -- {street, city, state, zip, country}
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2); -- Before tax
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms TEXT; -- e.g., "Net 30", "Due on receipt"
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT; -- Additional notes
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS line_items JSONB; -- Array of {description, quantity, unit_price, total}

-- Update existing invoices to have lead_id from their itinerary
UPDATE invoices 
SET lead_id = (
  SELECT lead_id::uuid
  FROM itineraries 
  WHERE itineraries.id = invoices.itinerary_id
    AND itineraries.lead_id IS NOT NULL
)
WHERE lead_id IS NULL
  AND EXISTS (
    SELECT 1 
    FROM itineraries 
    WHERE itineraries.id = invoices.itinerary_id
      AND itineraries.lead_id IS NOT NULL
  );

