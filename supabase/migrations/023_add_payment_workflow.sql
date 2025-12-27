-- ============================================================================
-- PAYMENT WORKFLOW AND ITINERARY CONFIRMATION
-- ============================================================================
-- This migration adds payment tracking, invoice management, and itinerary
-- confirmation/locking functionality.
-- ============================================================================

-- Add payment and confirmation fields to itineraries
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES users(id);
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES users(id);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_itineraries_confirmed_at ON itineraries(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_itineraries_is_locked ON itineraries(is_locked);
CREATE INDEX IF NOT EXISTS idx_itineraries_locked_at ON itineraries(locked_at);

-- Payment tracking table
CREATE TABLE IF NOT EXISTS itinerary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit', 'partial', 'full', 'refund')),
  payment_method TEXT, -- 'bank_transfer', 'credit_card', 'cash', 'check', 'other'
  payment_reference TEXT, -- Transaction ID, check number, etc.
  received_at TIMESTAMP WITH TIME ZONE,
  received_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_itinerary_payments_itinerary_id ON itinerary_payments(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_payments_received_at ON itinerary_payments(received_at DESC);

-- Invoice tracking table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL, -- Format: INV-YYYY-NNNNNN
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  due_date DATE,
  pdf_url TEXT, -- S3 or storage URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_itinerary_id ON invoices(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    next_number INTEGER;
    new_invoice_number TEXT;
BEGIN
    -- Get last 2 digits of current year
    year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
    
    -- Get the highest number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_number
    FROM invoices
    WHERE invoice_number LIKE 'INV' || year_suffix || '%'
      AND LENGTH(invoice_number) = 10; -- Ensure format matches INVYYNNNNNN (10 chars)
    
    -- Format: INV + YY + NNNNNN (10 characters total)
    new_invoice_number := 'INV' || year_suffix || LPAD(next_number::TEXT, 6, '0');
    
    RETURN new_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_itinerary_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_itinerary_payments_updated_at
  BEFORE UPDATE ON itinerary_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_itinerary_payments_updated_at();

CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

