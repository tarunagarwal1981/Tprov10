-- ============================================================================
-- ITINERARIES SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- This migration creates the tables for managing itineraries created by agents
-- for their leads. Each itinerary can contain multiple packages from different
-- operators organized by day.
-- ============================================================================

-- Itineraries Table
CREATE TABLE IF NOT EXISTS itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Itinerary Details
    name TEXT NOT NULL DEFAULT 'Itinerary #1',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'sent', 'approved', 'rejected')),
    
    -- Traveler Information
    adults_count INTEGER NOT NULL DEFAULT 1 CHECK (adults_count > 0),
    children_count INTEGER NOT NULL DEFAULT 0 CHECK (children_count >= 0),
    infants_count INTEGER NOT NULL DEFAULT 0 CHECK (infants_count >= 0),
    
    -- Travel Dates
    start_date DATE,
    end_date DATE,
    
    -- Pricing Information
    total_price DECIMAL(10,2) DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'USD',
    
    -- Budget Comparison
    lead_budget_min DECIMAL(10,2),
    lead_budget_max DECIMAL(10,2),
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CONSTRAINT valid_budget CHECK (lead_budget_min IS NULL OR lead_budget_max IS NULL OR lead_budget_max >= lead_budget_min)
);

-- Itinerary Days Table
CREATE TABLE IF NOT EXISTS itinerary_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    
    -- Day Information
    day_number INTEGER NOT NULL CHECK (day_number > 0),
    date DATE,
    city_name TEXT,
    notes TEXT,
    
    -- Ordering
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(itinerary_id, day_number)
);

-- Itinerary Items Table (Packages added to itinerary)
CREATE TABLE IF NOT EXISTS itinerary_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    day_id UUID REFERENCES itinerary_days(id) ON DELETE CASCADE,
    
    -- Package Information
    package_type TEXT NOT NULL CHECK (package_type IN ('activity', 'transfer', 'multi_city', 'multi_city_hotel', 'fixed_departure')),
    package_id UUID NOT NULL,
    operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Package Details (denormalized for quick access)
    package_title TEXT NOT NULL,
    package_image_url TEXT,
    
    -- Configuration (JSONB for flexibility)
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Examples:
    -- Activity: {"optionId": "...", "packageType": "TICKET_ONLY", "selectedVehicle": {...}}
    -- Transfer: {"pricingOptionId": "...", "hours": 4, "route": "hourly"}
    -- Multi-City: {"pricingType": "STANDARD", "selectedVehicle": {...}, "selectedHotels": [{"city": "...", "hotelId": "...", "nights": 3}]}
    
    -- Pricing
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Display
    display_order INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_itineraries_lead_id ON itineraries(lead_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_agent_id ON itineraries(agent_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_status ON itineraries(status);
CREATE INDEX IF NOT EXISTS idx_itinerary_days_itinerary_id ON itinerary_days(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_itinerary_id ON itinerary_items(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_day_id ON itinerary_items(day_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_package_type ON itinerary_items(package_type);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_operator_id ON itinerary_items(operator_id);

-- Row Level Security (RLS)
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for itineraries
CREATE POLICY "Agents can view their own itineraries"
    ON itineraries FOR SELECT
    USING (auth.uid() = agent_id);

CREATE POLICY "Agents can create their own itineraries"
    ON itineraries FOR INSERT
    WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update their own itineraries"
    ON itineraries FOR UPDATE
    USING (auth.uid() = agent_id);

CREATE POLICY "Agents can delete their own itineraries"
    ON itineraries FOR DELETE
    USING (auth.uid() = agent_id);

-- RLS Policies for itinerary_days
CREATE POLICY "Agents can view days of their own itineraries"
    ON itinerary_days FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM itineraries 
            WHERE itineraries.id = itinerary_days.itinerary_id 
            AND itineraries.agent_id = auth.uid()
        )
    );

CREATE POLICY "Agents can create days for their own itineraries"
    ON itinerary_days FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM itineraries 
            WHERE itineraries.id = itinerary_days.itinerary_id 
            AND itineraries.agent_id = auth.uid()
        )
    );

CREATE POLICY "Agents can update days of their own itineraries"
    ON itinerary_days FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM itineraries 
            WHERE itineraries.id = itinerary_days.itinerary_id 
            AND itineraries.agent_id = auth.uid()
        )
    );

CREATE POLICY "Agents can delete days of their own itineraries"
    ON itinerary_days FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM itineraries 
            WHERE itineraries.id = itinerary_days.itinerary_id 
            AND itineraries.agent_id = auth.uid()
        )
    );

-- RLS Policies for itinerary_items
CREATE POLICY "Agents can view items of their own itineraries"
    ON itinerary_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM itineraries 
            WHERE itineraries.id = itinerary_items.itinerary_id 
            AND itineraries.agent_id = auth.uid()
        )
    );

CREATE POLICY "Agents can create items for their own itineraries"
    ON itinerary_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM itineraries 
            WHERE itineraries.id = itinerary_items.itinerary_id 
            AND itineraries.agent_id = auth.uid()
        )
    );

CREATE POLICY "Agents can update items of their own itineraries"
    ON itinerary_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM itineraries 
            WHERE itineraries.id = itinerary_items.itinerary_id 
            AND itineraries.agent_id = auth.uid()
        )
    );

CREATE POLICY "Agents can delete items of their own itineraries"
    ON itinerary_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM itineraries 
            WHERE itineraries.id = itinerary_items.itinerary_id 
            AND itineraries.agent_id = auth.uid()
        )
    );

-- Function to update itinerary updated_at timestamp
CREATE OR REPLACE FUNCTION update_itinerary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE itineraries
    SET updated_at = NOW()
    WHERE id = NEW.itinerary_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update itinerary updated_at
CREATE TRIGGER update_itinerary_on_day_change
    AFTER INSERT OR UPDATE OR DELETE ON itinerary_days
    FOR EACH ROW
    EXECUTE FUNCTION update_itinerary_updated_at();

CREATE TRIGGER update_itinerary_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON itinerary_items
    FOR EACH ROW
    EXECUTE FUNCTION update_itinerary_updated_at();

-- Function to recalculate itinerary total price
CREATE OR REPLACE FUNCTION recalculate_itinerary_total_price()
RETURNS TRIGGER AS $$
DECLARE
    new_total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0) INTO new_total
    FROM itinerary_items
    WHERE itinerary_id = COALESCE(NEW.itinerary_id, OLD.itinerary_id);
    
    UPDATE itineraries
    SET total_price = new_total,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.itinerary_id, OLD.itinerary_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate total price when items change
CREATE TRIGGER recalculate_itinerary_price_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON itinerary_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_itinerary_total_price();

