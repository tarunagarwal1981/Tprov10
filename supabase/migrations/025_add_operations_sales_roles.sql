-- ============================================================================
-- ADD OPERATIONS AND SALES ROLES
-- ============================================================================
-- This migration adds OPERATIONS and SALES roles to the user_role enum.
-- ============================================================================

-- Add OPERATIONS and SALES roles to user_role enum
DO $$ 
BEGIN
    -- Try to add OPERATIONS if it doesn't exist
    BEGIN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'OPERATIONS';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    -- Try to add SALES if it doesn't exist
    BEGIN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SALES';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

