-- ============================================================================
-- REMOVE PHONE NUMBER VALIDATION CONSTRAINT
-- ============================================================================
-- This migration removes the phone number format validation constraint
-- to allow any phone number format for international compatibility.
-- ============================================================================

-- Drop the phone format constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_phone_format'
    ) THEN
        ALTER TABLE leads DROP CONSTRAINT check_phone_format;
        RAISE NOTICE 'Dropped check_phone_format constraint';
    ELSE
        RAISE NOTICE 'check_phone_format constraint does not exist, skipping';
    END IF;
END $$;

