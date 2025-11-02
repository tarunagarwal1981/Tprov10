-- ============================================================================
-- SIMULATION DEMO SETUP - Complete Indonesia Itinerary Workflow
-- ============================================================================
-- This migration creates:
-- 1. Leads table (if not exists)
-- 2. 5 Tour Operators (users table entries - auth.users must be created separately)
-- 3. ~25 Packages for Indonesia (distributed across operators)
-- 4. 2-3 Marketplace Leads with customer details
--
-- Note: Operators must be created in auth.users via Supabase Dashboard
-- See: OPERATOR_SETUP_INSTRUCTIONS.md
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- PART 1: CREATE LEADS TABLE (if not exists)
-- ============================================================================

-- Create enums if not exist
DO $$ BEGIN
    CREATE TYPE lead_source AS ENUM ('MARKETPLACE', 'MANUAL', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'EMAIL_CAMPAIGN', 'PHONE_INQUIRY', 'WALK_IN', 'PARTNER', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_stage AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create leads table if not exists
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Customer Information (revealed after purchase)
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    
    -- Trip Details (from marketplace or manually entered)
    destination TEXT NOT NULL,
    trip_type trip_type, -- References marketplace trip_type enum
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    duration_days INTEGER,
    travelers_count INTEGER DEFAULT 1,
    travel_date_start DATE,
    travel_date_end DATE,
    
    -- Lead Management
    source lead_source DEFAULT 'MARKETPLACE',
    priority lead_priority DEFAULT 'MEDIUM',
    stage lead_stage DEFAULT 'NEW',
    assigned_to UUID REFERENCES auth.users(id),
    
    -- Additional Information
    requirements TEXT,
    notes TEXT,
    tags TEXT[],
    
    -- Marketplace Integration
    marketplace_lead_id UUID REFERENCES lead_marketplace(id) ON DELETE SET NULL,
    is_purchased BOOLEAN DEFAULT TRUE,
    purchased_from_marketplace BOOLEAN DEFAULT TRUE,
    purchase_id UUID REFERENCES lead_purchases(id) ON DELETE SET NULL,
    
    -- Follow-up Management
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    
    -- Conversion Tracking
    converted_to_booking BOOLEAN DEFAULT FALSE,
    booking_id UUID,
    estimated_value DECIMAL(10,2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_budget CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_max >= budget_min),
    CONSTRAINT valid_duration CHECK (duration_days IS NULL OR duration_days > 0),
    CONSTRAINT valid_travelers CHECK (travelers_count > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_destination ON leads(destination);
CREATE INDEX IF NOT EXISTS idx_leads_marketplace_id ON leads(marketplace_lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_purchased ON leads(purchased_from_marketplace) WHERE purchased_from_marketplace = TRUE;

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Agents can view own leads" ON leads;
CREATE POLICY "Agents can view own leads"
    ON leads FOR SELECT
    USING (agent_id = auth.uid());

DROP POLICY IF EXISTS "Agents can create leads" ON leads;
CREATE POLICY "Agents can create leads"
    ON leads FOR INSERT
    WITH CHECK (agent_id = auth.uid());

DROP POLICY IF EXISTS "Agents can update own leads" ON leads;
CREATE POLICY "Agents can update own leads"
    ON leads FOR UPDATE
    USING (agent_id = auth.uid());

-- ============================================================================
-- PART 2: CREATE TOUR OPERATORS IN USERS TABLE
-- ============================================================================
-- Note: These operators must FIRST be created in auth.users via Supabase Dashboard
-- After creating in auth.users, their UUIDs will be inserted here
-- See OPERATOR_SETUP_INSTRUCTIONS.md for detailed steps
-- ============================================================================

-- We'll create placeholder UUIDs that will be replaced after operators are created in auth.users
-- The INSERT statements below will need to be updated with actual UUIDs

-- Operator 1: Bali Adventure Tours
-- Email: bali.adventure@touroperator.com
-- Insert this after creating in auth.users (replace {UUID_OP1} with actual UUID)

-- Operator 2: Java Cultural Experiences  
-- Email: java.cultural@touroperator.com
-- Insert this after creating in auth.users (replace {UUID_OP2} with actual UUID)

-- Operator 3: Island Paradise Transfers
-- Email: island.transfers@touroperator.com
-- Insert this after creating in auth.users (replace {UUID_OP3} with actual UUID)

-- Operator 4: Bali Beach Activities
-- Email: bali.beach@touroperator.com
-- Insert this after creating in auth.users (replace {UUID_OP4} with actual UUID)

-- Operator 5: Premium Indonesia Tours
-- Email: premium.indonesia@touroperator.com
-- Insert this after creating in auth.users (replace {UUID_OP5} with actual UUID)

-- Function to insert/update operator in users table
-- This will be called after operators are created in auth.users
-- We'll use a separate script that takes UUIDs as parameters

-- For now, we'll create a helper script that you run after creating operators in auth.users
-- See: create_operators_users.sql (will be created separately)

-- ============================================================================
-- PART 3: CREATE PACKAGES FOR OPERATOR 1 - BALI ADVENTURE TOURS
-- ============================================================================
-- Note: Replace {OPERATOR_1_UUID} with actual operator UUID after creating in auth.users
-- ============================================================================

-- Helper function to get operator UUID by email
-- This allows us to reference operators by email instead of hardcoding UUIDs
CREATE OR REPLACE FUNCTION get_operator_id_by_email(operator_email TEXT)
RETURNS UUID AS $$
DECLARE
    operator_uuid UUID;
BEGIN
    SELECT id INTO operator_uuid
    FROM auth.users
    WHERE email = operator_email
    LIMIT 1;
    
    IF operator_uuid IS NULL THEN
        RAISE EXCEPTION 'Operator with email % not found. Please create in auth.users first.', operator_email;
    END IF;
    
    RETURN operator_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 3: CREATE PACKAGES FOR ALL OPERATORS
-- ============================================================================
-- Packages will be inserted using the get_operator_id_by_email() function
-- This allows flexible setup - operators just need to exist in auth.users
-- ============================================================================

-- NOTE: Before running package inserts, ensure all 5 operators are created in auth.users
-- Run the package inserts section only after operators exist

-- ============================================================================
-- OPERATOR 1 PACKAGES: Bali Adventure Tours (bali.adventure@touroperator.com)
-- ============================================================================

-- Package 1: Mount Batur Sunrise Trekking (Activity)
INSERT INTO activity_packages (
    operator_id,
    title,
    short_description,
    full_description,
    status,
    destination_name,
    destination_address,
    destination_city,
    destination_country,
    destination_postal_code,
    destination_coordinates,
    duration_hours,
    duration_minutes,
    difficulty_level,
    languages_supported,
    tags,
    meeting_point_name,
    meeting_point_address,
    meeting_point_coordinates,
    meeting_point_instructions,
    operating_days,
    whats_included,
    whats_not_included,
    what_to_bring,
    important_information,
    minimum_age,
    maximum_age,
    wheelchair_accessible,
    cancellation_policy_type,
    cancellation_refund_percentage,
    cancellation_deadline_hours,
    base_price,
    currency,
    price_type,
    published_at
) VALUES (
    get_operator_id_by_email('bali.adventure@touroperator.com'),
    'Mount Batur Sunrise Trekking Experience',
    'Witness breathtaking sunrise from Mount Batur summit with guided trekking tour',
    'Start your day early with a pick-up from your hotel and journey to Mount Batur base camp. Begin your trek in the darkness of early morning with an experienced local guide. The moderate difficulty trek takes approximately 2 hours to reach the summit at 1,717 meters. Arrive just before sunrise to witness one of the most spectacular views in Bali. Enjoy breakfast at the summit while watching the sun rise over the caldera lake and surrounding mountains. Learn about the active volcano''s history and geology from your guide. After sunrise, begin your descent back to base camp.',
    'published',
    'Mount Batur',
    'Mount Batur Base Camp, Kintamani',
    'Kintamani',
    'Indonesia',
    NULL,
    POINT(115.3777, -8.2415), -- Approximate coordinates
    6,
    0,
    'CHALLENGING',
    ARRAY['EN']::language_code[],
    ARRAY['ADVENTURE', 'NATURE']::activity_tag[],
    'Hotel Pickup',
    'Your Hotel Lobby',
    POINT(115.2000, -8.5000), -- Approximate pickup point
    'Pickup time varies by hotel location. Guide will contact you the evening before.',
    ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']::day_of_week[],
    ARRAY['Professional local guide', 'Hotel pickup and drop-off', 'Breakfast at summit', 'Flashlight/headlamp', 'Trekking poles', 'Bottled water'],
    ARRAY['Personal expenses', 'Gratuities', 'Travel insurance'],
    ARRAY['Comfortable hiking shoes', 'Warm clothing (temperatures at summit: 10-15°C)', 'Camera', 'Extra water'],
    'Physical fitness required. Not suitable for children under 10 or travelers with heart problems. Weather dependent - may be cancelled due to poor conditions.',
    10,
    NULL,
    FALSE,
    'MODERATE',
    70,
    48,
    75.00,
    'USD',
    'PERSON',
    NOW()
) ON CONFLICT DO NOTHING;

-- Package 2: White Water Rafting in Ayung River (Activity)
INSERT INTO activity_packages (
    operator_id,
    title,
    short_description,
    full_description,
    status,
    destination_name,
    destination_address,
    destination_city,
    destination_country,
    destination_postal_code,
    destination_coordinates,
    duration_hours,
    duration_minutes,
    difficulty_level,
    languages_supported,
    tags,
    meeting_point_name,
    meeting_point_address,
    meeting_point_coordinates,
    meeting_point_instructions,
    operating_days,
    whats_included,
    whats_not_included,
    what_to_bring,
    important_information,
    minimum_age,
    maximum_age,
    wheelchair_accessible,
    cancellation_policy_type,
    cancellation_refund_percentage,
    cancellation_deadline_hours,
    base_price,
    currency,
    price_type,
    published_at
) VALUES (
    get_operator_id_by_email('bali.adventure@touroperator.com'),
    'White Water Rafting on Ayung River',
    'Thrilling 2-hour rafting adventure through Bali''s scenic Ayung River',
    'Experience the thrill of white water rafting on Bali''s most famous river. The Ayung River offers Class II and III rapids perfect for beginners and intermediate rafters. Navigate through lush rainforest canyons, past cascading waterfalls and traditional Balinese villages. Your professional guide will ensure your safety while sharing local stories and pointing out wildlife. The adventure includes safety equipment, professional guide, and refreshments. Perfect for families and groups seeking an adrenaline-filled day.',
    'published',
    'Ayung River',
    'Ayung River Rafting Base, Ubud',
    'Ubud',
    'Indonesia',
    NULL,
    POINT(115.3138, -8.5069),
    2,
    0,
    'MODERATE',
    ARRAY['EN']::language_code[],
    ARRAY['ADVENTURE', 'FAMILY_FRIENDLY', 'NATURE']::activity_tag[],
    'Rafting Base Camp',
    'Ayung River Rafting Base, Ubud',
    POINT(115.3138, -8.5069),
    'Arrive 30 minutes before scheduled time for safety briefing and equipment fitting.',
    ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']::day_of_week[],
    ARRAY['Professional rafting guide', 'All safety equipment (life jacket, helmet, paddle)', 'Safety kayak escort', 'Locker for personal belongings', 'Shower facilities', 'Buffet lunch', 'Insurance coverage'],
    ARRAY['Hotel transfers (available for extra charge)', 'Personal expenses', 'Gratuities'],
    ARRAY['Swimwear', 'Change of clothes', 'Waterproof camera', 'Sunscreen', 'Towel'],
    'Swimming skills required. Minimum age 7 years. Not recommended for pregnant women or those with back problems.',
    7,
    NULL,
    FALSE,
    'FLEXIBLE',
    90,
    24,
    65.00,
    'USD',
    'PERSON',
    NOW()
) ON CONFLICT DO NOTHING;

-- Package 3: Airport to Ubud Hotels Transfer (Transfer Package)
-- Note: Check if transfer_packages table exists and has correct structure
DO $$
DECLARE
    op1_uuid UUID;
BEGIN
    op1_uuid := get_operator_id_by_email('bali.adventure@touroperator.com');
    
    -- Insert transfer package if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transfer_packages') THEN
        INSERT INTO transfer_packages (
            operator_id,
            title,
            short_description,
            full_description,
            destination_name,
            destination_city,
            destination_country,
            destination_coordinates,
            transfer_type,
            total_distance,
            distance_unit,
            estimated_duration_hours,
            estimated_duration_minutes,
            meet_and_greet,
            name_board,
            luggage_assistance,
            door_to_door_service,
            base_price,
            currency,
            status,
            published_at
        ) VALUES (
            op1_uuid,
            'Bali Airport to Ubud Hotels Transfer',
            'Comfortable one-way transfer from Ngurah Rai Airport to Ubud area hotels',
            'Professional transfer service from Bali''s Ngurah Rai International Airport (DPS) to hotels in Ubud area. Our experienced driver will meet you at the arrival gate with a name board. Air-conditioned vehicle with ample luggage space. Direct transfer with no unnecessary stops. Perfect start to your Ubud adventure.',
            'Ubud Hotels',
            'Ubud',
            'Indonesia',
            '{"latitude": -8.5069, "longitude": 115.3138}'::jsonb,
            'ONE_WAY',
            40.0,
            'KM',
            1,
            30,
            TRUE,
            TRUE,
            TRUE,
            TRUE,
            35.00,
            'USD',
            'published',
            NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Package 4: Ubud to Tanah Lot Temple Transfer (Transfer Package)
DO $$
DECLARE
    op1_uuid UUID;
BEGIN
    op1_uuid := get_operator_id_by_email('bali.adventure@touroperator.com');
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transfer_packages') THEN
        INSERT INTO transfer_packages (
            operator_id,
            title,
            short_description,
            full_description,
            destination_name,
            destination_city,
            destination_country,
            destination_coordinates,
            transfer_type,
            total_distance,
            distance_unit,
            estimated_duration_hours,
            estimated_duration_minutes,
            meet_and_greet,
            luggage_assistance,
            door_to_door_service,
            base_price,
            currency,
            status,
            published_at
        ) VALUES (
            op1_uuid,
            'Ubud to Tanah Lot Temple Transfer',
            'Reliable transfer service from Ubud area to Tanah Lot Temple',
            'Transfer service from Ubud hotels to Tanah Lot Temple - one of Bali''s most iconic sea temples. Your driver will pick you up at your hotel and take you directly to Tanah Lot. Ideal for sunset viewing. Return transfer available upon request.',
            'Tanah Lot Temple',
            'Tabanan',
            'Indonesia',
            '{"latitude": -8.6221, "longitude": 115.0859}'::jsonb,
            'ONE_WAY',
            35.0,
            'KM',
            1,
            15,
            TRUE,
            FALSE,
            TRUE,
            30.00,
            'USD',
            'published',
            NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- OPERATOR 2 PACKAGES: Java Cultural Experiences (java.cultural@touroperator.com)
-- ============================================================================

-- Package 5: Borobudur Sunrise Tour (Activity)
INSERT INTO activity_packages (
    operator_id,
    title,
    short_description,
    full_description,
    status,
    destination_name,
    destination_address,
    destination_city,
    destination_country,
    destination_postal_code,
    destination_coordinates,
    duration_hours,
    duration_minutes,
    difficulty_level,
    languages_supported,
    tags,
    meeting_point_name,
    meeting_point_address,
    meeting_point_coordinates,
    meeting_point_instructions,
    operating_days,
    whats_included,
    whats_not_included,
    what_to_bring,
    important_information,
    minimum_age,
    wheelchair_accessible,
    cancellation_policy_type,
    cancellation_refund_percentage,
    cancellation_deadline_hours,
    base_price,
    currency,
    price_type,
    published_at
) VALUES (
    get_operator_id_by_email('java.cultural@touroperator.com'),
    'Borobudur Temple Sunrise Tour',
    'Magical sunrise experience at the world''s largest Buddhist temple',
    'Wake up early for an unforgettable sunrise experience at Borobudur Temple, a UNESCO World Heritage Site. Arrive before dawn to climb the ancient temple and witness the sun rising over the surrounding mountains and volcanoes. Your knowledgeable guide will explain the temple''s history, architecture, and the intricate stone carvings depicting Buddhist teachings. After sunrise, enjoy breakfast with a view. This early morning timing allows you to avoid crowds and see the temple in its most beautiful light.',
    'published',
    'Borobudur Temple',
    'Borobudur Temple Complex, Magelang',
    'Magelang',
    'Indonesia',
    NULL,
    POINT(110.2014, -7.6079),
    4,
    0,
    'EASY',
    ARRAY['EN']::language_code[],
    ARRAY['CULTURAL', 'NATURE', 'EDUCATIONAL']::activity_tag[],
    'Hotel Pickup',
    'Your Hotel in Yogyakarta',
    POINT(110.3708, -7.7956), -- Yogyakarta center
    'Early morning pickup (around 4:00 AM) from Yogyakarta hotels. Tour starts before sunrise.',
    ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']::day_of_week[],
    ARRAY['Hotel pickup and drop-off from Yogyakarta', 'Professional English-speaking guide', 'Entrance ticket to Borobudur', 'Sunrise access fee', 'Breakfast', 'Bottled water'],
    ARRAY['Personal expenses', 'Gratuities', 'Travel insurance'],
    ARRAY['Comfortable walking shoes', 'Camera', 'Light jacket (early morning can be cool)'],
    'Sunrise access requires special ticket. Weather dependent - refund policy applies for cancellation due to weather.',
    0,
    FALSE,
    'MODERATE',
    80,
    24,
    85.00,
    'USD',
    'PERSON',
    NOW()
) ON CONFLICT DO NOTHING;

-- Continue with more packages... (I'll add them in next part due to file size)

