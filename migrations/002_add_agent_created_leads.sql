-- ============================================================================
-- ADD AGENT CREATED LEADS FUNCTIONALITY
-- ============================================================================
-- This migration adds fields to the existing leads table to support
-- agent-created leads with draft functionality and sub-agent tracking.
-- ============================================================================

-- 1. Add status field (draft/published)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' 
  CHECK (status IN ('draft', 'published', 'archived'));

-- 2. Add source_custom field for custom lead sources (e.g., "Facebook Ads")
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_custom TEXT;

-- 3. Add services array field for service checkboxes
ALTER TABLE leads ADD COLUMN IF NOT EXISTS services TEXT[];

-- 4. Add travel_month field
ALTER TABLE leads ADD COLUMN IF NOT EXISTS travel_month TEXT;

-- 5. Add origin field (required in form)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS origin TEXT;

-- 6. Add created_by_sub_agent_id field (for future tracking)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by_sub_agent_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_leads_created_by_sub_agent ON leads(created_by_sub_agent_id);

-- 7. Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- 8. Performance Optimization - Composite Indexes
-- Composite index for common query pattern: agent_id + status (for "All Leads" queries)
CREATE INDEX IF NOT EXISTS idx_leads_agent_status ON leads(agent_id, status) 
  WHERE status IS NULL OR status = 'published';

-- Composite index for agent_id + created_at (for sorting by date)
CREATE INDEX IF NOT EXISTS idx_leads_agent_created ON leads(agent_id, created_at DESC);

-- Index for sub-agent tracking queries
CREATE INDEX IF NOT EXISTS idx_leads_agent_subagent ON leads(agent_id, created_by_sub_agent_id) 
  WHERE created_by_sub_agent_id IS NOT NULL;

-- Full-text search index for customer name, email, destination
CREATE INDEX IF NOT EXISTS idx_leads_search ON leads USING gin(
  to_tsvector('english', coalesce(customer_name, '') || ' ' || 
              coalesce(customer_email, '') || ' ' || 
              coalesce(destination, ''))
);

-- 9. Automatic updated_at Trigger (if not already exists)
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for leads table
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_updated_at();

-- 10. Data Validation Constraints
-- Email format validation (basic check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_email_format'
    ) THEN
        ALTER TABLE leads ADD CONSTRAINT check_email_format 
          CHECK (customer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
END $$;

-- Phone number validation (allows international format)
-- First, update any invalid phone numbers to NULL or fix them
-- Then add constraint only if all data is valid
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    -- Count invalid phone numbers (not matching pattern or empty strings)
    SELECT COUNT(*) INTO invalid_count
    FROM leads
    WHERE customer_phone IS NOT NULL 
      AND customer_phone != ''
      AND customer_phone !~ '^\+?[1-9]\d{1,14}$';
    
    -- If there are invalid phone numbers, set them to NULL
    IF invalid_count > 0 THEN
        UPDATE leads
        SET customer_phone = NULL
        WHERE customer_phone IS NOT NULL 
          AND customer_phone != ''
          AND customer_phone !~ '^\+?[1-9]\d{1,14}$';
        
        RAISE NOTICE 'Updated % invalid phone numbers to NULL', invalid_count;
    END IF;
    
    -- Now add the constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_phone_format'
    ) THEN
        ALTER TABLE leads ADD CONSTRAINT check_phone_format 
          CHECK (customer_phone IS NULL OR customer_phone = '' OR customer_phone ~ '^\+?[1-9]\d{1,14}$');
    END IF;
END $$;

-- Date validation (to_date >= from_date)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_travel_dates'
    ) THEN
        ALTER TABLE leads ADD CONSTRAINT check_travel_dates 
          CHECK (travel_date_end IS NULL OR travel_date_start IS NULL OR travel_date_end >= travel_date_start);
    END IF;
END $$;

-- Adults count validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_adults_count'
    ) THEN
        ALTER TABLE leads ADD CONSTRAINT check_adults_count 
          CHECK (travelers_count IS NULL OR travelers_count > 0);
    END IF;
END $$;

-- Comments for documentation
COMMENT ON COLUMN leads.status IS 'Lead status: draft (not visible in All Leads), published (visible), archived';
COMMENT ON COLUMN leads.source_custom IS 'Custom lead source (e.g., "Facebook Ads") when source enum is not sufficient';
COMMENT ON COLUMN leads.services IS 'Array of services requested: Full Package, Flight, Hotel, Transport, Activities, Visa';
COMMENT ON COLUMN leads.travel_month IS 'Preferred travel month';
COMMENT ON COLUMN leads.origin IS 'Origin city/country for the trip';
COMMENT ON COLUMN leads.created_by_sub_agent_id IS 'ID of sub-agent who created this lead (NULL if created by main agent)';

