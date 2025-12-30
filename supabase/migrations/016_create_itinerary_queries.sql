-- ============================================================================
-- ITINERARY QUERIES TABLE
-- This migration creates the table for storing query form data before creating
-- actual itineraries. This allows agents to save query details and edit them
-- before creating proposals.
-- ============================================================================

-- Create itinerary_queries table
CREATE TABLE IF NOT EXISTS itinerary_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL,
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Destinations (JSON array: [{"city": "Bali", "nights": 2}, ...])
    destinations JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Trip Details
    leaving_from TEXT,
    nationality TEXT,
    leaving_on DATE,
    travelers JSONB, -- {"rooms": 1, "adults": 2, "children": 0, "infants": 0}
    star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
    add_transfers BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_lead_query UNIQUE (lead_id, agent_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_itinerary_queries_lead_id ON itinerary_queries(lead_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_queries_agent_id ON itinerary_queries(agent_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_queries_created_at ON itinerary_queries(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE itinerary_queries IS 'Stores query form data for leads before creating actual itineraries';
COMMENT ON COLUMN itinerary_queries.destinations IS 'JSON array of destinations with city name and nights: [{"city": "Bali", "nights": 2}, ...]';
COMMENT ON COLUMN itinerary_queries.travelers IS 'JSON object with room and traveler counts: {"rooms": 1, "adults": 2, "children": 0, "infants": 0}';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_itinerary_queries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_itinerary_queries_updated_at
    BEFORE UPDATE ON itinerary_queries
    FOR EACH ROW
    EXECUTE FUNCTION update_itinerary_queries_updated_at();

-- Enable RLS (Row Level Security)
-- RLS disabled (not used in AWS RDS)

-- RLS Policies
-- Agents can only see their own queries
-- RLS Policy removed (not used in AWS RDS)

-- Agents can insert their own queries
-- RLS Policy removed (not used in AWS RDS)

-- Agents can update their own queries
-- RLS Policy removed (not used in AWS RDS)

-- Agents can delete their own queries
-- RLS Policy removed (not used in AWS RDS)

