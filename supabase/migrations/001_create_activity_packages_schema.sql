-- Create Activity Packages Schema
-- This migration creates tables for activity packages with gallery support

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enum types
CREATE TYPE package_status AS ENUM ('draft', 'published', 'archived', 'suspended');
CREATE TYPE difficulty_level AS ENUM ('EASY', 'MODERATE', 'CHALLENGING', 'DIFFICULT');
CREATE TYPE language_code AS ENUM ('EN', 'ES', 'FR', 'DE', 'IT', 'PT', 'RU', 'ZH', 'JA', 'KO');
CREATE TYPE activity_tag AS ENUM ('ADVENTURE', 'FAMILY_FRIENDLY', 'ROMANTIC', 'CULTURAL', 'NATURE', 'SPORTS', 'FOOD', 'NIGHTLIFE', 'EDUCATIONAL', 'RELAXATION');
CREATE TYPE day_of_week AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');
CREATE TYPE currency_code AS ENUM ('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY');
CREATE TYPE price_type AS ENUM ('PERSON', 'GROUP');
CREATE TYPE faq_category AS ENUM ('GENERAL', 'BOOKING', 'CANCELLATION', 'WEATHER', 'SAFETY', 'ACCESSIBILITY');
CREATE TYPE cancellation_policy_type AS ENUM ('FLEXIBLE', 'MODERATE', 'STRICT', 'CUSTOM');
CREATE TYPE accessibility_facility AS ENUM ('RESTROOMS', 'PARKING', 'ELEVATOR', 'RAMP', 'SIGN_LANGUAGE', 'BRAILLE', 'AUDIO_GUIDE');

-- Create activity_packages table
CREATE TABLE activity_packages (
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
    destination_coordinates POINT NOT NULL,
    
    -- Activity Details
    duration_hours INTEGER NOT NULL DEFAULT 2,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    difficulty_level difficulty_level NOT NULL DEFAULT 'EASY',
    languages_supported language_code[] NOT NULL DEFAULT '{EN}',
    tags activity_tag[] NOT NULL DEFAULT '{}',
    
    -- Meeting Point
    meeting_point_name VARCHAR(100) NOT NULL,
    meeting_point_address TEXT NOT NULL,
    meeting_point_coordinates POINT NOT NULL,
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
    accessibility_facilities accessibility_facility[] NOT NULL DEFAULT '{}',
    special_assistance TEXT,
    
    -- Cancellation Policy
    cancellation_policy_type cancellation_policy_type NOT NULL DEFAULT 'MODERATE',
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
    child_price_type price_type,
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
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_duration CHECK (duration_hours >= 0 AND duration_minutes >= 0 AND duration_minutes < 60),
    CONSTRAINT valid_price CHECK (base_price >= 0),
    CONSTRAINT valid_age CHECK (minimum_age >= 0 AND (maximum_age IS NULL OR maximum_age >= minimum_age)),
    CONSTRAINT valid_refund_percentage CHECK (cancellation_refund_percentage >= 0 AND cancellation_refund_percentage <= 100),
    CONSTRAINT valid_cancellation_deadline CHECK (cancellation_deadline_hours >= 0)
);

-- Create activity_package_images table for gallery support
CREATE TABLE activity_package_images (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_file_size CHECK (file_size > 0),
    CONSTRAINT valid_dimensions CHECK (width > 0 AND height > 0),
    CONSTRAINT valid_display_order CHECK (display_order >= 0)
);

-- Create activity_package_time_slots table
CREATE TABLE activity_package_time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID NOT NULL REFERENCES activity_packages(id) ON DELETE CASCADE,
    
    -- Time Slot Details
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    days day_of_week[] NOT NULL DEFAULT '{}',
    
    -- Pricing Override (optional)
    price_override DECIMAL(10,2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_capacity CHECK (capacity > 0),
    CONSTRAINT valid_time_slot CHECK (start_time < end_time),
    CONSTRAINT valid_price_override CHECK (price_override IS NULL OR price_override >= 0)
);

-- Create activity_package_variants table
CREATE TABLE activity_package_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID NOT NULL REFERENCES activity_packages(id) ON DELETE CASCADE,
    
    -- Variant Details
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_adjustment DECIMAL(10,2) NOT NULL DEFAULT 0,
    features TEXT[] NOT NULL DEFAULT '{}',
    max_capacity INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_max_capacity CHECK (max_capacity > 0),
    CONSTRAINT valid_display_order CHECK (display_order >= 0)
);

-- Create activity_package_faqs table
CREATE TABLE activity_package_faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID NOT NULL REFERENCES activity_packages(id) ON DELETE CASCADE,
    
    -- FAQ Details
    question VARCHAR(200) NOT NULL,
    answer TEXT NOT NULL,
    category faq_category NOT NULL DEFAULT 'GENERAL',
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_display_order CHECK (display_order >= 0)
);

-- Create indexes for better performance
CREATE INDEX idx_activity_packages_operator_id ON activity_packages(operator_id);
CREATE INDEX idx_activity_packages_status ON activity_packages(status);
CREATE INDEX idx_activity_packages_destination ON activity_packages(destination_city, destination_country);
CREATE INDEX idx_activity_packages_difficulty ON activity_packages(difficulty_level);
CREATE INDEX idx_activity_packages_price ON activity_packages(base_price);
CREATE INDEX idx_activity_packages_created_at ON activity_packages(created_at DESC);
CREATE INDEX idx_activity_packages_published_at ON activity_packages(published_at DESC);

