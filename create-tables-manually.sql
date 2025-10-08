-- Create just the essential tables first
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create basic enum types
DO $$ BEGIN
    CREATE TYPE package_status AS ENUM ('draft', 'published', 'archived', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE difficulty_level AS ENUM ('EASY', 'MODERATE', 'CHALLENGING', 'DIFFICULT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE language_code AS ENUM ('EN', 'ES', 'FR', 'DE', 'IT', 'PT', 'RU', 'ZH', 'JA', 'KO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_tag AS ENUM ('ADVENTURE', 'FAMILY_FRIENDLY', 'ROMANTIC', 'CULTURAL', 'NATURE', 'SPORTS', 'FOOD', 'NIGHTLIFE', 'EDUCATIONAL', 'RELAXATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE day_of_week AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE currency_code AS ENUM ('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE price_type AS ENUM ('PERSON', 'GROUP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE child_price_type AS ENUM ('PERCENTAGE', 'FIXED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create main activity_packages table
CREATE TABLE IF NOT EXISTS activity_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Information
    title VARCHAR(100) NOT NULL,
    short_description VARCHAR(160) NOT NULL,
    full_description TEXT NOT NULL,
    status package_status DEFAULT 'draft',
    
    -- Location Information
    destination_name VARCHAR(100) NOT NULL,
    destination_address TEXT NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    destination_country VARCHAR(100) NOT NULL,
    destination_postal_code VARCHAR(20),
    destination_coordinates TEXT NOT NULL,
    
    -- Activity Details
    duration_hours INTEGER NOT NULL DEFAULT 2,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    difficulty_level difficulty_level NOT NULL DEFAULT 'EASY',
    languages_supported language_code[] NOT NULL DEFAULT '{EN}',
    tags activity_tag[] NOT NULL DEFAULT '{}',
    
    -- Meeting Point
    meeting_point_name VARCHAR(100) NOT NULL,
    meeting_point_address TEXT NOT NULL,
    meeting_point_coordinates TEXT NOT NULL,
    meeting_point_instructions TEXT,
    
    -- Operational Hours
    operating_days day_of_week[] NOT NULL DEFAULT '{}',
    
    -- What's Included/Excluded
    whats_included TEXT[] NOT NULL DEFAULT '{}',
    whats_not_included TEXT[] NOT NULL DEFAULT '{}',
    what_to_bring TEXT[] NOT NULL DEFAULT '{}',
    important_information TEXT,
    
    -- Age Restrictions
    minimum_age INTEGER NOT NULL DEFAULT 0,
    maximum_age INTEGER,
    child_policy TEXT,
    infant_policy TEXT,
    age_verification_required BOOLEAN DEFAULT FALSE,
    
    -- Accessibility
    wheelchair_accessible BOOLEAN DEFAULT FALSE,
    accessibility_facilities TEXT[] NOT NULL DEFAULT '{}',
    special_assistance TEXT,
    
    -- Cancellation Policy
    cancellation_policy_type VARCHAR(20) NOT NULL DEFAULT 'MODERATE',
    cancellation_policy_custom TEXT,
    cancellation_refund_percentage INTEGER NOT NULL DEFAULT 80,
    cancellation_deadline_hours INTEGER NOT NULL DEFAULT 24,
    
    -- Weather Policy
    weather_policy TEXT,
    
    -- Health & Safety
    health_safety_requirements JSONB NOT NULL DEFAULT '[]',
    health_safety_additional_info TEXT,
    
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency currency_code NOT NULL DEFAULT 'USD',
    price_type price_type NOT NULL DEFAULT 'PERSON',
    child_price_type child_price_type,
    child_price_value DECIMAL(10,2),
    infant_price DECIMAL(10,2),
    group_discounts JSONB NOT NULL DEFAULT '[]',
    seasonal_pricing JSONB NOT NULL DEFAULT '[]',
    dynamic_pricing_enabled BOOLEAN DEFAULT FALSE,
    dynamic_pricing_base_multiplier DECIMAL(3,2) DEFAULT 1.0,
    dynamic_pricing_demand_multiplier DECIMAL(3,2) DEFAULT 1.0,
    dynamic_pricing_season_multiplier DECIMAL(3,2) DEFAULT 1.0,
    
    -- SEO and Metadata
    slug VARCHAR(100) UNIQUE,
    meta_title VARCHAR(60),
    meta_description VARCHAR(160),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Create activity_package_images table
CREATE TABLE IF NOT EXISTS activity_package_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID NOT NULL REFERENCES activity_packages(id) ON DELETE CASCADE,
    
    -- Image Information
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    public_url VARCHAR(500) NOT NULL,
    
    -- Image Metadata
    width INTEGER,
    height INTEGER,
    alt_text VARCHAR(255),
    caption TEXT,
    
    -- Gallery Management
    is_cover BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE activity_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_package_images ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can manage their own activity packages" ON activity_packages
    FOR ALL USING (auth.uid() = operator_id);

CREATE POLICY "Users can view published activity packages" ON activity_packages
    FOR SELECT USING (status = 'published');

CREATE POLICY "Users can manage images for their packages" ON activity_package_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM activity_packages 
            WHERE id = package_id AND operator_id = auth.uid()
        )
    );

CREATE POLICY "Users can view images for published packages" ON activity_package_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activity_packages 
            WHERE id = package_id AND status = 'published'
        )
    );
