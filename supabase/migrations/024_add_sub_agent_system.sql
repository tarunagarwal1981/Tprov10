-- ============================================================================
-- SUB-AGENT MANAGEMENT SYSTEM
-- ============================================================================
-- This migration adds sub-agent functionality, allowing agents to create
-- sub-agents and assign leads to them.
-- ============================================================================

-- Add parent_agent_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_agent_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_users_parent_agent_id ON users(parent_agent_id);

-- Add SUB_AGENT role to user_role enum
-- Note: This may fail if the enum already has the value, which is fine
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'TOUR_OPERATOR', 'TRAVEL_AGENT', 'SUB_AGENT', 'USER');
    ELSE
        -- Try to add SUB_AGENT if it doesn't exist
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUB_AGENT';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Sub-agent assignments table
CREATE TABLE IF NOT EXISTS sub_agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sub_agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  UNIQUE(lead_id, sub_agent_id)
);

CREATE INDEX IF NOT EXISTS idx_sub_agent_assignments_agent_id ON sub_agent_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_sub_agent_assignments_sub_agent_id ON sub_agent_assignments(sub_agent_id);
CREATE INDEX IF NOT EXISTS idx_sub_agent_assignments_lead_id ON sub_agent_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_sub_agent_assignments_assigned_at ON sub_agent_assignments(assigned_at DESC);

