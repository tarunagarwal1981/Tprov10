-- ============================================================================
-- Make Transfer Package Destination Fields Required
-- ============================================================================
-- This migration makes destination_city and destination_country mandatory
-- for transfer packages, as these fields are essential for identifying
-- where the transfer service operates.

-- Update existing records with placeholder values if they have NULL or empty destinations
-- (Run this first to avoid NOT NULL constraint violations)
UPDATE transfer_packages
SET 
  destination_city = CASE 
    WHEN destination_city IS NULL OR trim(destination_city) = '' 
    THEN COALESCE(NULLIF(trim(destination_name), ''), 'Not Specified')
    ELSE destination_city
  END,
  destination_country = CASE 
    WHEN destination_country IS NULL OR trim(destination_country) = '' 
    THEN 'Not Specified'
    ELSE destination_country
  END
WHERE destination_city IS NULL OR trim(destination_city) = '' 
   OR destination_country IS NULL OR trim(destination_country) = '';

-- Now make the columns NOT NULL
ALTER TABLE transfer_packages
  ALTER COLUMN destination_city SET NOT NULL,
  ALTER COLUMN destination_country SET NOT NULL;

-- Optional: Add check constraints for meaningful values
ALTER TABLE transfer_packages
  ADD CONSTRAINT check_destination_city_not_empty 
    CHECK (length(trim(destination_city)) > 0);

ALTER TABLE transfer_packages
  ADD CONSTRAINT check_destination_country_not_empty 
    CHECK (length(trim(destination_country)) > 0);

-- Add comment to document the requirement
COMMENT ON COLUMN transfer_packages.destination_city IS 
  'City where transfer service operates (REQUIRED) - e.g., Bali, Dubai, Bangkok';
  
COMMENT ON COLUMN transfer_packages.destination_country IS 
  'Country where transfer service operates (REQUIRED) - e.g., Indonesia, UAE, Thailand';

-- Verification query
-- Run this to check the updates
SELECT 
  id,
  title,
  destination_city,
  destination_country,
  status,
  created_at
FROM transfer_packages
ORDER BY created_at DESC
LIMIT 10;

