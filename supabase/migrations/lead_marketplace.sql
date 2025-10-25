-- Lead Marketplace Schema
-- This migration creates tables for the lead marketplace functionality
-- where travel agents can purchase quality leads

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for lead marketplace
CREATE TYPE trip_type AS ENUM (
    'ADVENTURE',
    'CULTURAL',
    'BEACH',
    'WILDLIFE',
    'LUXURY',
    'BUDGET',
    'FAMILY',
    'HONEYMOON'
);

CREATE TYPE lead_status AS ENUM (
    'AVAILABLE',
    'PURCHASED',
    'EXPIRED'
);

-- ============================================================================
-- 1. LEAD MARKETPLACE TABLE
-- ============================================================================
-- Main table for storing leads available for purchase in the marketplace
CREATE TABLE lead_marketplace (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Lead Information
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    trip_type trip_type NOT NULL,
    
    -- Budget Information
    budget_min DECIMAL(10,2) NOT NULL,
    budget_max DECIMAL(10,2) NOT NULL,
    
    -- Trip Details
    duration_days INTEGER NOT NULL,
    travelers_count INTEGER NOT NULL DEFAULT 1,
    travel_date_start DATE,
    travel_date_end DATE,
    special_requirements TEXT,
    
    -- Lead Quality & Pricing
    lead_quality_score INTEGER NOT NULL DEFAULT 50,
    lead_price DECIMAL(10,2) NOT NULL,
    
    -- Status & Lifecycle
    status lead_status NOT NULL DEFAULT 'AVAILABLE',
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_budget CHECK (budget_min >= 0 AND budget_max >= budget_min),
    CONSTRAINT valid_duration CHECK (duration_days > 0),
    CONSTRAINT valid_travelers CHECK (travelers_count > 0),
    CONSTRAINT valid_quality_score CHECK (lead_quality_score >= 0 AND lead_quality_score <= 100),
    CONSTRAINT valid_lead_price CHECK (lead_price >= 0),
    CONSTRAINT valid_dates CHECK (travel_date_end IS NULL OR travel_date_end >= travel_date_start),
    CONSTRAINT valid_expiry CHECK (expires_at > posted_at)
);

-- ============================================================================
-- 2. LEAD PURCHASES TABLE
-- ============================================================================
-- Tracks which agents have purchased which leads
CREATE TABLE lead_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    lead_id UUID NOT NULL REFERENCES lead_marketplace(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Purchase Information
    purchase_price DECIMAL(10,2) NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_purchase_price CHECK (purchase_price >= 0),
    CONSTRAINT unique_agent_lead_purchase UNIQUE(lead_id, agent_id)
);

-- ============================================================================
-- 3. ALTER LEADS TABLE (if it exists)
-- ============================================================================
-- Add marketplace-related columns to the existing leads table
-- Note: If the leads table doesn't exist yet, you'll need to create it first
-- or add these columns when creating the leads table

-- Check if leads table exists before altering
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
        -- Add marketplace_lead_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM pg_attribute 
                      WHERE attrelid = 'public.leads'::regclass 
                      AND attname = 'marketplace_lead_id' 
                      AND NOT attisdropped) THEN
            ALTER TABLE leads ADD COLUMN marketplace_lead_id UUID REFERENCES lead_marketplace(id) ON DELETE SET NULL;
        END IF;
        
        -- Add is_purchased column if it doesn't exist
        IF NOT EXISTS (SELECT FROM pg_attribute 
                      WHERE attrelid = 'public.leads'::regclass 
                      AND attname = 'is_purchased' 
                      AND NOT attisdropped) THEN
            ALTER TABLE leads ADD COLUMN is_purchased BOOLEAN DEFAULT FALSE;
        END IF;
        
        -- Add purchased_from_marketplace column if it doesn't exist
        IF NOT EXISTS (SELECT FROM pg_attribute 
                      WHERE attrelid = 'public.leads'::regclass 
                      AND attname = 'purchased_from_marketplace' 
                      AND NOT attisdropped) THEN
            ALTER TABLE leads ADD COLUMN purchased_from_marketplace BOOLEAN DEFAULT FALSE;
        END IF;
    ELSE
        RAISE NOTICE 'Table "leads" does not exist. Skipping ALTER TABLE statements.';
    END IF;
