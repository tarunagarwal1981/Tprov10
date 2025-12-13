-- ============================================================================
-- UPDATE ITINERARY QUERIES FOR MULTIPLE ITINERARIES PER LEAD
-- ============================================================================
-- This migration allows multiple queries per lead (one per itinerary)
-- and adds query_id to itineraries table to link each itinerary to its query
-- ============================================================================

-- Step 1: Remove the unique constraint that prevents multiple queries per lead
ALTER TABLE itinerary_queries DROP CONSTRAINT IF EXISTS unique_lead_query;

-- Step 2: Add query_id column to itineraries table
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS query_id UUID REFERENCES itinerary_queries(id) ON DELETE SET NULL;

-- Step 3: Create index for query_id
CREATE INDEX IF NOT EXISTS idx_itineraries_query_id ON itineraries(query_id);

-- Step 4: Add index for itinerary_id in queries (reverse lookup)
-- We'll add a column to track which itinerary a query belongs to
ALTER TABLE itinerary_queries ADD COLUMN IF NOT EXISTS itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE;

-- Step 5: Create index for itinerary_id in queries
CREATE INDEX IF NOT EXISTS idx_itinerary_queries_itinerary_id ON itinerary_queries(itinerary_id);

-- Step 6: Add index for (lead_id, agent_id) combination for faster lookups
CREATE INDEX IF NOT EXISTS idx_itinerary_queries_lead_agent ON itinerary_queries(lead_id, agent_id);

-- Comments
COMMENT ON COLUMN itineraries.query_id IS 'Links itinerary to its query form data';
COMMENT ON COLUMN itinerary_queries.itinerary_id IS 'Links query to its itinerary (optional, for reverse lookup)';
