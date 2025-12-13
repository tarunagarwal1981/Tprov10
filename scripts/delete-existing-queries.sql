-- Delete all existing queries from itinerary_queries table
-- This prevents conflicts with the new flow where query form appears after card clicks

DELETE FROM itinerary_queries;

-- Verify deletion
SELECT COUNT(*) as remaining_queries FROM itinerary_queries;