END $$;

-- ============================================================================
-- 4. INDEXES
-- ============================================================================
-- Create indexes for better query performance

-- Lead Marketplace indexes
CREATE INDEX idx_lead_marketplace_status ON lead_marketplace(status);
CREATE INDEX idx_lead_marketplace_trip_type ON lead_marketplace(trip_type);
CREATE INDEX idx_lead_marketplace_destination ON lead_marketplace(destination);
CREATE INDEX idx_lead_marketplace_posted_at ON lead_marketplace(posted_at DESC);
CREATE INDEX idx_lead_marketplace_expires_at ON lead_marketplace(expires_at);
CREATE INDEX idx_lead_marketplace_quality_score ON lead_marketplace(lead_quality_score DESC);
CREATE INDEX idx_lead_marketplace_price ON lead_marketplace(lead_price);
CREATE INDEX idx_lead_marketplace_available ON lead_marketplace(status) WHERE status = 'AVAILABLE';

-- Lead Purchases indexes
CREATE INDEX idx_lead_purchases_lead_id ON lead_purchases(lead_id);
CREATE INDEX idx_lead_purchases_agent_id ON lead_purchases(agent_id);
CREATE INDEX idx_lead_purchases_purchased_at ON lead_purchases(purchased_at DESC);

-- Leads table indexes (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
        CREATE INDEX IF NOT EXISTS idx_leads_marketplace_lead_id ON leads(marketplace_lead_id);
        CREATE INDEX IF NOT EXISTS idx_leads_purchased_from_marketplace ON leads(purchased_from_marketplace) WHERE purchased_from_marketplace = TRUE;
    END IF;
END $$;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Create or replace updated_at trigger function (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for lead_marketplace updated_at
CREATE TRIGGER update_lead_marketplace_updated_at 
    BEFORE UPDATE ON lead_marketplace
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically mark lead as purchased
CREATE OR REPLACE FUNCTION mark_lead_as_purchased()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the lead status to PURCHASED
    UPDATE lead_marketplace 
    SET status = 'PURCHASED',
        updated_at = NOW()
    WHERE id = NEW.lead_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic lead status update on purchase
CREATE TRIGGER auto_mark_lead_purchased 
    AFTER INSERT ON lead_purchases
    FOR EACH ROW 
    EXECUTE FUNCTION mark_lead_as_purchased();

-- Create function to expire old leads
CREATE OR REPLACE FUNCTION expire_old_leads()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE lead_marketplace
    SET status = 'EXPIRED',
        updated_at = NOW()
    WHERE status = 'AVAILABLE'
        AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ language 'plpgsql';

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE lead_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_purchases ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR LEAD_MARKETPLACE
-- ============================================================================

-- Policy: Travel agents can view AVAILABLE leads in marketplace
CREATE POLICY "Travel agents can view available leads" 
    ON lead_marketplace
    FOR SELECT 
    USING (
        status = 'AVAILABLE' 
        AND expires_at > NOW()
    );

-- Policy: Agents who purchased a lead can view full details
CREATE POLICY "Purchasing agent can view purchased lead details" 
    ON lead_marketplace
    FOR SELECT 
    USING (
        status = 'PURCHASED' 
        AND EXISTS (
            SELECT 1 FROM lead_purchases 
            WHERE lead_purchases.lead_id = lead_marketplace.id 
            AND lead_purchases.agent_id = auth.uid()
        )
    );

-- Policy: Admins can see everything
-- Note: This assumes you have a function to check admin role
-- You may need to adjust this based on your user role implementation
CREATE POLICY "Admins can view all leads" 
    ON lead_marketplace
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy: System/Admin can insert leads into marketplace
CREATE POLICY "Admins can insert leads" 
    ON lead_marketplace
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy: System/Admin can update leads
CREATE POLICY "Admins can update leads" 
    ON lead_marketplace
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy: System/Admin can delete leads
CREATE POLICY "Admins can delete leads" 
    ON lead_marketplace
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- ============================================================================
-- RLS POLICIES FOR LEAD_PURCHASES
-- ============================================================================

-- Policy: Agents can view their own purchases
CREATE POLICY "Agents can view their own purchases" 
    ON lead_purchases
    FOR SELECT 
    USING (agent_id = auth.uid());

-- Policy: Agents can create their own purchases
CREATE POLICY "Agents can purchase leads" 
    ON lead_purchases
    FOR INSERT 
    WITH CHECK (
        agent_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM lead_marketplace 
            WHERE lead_marketplace.id = lead_id 
            AND lead_marketplace.status = 'AVAILABLE'
            AND lead_marketplace.expires_at > NOW()
        )
    );

-- Policy: Admins can view all purchases
CREATE POLICY "Admins can view all purchases" 
    ON lead_purchases
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy: Admins can delete purchases
CREATE POLICY "Admins can delete purchases" 
    ON lead_purchases
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to get available leads with filters
CREATE OR REPLACE FUNCTION get_available_leads(
    p_trip_type trip_type DEFAULT NULL,
    p_destination TEXT DEFAULT NULL,
    p_min_budget DECIMAL DEFAULT NULL,
    p_max_budget DECIMAL DEFAULT NULL,
    p_min_quality_score INTEGER DEFAULT 0
)
RETURNS SETOF lead_marketplace AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM lead_marketplace
    WHERE status = 'AVAILABLE'
        AND expires_at > NOW()
        AND (p_trip_type IS NULL OR trip_type = p_trip_type)
        AND (p_destination IS NULL OR destination ILIKE '%' || p_destination || '%')
        AND (p_min_budget IS NULL OR budget_max >= p_min_budget)
        AND (p_max_budget IS NULL OR budget_min <= p_max_budget)
        AND lead_quality_score >= p_min_quality_score
    ORDER BY lead_quality_score DESC, posted_at DESC;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to get agent's purchased leads
CREATE OR REPLACE FUNCTION get_agent_purchased_leads(p_agent_id UUID)
RETURNS TABLE (
    lead_id UUID,
    title TEXT,
    destination TEXT,
    trip_type trip_type,
    purchase_price DECIMAL,
    purchased_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lm.id,
        lm.title,
        lm.destination,
        lm.trip_type,
        lp.purchase_price,
        lp.purchased_at
    FROM lead_marketplace lm
    INNER JOIN lead_purchases lp ON lm.id = lp.lead_id
    WHERE lp.agent_id = p_agent_id
    ORDER BY lp.purchased_at DESC;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to calculate marketplace statistics
CREATE OR REPLACE FUNCTION get_marketplace_stats()
RETURNS TABLE (
    total_available INTEGER,
    total_purchased INTEGER,
    total_expired INTEGER,
    avg_lead_price DECIMAL,
    avg_quality_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE status = 'AVAILABLE' AND expires_at > NOW())::INTEGER,
        COUNT(*) FILTER (WHERE status = 'PURCHASED')::INTEGER,
        COUNT(*) FILTER (WHERE status = 'EXPIRED')::INTEGER,
        ROUND(AVG(lead_price) FILTER (WHERE status = 'AVAILABLE'), 2),
        ROUND(AVG(lead_quality_score) FILTER (WHERE status = 'AVAILABLE'), 2)
    FROM lead_marketplace;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE lead_marketplace IS 'Stores travel leads available for purchase by travel agents';
COMMENT ON TABLE lead_purchases IS 'Tracks which agents have purchased which leads';

COMMENT ON COLUMN lead_marketplace.lead_quality_score IS 'Quality score from 0-100 based on lead completeness and engagement';
COMMENT ON COLUMN lead_marketplace.lead_price IS 'Price in USD for purchasing this lead';
COMMENT ON COLUMN lead_marketplace.status IS 'Current status: AVAILABLE, PURCHASED, or EXPIRED';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

