-- Fix Marketplace RLS Policies
-- This migration fixes RLS policies for lead_marketplace and lead_purchases tables
-- to allow travel agents to access marketplace data

-- ============================================================================
-- 1. DROP EXISTING POLICIES
-- ============================================================================

-- Drop existing lead_marketplace policies
DROP POLICY IF EXISTS "Travel agents can view available leads" ON lead_marketplace;
DROP POLICY IF EXISTS "Purchasing agent can view purchased lead details" ON lead_marketplace;
DROP POLICY IF EXISTS "Admins can view all leads" ON lead_marketplace;
DROP POLICY IF EXISTS "Admins can insert leads" ON lead_marketplace;
DROP POLICY IF EXISTS "Admins can update leads" ON lead_marketplace;
DROP POLICY IF EXISTS "Admins can delete leads" ON lead_marketplace;

-- Drop existing lead_purchases policies
DROP POLICY IF EXISTS "Agents can view their own purchases" ON lead_purchases;
DROP POLICY IF EXISTS "Agents can purchase leads" ON lead_purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON lead_purchases;
DROP POLICY IF EXISTS "Admins can delete purchases" ON lead_purchases;

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
CREATE POLICY "Travel agents can view available leads" 
    ON lead_marketplace
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() IS NOT NULL
        AND status = 'AVAILABLE' 
        AND expires_at > NOW()
        AND is_travel_agent_or_admin(auth.uid())
    );

-- Policy: Agents who purchased a lead can view full details
CREATE POLICY "Purchasing agent can view purchased lead details" 
    ON lead_marketplace
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() IS NOT NULL
        AND status = 'PURCHASED' 
        AND EXISTS (
            SELECT 1 FROM lead_purchases 
            WHERE lead_purchases.lead_id = lead_marketplace.id 
            AND lead_purchases.agent_id = auth.uid()
        )
    );

-- Policy: Admins can see everything
CREATE POLICY "Admins can view all leads" 
    ON lead_marketplace
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() IS NOT NULL
        AND is_admin(auth.uid())
    );

-- Policy: System/Admin can insert leads into marketplace
CREATE POLICY "Admins can insert leads" 
    ON lead_marketplace
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND is_admin(auth.uid())
    );

-- Policy: System/Admin can update leads
CREATE POLICY "Admins can update leads" 
    ON lead_marketplace
    FOR UPDATE 
    TO authenticated
    USING (
        auth.uid() IS NOT NULL
        AND is_admin(auth.uid())
    )
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND is_admin(auth.uid())
    );

-- Policy: System/Admin can delete leads
CREATE POLICY "Admins can delete leads" 
    ON lead_marketplace
    FOR DELETE 
    TO authenticated
    USING (
        auth.uid() IS NOT NULL
        AND is_admin(auth.uid())
    );

-- ============================================================================
-- 4. RLS POLICIES FOR LEAD_PURCHASES
-- ============================================================================

-- Policy: Agents can view their own purchases
CREATE POLICY "Agents can view their own purchases" 
    ON lead_purchases
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() IS NOT NULL
        AND agent_id = auth.uid()
    );

-- Policy: Agents can create their own purchases
CREATE POLICY "Agents can purchase leads" 
    ON lead_purchases
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND agent_id = auth.uid()
        AND is_travel_agent_or_admin(auth.uid())
        AND EXISTS (
            SELECT 1 FROM lead_marketplace 
            WHERE lead_marketplace.id = lead_id 
            AND lead_marketplace.status = 'AVAILABLE'
            AND lead_marketplace.expires_at > NOW()
        )
    );

-- Policy: Admins can view all purchases
CREATE POLICY "Admins can view all purchases" 
    ON lead_purchases
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() IS NOT NULL
        AND is_admin(auth.uid())
    );

-- Policy: Admins can delete purchases
CREATE POLICY "Admins can delete purchases" 
    ON lead_purchases
    FOR DELETE 
    TO authenticated
    USING (
        auth.uid() IS NOT NULL
        AND is_admin(auth.uid())
    );

-- ============================================================================
-- 5. UPDATE USERS TABLE POLICY TO ALLOW ROLE CHECKS
-- ============================================================================

-- Allow authenticated users to read role information for policy evaluation
-- This is safe because role information is not sensitive and is needed for RLS checks
-- We'll create a separate policy that allows reading id and role columns only
DROP POLICY IF EXISTS "Authenticated users can read roles for RLS" ON public.users;

-- Note: This policy works alongside the existing "Users can view own profile" policy
-- The existing policy still applies for full profile access, but this allows
-- reading role information for any authenticated user (needed for RLS evaluation)

-- Actually, since we're using SECURITY DEFINER functions, we don't need this policy
-- The functions will bypass RLS. But we'll keep it commented for reference:
-- CREATE POLICY "Authenticated users can read roles for RLS" 
--     ON public.users
--     FOR SELECT 
--     TO authenticated
--     USING (auth.uid() IS NOT NULL);

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
-- 1. Require authentication (auth.uid() IS NOT NULL)
-- 2. Check user roles from public.users table instead of auth.users metadata
-- 3. Allow travel agents to view available leads and their own purchases
-- 4. Allow role information to be read for RLS policy evaluation
