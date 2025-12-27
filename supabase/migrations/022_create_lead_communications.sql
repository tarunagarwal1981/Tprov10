-- ============================================================================
-- LEAD COMMUNICATIONS TABLE
-- ============================================================================
-- This migration creates the lead_communications table to track all customer
-- communications (emails, calls, app messages) with timestamps and responses.
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id), -- NULL if sub-agent
  sub_agent_id UUID REFERENCES users(id), -- NULL if main agent
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'phone_call', 'app_message', 'whatsapp', 'meeting', 'other')),
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  subject TEXT, -- For emails
  content TEXT, -- Message content or call notes
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  customer_response TEXT CHECK (customer_response IN ('positive', 'negative', 'no_response', 'pending')),
  response_notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of file URLs/names
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_lead_communications_lead_id ON lead_communications(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_communications_created_at ON lead_communications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_communications_agent_id ON lead_communications(agent_id);
CREATE INDEX IF NOT EXISTS idx_lead_communications_sub_agent_id ON lead_communications(sub_agent_id);
CREATE INDEX IF NOT EXISTS idx_lead_communications_communication_type ON lead_communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_lead_communications_direction ON lead_communications(direction);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_lead_communications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_communications_updated_at
  BEFORE UPDATE ON lead_communications
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_communications_updated_at();

