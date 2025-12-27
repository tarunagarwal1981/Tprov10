-- Fix total_price trigger and function
-- This script creates the missing trigger and function to automatically update itinerary total_price

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
DROP TRIGGER IF EXISTS recalculate_itinerary_price_on_item_change ON itinerary_items;
CREATE TRIGGER recalculate_itinerary_price_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON itinerary_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_itinerary_total_price();

-- Manually update all existing itineraries with correct total_price
UPDATE itineraries i
SET total_price = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM itinerary_items ii
    WHERE ii.itinerary_id::text = i.id::text
),
updated_at = NOW()
WHERE EXISTS (
    SELECT 1 FROM itinerary_items ii WHERE ii.itinerary_id::text = i.id::text
);

-- Verify the fix
SELECT 
    i.id,
    i.name,
    i.total_price as current_price,
    COALESCE(SUM(ii.total_price), 0) as calculated_price,
    CASE 
        WHEN i.total_price = COALESCE(SUM(ii.total_price), 0) THEN '✅ Match'
        ELSE '❌ Mismatch'
    END as status
FROM itineraries i
LEFT JOIN itinerary_items ii ON i.id::text = ii.itinerary_id::text
WHERE i.lead_id::text = '2b838a35-90ac-49fc-83cb-b3234b941501'
GROUP BY i.id, i.name, i.total_price
ORDER BY i.created_at DESC;

