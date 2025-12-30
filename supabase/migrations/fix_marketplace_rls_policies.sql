-- Fix Marketplace RLS Policies
-- This migration fixes RLS policies for lead_marketplace and lead_purchases tables
-- to allow travel agents to access marketplace data

-- ============================================================================
-- 1. DROP EXISTING POLICIES
-- ============================================================================

-- Drop existing lead_marketplace policies
-- DROP POLICY removed (RLS not used)
-- DROP POLICY removed (RLS not used)
-- DROP POLICY removed (RLS not used)
-- DROP POLICY removed (RLS not used)
-- DROP POLICY removed (RLS not used)
-- DROP POLICY removed (RLS not used)

-- Drop existing lead_purchases policies
-- DROP POLICY removed (RLS not used)
-- DROP POLICY removed (RLS not used)
-- DROP POLICY removed (RLS not used)
-- DROP POLICY removed (RLS not used)

-- ============================================================================
-- 2. CREATE HELPER FUNCTION TO CHECK USER ROLE
-- ============================================================================

-- Function to check if user is a travel agent or admin
CREATE OR REPLACE FUNCTION is_travel_agent_or_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND role IN ('TRAVEL_AGENT', 'ADMIN', 'SUPER_ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND role IN ('ADMIN', 'SUPER_ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 3. RLS POLICIES FOR LEAD_MARKETPLACE
-- ============================================================================

-- Policy: Travel agents can view AVAILABLE leads in marketplace
-- RLS Policy removed (not used in AWS RDS)

-- Policy: Agents who purchased a lead can view full details
-- RLS Policy removed (not used in AWS RDS)

-- Policy: Admins can see everything
-- RLS Policy removed (not used in AWS RDS)

-- Policy: System/Admin can insert leads into marketplace
-- RLS Policy removed (not used in AWS RDS)

-- Policy: System/Admin can update leads
-- RLS Policy removed (not used in AWS RDS)

-- Policy: System/Admin can delete leads
-- RLS Policy removed (not used in AWS RDS)

-- ============================================================================
-- 4. RLS POLICIES FOR LEAD_PURCHASES
-- ============================================================================

-- Policy: Agents can view their own purchases
-- RLS Policy removed (not used in AWS RDS)

-- Policy: Agents can create their own purchases
-- RLS Policy removed (not used in AWS RDS)

-- Policy: Admins can view all purchases
-- RLS Policy removed (not used in AWS RDS)

-- Policy: Admins can delete purchases
-- RLS Policy removed (not used in AWS RDS)

-- ============================================================================
-- 5. UPDATE USERS TABLE POLICY TO ALLOW ROLE CHECKS
-- ============================================================================

-- Allow authenticated users to read role information for policy evaluation
-- This is safe because role information is not sensitive and is needed for RLS checks
-- We'll create a separate policy that allows reading id and role columns only
-- DROP POLICY removed (RLS not used)

-- Note: This policy works alongside the existing "Users can view own profile" policy
-- The existing policy still applies for full profile access, but this allows
-- reading role information for any authenticated user (needed for RLS evaluation)

-- Actually, since we're using SECURITY DEFINER functions, we don't need this policy
-- The functions will bypass RLS. But we'll keep it commented for reference:
-- -- RLS Policy removed (not used in AWS RDS)

-- ============================================================================
-- 6. GRANT PERMISSIONS FOR FUNCTION EXECUTION
-- ============================================================================

-- Grant execute permission on helper functions to authenticated role
GRANT EXECUTE ON FUNCTION is_travel_agent_or_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;

-- ============================================================================
-- 7. VERIFY POLICIES
-- ============================================================================

-- Check lead_marketplace policies
SELECT 
    'lead_marketplace policies' as table_name,
    policyname,
    cmd as command,
    roles
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'lead_marketplace'
ORDER BY policyname;

-- Check lead_purchases policies
SELECT 
    'lead_purchases policies' as table_name,
    policyname,
    cmd as command,
    roles
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'lead_purchases'
ORDER BY policyname;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This migration fixes RLS policies to:
-- 1. Require authentication (NULL -- auth.uid() removed (RLS not used) IS NOT NULL)
-- 2. Check user roles from public.users table instead of auth.users metadata
-- 3. Allow travel agents to view available leads and their own purchases
-- 4. Allow role information to be read for RLS policy evaluation
