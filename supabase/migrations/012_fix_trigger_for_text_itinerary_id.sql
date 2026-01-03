-- Migration: Fix trigger function to handle TEXT itinerary_id correctly
-- The trigger was comparing itineraries.id (UUID) with NEW.itinerary_id (TEXT)
-- which caused "operator does not exist: uuid = text" errors

CREATE OR REPLACE FUNCTION recalculate_itinerary_total_price()
RETURNS TRIGGER AS $$
DECLARE
    new_total DECIMAL(10,2);
    itinerary_id_val TEXT;
BEGIN
    -- Get itinerary_id as TEXT (since itinerary_items.itinerary_id is TEXT)
    itinerary_id_val := COALESCE(NEW.itinerary_id::text, OLD.itinerary_id::text);
    
    -- Calculate total (itinerary_items.itinerary_id is TEXT, so compare as TEXT)
    SELECT COALESCE(SUM(total_price), 0) INTO new_total
    FROM itinerary_items
    WHERE itinerary_id = itinerary_id_val;
    
    -- Update itineraries (itineraries.id is UUID, so cast to TEXT for comparison)
    UPDATE itineraries
    SET total_price = new_total,
        updated_at = NOW()
    WHERE id::text = itinerary_id_val;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