CREATE INDEX idx_activity_package_images_package_id ON activity_package_images(package_id);
CREATE INDEX idx_activity_package_images_cover ON activity_package_images(package_id, is_cover) WHERE is_cover = TRUE;
CREATE INDEX idx_activity_package_images_featured ON activity_package_images(package_id, is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_activity_package_images_order ON activity_package_images(package_id, display_order);

CREATE INDEX idx_activity_package_time_slots_package_id ON activity_package_time_slots(package_id);
CREATE INDEX idx_activity_package_time_slots_active ON activity_package_time_slots(package_id, is_active) WHERE is_active = TRUE;

CREATE INDEX idx_activity_package_variants_package_id ON activity_package_variants(package_id);
CREATE INDEX idx_activity_package_variants_active ON activity_package_variants(package_id, is_active) WHERE is_active = TRUE;

CREATE INDEX idx_activity_package_faqs_package_id ON activity_package_faqs(package_id);
CREATE INDEX idx_activity_package_faqs_category ON activity_package_faqs(package_id, category);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_activity_packages_updated_at BEFORE UPDATE ON activity_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_package_images_updated_at BEFORE UPDATE ON activity_package_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_package_time_slots_updated_at BEFORE UPDATE ON activity_package_time_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_package_variants_updated_at BEFORE UPDATE ON activity_package_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_package_faqs_updated_at BEFORE UPDATE ON activity_package_faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to ensure only one cover image per package
CREATE OR REPLACE FUNCTION ensure_single_cover_image()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_cover = TRUE THEN
        -- Unset other cover images for this package
        UPDATE activity_package_images 
        SET is_cover = FALSE 
        WHERE package_id = NEW.package_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for single cover image
CREATE TRIGGER ensure_single_cover_image_trigger 
    BEFORE INSERT OR UPDATE ON activity_package_images
    FOR EACH ROW EXECUTE FUNCTION ensure_single_cover_image();

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_package_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
        -- Remove leading/trailing hyphens
        NEW.slug = trim(both '-' from NEW.slug);
        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM activity_packages WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
            NEW.slug = NEW.slug || '-' || extract(epoch from now())::text;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for slug generation
CREATE TRIGGER generate_package_slug_trigger 
    BEFORE INSERT OR UPDATE ON activity_packages
    FOR EACH ROW EXECUTE FUNCTION generate_package_slug();

-- Enable Row Level Security (RLS)
ALTER TABLE activity_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_package_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_package_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_package_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_package_faqs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Activity packages: Users can only see their own packages, or published packages
CREATE POLICY "Users can view their own activity packages" ON activity_packages
    FOR SELECT USING (auth.uid() = operator_id);

CREATE POLICY "Users can view published activity packages" ON activity_packages
    FOR SELECT USING (status = 'published');

CREATE POLICY "Users can insert their own activity packages" ON activity_packages
    FOR INSERT WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Users can update their own activity packages" ON activity_packages
    FOR UPDATE USING (auth.uid() = operator_id);

CREATE POLICY "Users can delete their own activity packages" ON activity_packages
    FOR DELETE USING (auth.uid() = operator_id);

-- Activity package images: Users can only manage images for their own packages
CREATE POLICY "Users can view images for their packages or published packages" ON activity_package_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activity_packages 
            WHERE id = package_id 
            AND (operator_id = auth.uid() OR status = 'published')
        )
    );

CREATE POLICY "Users can insert images for their packages" ON activity_package_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM activity_packages 
            WHERE id = package_id AND operator_id = auth.uid()
        )
    );

CREATE POLICY "Users can update images for their packages" ON activity_package_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM activity_packages 
            WHERE id = package_id AND operator_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete images for their packages" ON activity_package_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM activity_packages 
            WHERE id = package_id AND operator_id = auth.uid()
        )
    );

-- Similar policies for other related tables
CREATE POLICY "Users can manage time slots for their packages" ON activity_package_time_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM activity_packages 
            WHERE id = package_id AND operator_id = auth.uid()
        )
    );

CREATE POLICY "Users can view time slots for published packages" ON activity_package_time_slots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activity_packages 
            WHERE id = package_id AND status = 'published'
        )
    );

CREATE POLICY "Users can manage variants for their packages" ON activity_package_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM activity_packages 
            WHERE id = package_id AND operator_id = auth.uid()
        )
    );

CREATE POLICY "Users can view variants for published packages" ON activity_package_variants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activity_packages 
            WHERE id = package_id AND status = 'published'
        )
    );

CREATE POLICY "Users can manage FAQs for their packages" ON activity_package_faqs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM activity_packages 
            WHERE id = package_id AND operator_id = auth.uid()
        )
    );

CREATE POLICY "Users can view FAQs for published packages" ON activity_package_faqs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activity_packages 
            WHERE id = package_id AND status = 'published'
        )
    );

-- Create storage bucket for activity package images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'activity-package-images',
    'activity-package-images',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for activity package images
CREATE POLICY "Users can upload images for their packages" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'activity-package-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update images for their packages" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'activity-package-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete images for their packages" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'activity-package-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view published package images" ON storage.objects
    FOR SELECT USING (bucket_id = 'activity-package-images');

-- Create function to handle image uploads
CREATE OR REPLACE FUNCTION handle_activity_package_image_upload()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert record into activity_package_images table
    INSERT INTO activity_package_images (
        package_id,
        file_name,
        file_size,
        mime_type,
        storage_path,
        public_url
    ) VALUES (
        (storage.foldername(NEW.name))[2]::uuid,
        NEW.name,
        NEW.metadata->>'size',
        NEW.metadata->>'mimetype',
        NEW.name,
        NEW.name
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for image upload handling
CREATE TRIGGER handle_activity_package_image_upload_trigger
    AFTER INSERT ON storage.objects
    FOR EACH ROW
    WHEN (NEW.bucket_id = 'activity-package-images')
    EXECUTE FUNCTION handle_activity_package_image_upload();
