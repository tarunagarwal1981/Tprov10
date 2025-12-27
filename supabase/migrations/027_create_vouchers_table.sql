-- ============================================================================
-- VOUCHERS TABLE AND FUNCTIONALITY
-- ============================================================================
-- This migration creates the vouchers table to track all issued vouchers
-- linked to proposals (itineraries), agents, and sub-agents.
-- ============================================================================

-- Create vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References (using users, NOT auth.users)
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  itinerary_item_id UUID NOT NULL REFERENCES itinerary_items(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES users(id), -- Main agent who owns the itinerary
  issued_by UUID REFERENCES users(id), -- Agent or sub-agent who issued the voucher
  
  -- Voucher Information
  voucher_number TEXT UNIQUE NOT NULL, -- Format: VOU-YYYY-NNNNNN
  booking_reference TEXT NOT NULL, -- Format: {customer_id}-{item_id_suffix}
  
  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'sent', 'used', 'cancelled', 'expired')),
  
  -- Timestamps
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration date
  
  -- PDF Storage
  pdf_url TEXT, -- S3 or storage URL for the generated PDF
  
  -- Additional Information
  notes TEXT,
  cancellation_reason TEXT, -- If cancelled, reason for cancellation
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_vouchers_itinerary_id ON vouchers(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_itinerary_item_id ON vouchers(itinerary_item_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_lead_id ON vouchers(lead_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_agent_id ON vouchers(agent_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_issued_by ON vouchers(issued_by);
CREATE INDEX IF NOT EXISTS idx_vouchers_voucher_number ON vouchers(voucher_number);
CREATE INDEX IF NOT EXISTS idx_vouchers_booking_reference ON vouchers(booking_reference);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_issued_at ON vouchers(issued_at DESC);

-- Function to generate voucher number (format: VOU-YYYY-NNNNNN)
DROP FUNCTION IF EXISTS generate_voucher_number();
CREATE OR REPLACE FUNCTION generate_voucher_number()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    next_number INTEGER;
    new_voucher_number TEXT;
BEGIN
    -- Get last 2 digits of current year
    year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
    
    -- Get the highest number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(voucher_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_number
    FROM vouchers
    WHERE voucher_number LIKE 'VOU' || year_suffix || '%'
      AND LENGTH(voucher_number) = 10; -- Ensure format matches VOUYYNNNNNN (10 chars)
    
    -- Format: VOU + YY + NNNNNN (10 characters total)
    new_voucher_number := 'VOU' || year_suffix || LPAD(next_number::TEXT, 6, '0');
    
    RETURN new_voucher_number;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS trigger_update_vouchers_updated_at ON vouchers;
DROP FUNCTION IF EXISTS update_vouchers_updated_at();
CREATE OR REPLACE FUNCTION update_vouchers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vouchers_updated_at
  BEFORE UPDATE ON vouchers
  FOR EACH ROW
  EXECUTE FUNCTION update_vouchers_updated_at();

-- Add comments for documentation
COMMENT ON TABLE vouchers IS 'Tracks all issued vouchers for itinerary items, linked to agents and sub-agents';
COMMENT ON COLUMN vouchers.itinerary_id IS 'Reference to the proposal/itinerary';
COMMENT ON COLUMN vouchers.itinerary_item_id IS 'Reference to the specific package/item in the itinerary';
COMMENT ON COLUMN vouchers.lead_id IS 'Reference to the lead/customer';
COMMENT ON COLUMN vouchers.agent_id IS 'Main agent who owns the itinerary';
COMMENT ON COLUMN vouchers.issued_by IS 'Agent or sub-agent who issued the voucher';
COMMENT ON COLUMN vouchers.voucher_number IS 'Unique voucher number in format VOU-YYYY-NNNNNN';
COMMENT ON COLUMN vouchers.booking_reference IS 'Booking reference for customer tracking';
COMMENT ON COLUMN vouchers.status IS 'Current status: issued, sent, used, cancelled, expired';
COMMENT ON COLUMN vouchers.pdf_url IS 'URL to the generated voucher PDF (S3 or storage)';

