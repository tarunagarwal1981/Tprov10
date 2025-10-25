-- ========================================
-- FIX TRANSFER PACKAGE SCHEMA FOR NEW FORM
-- ========================================
-- This script fixes the schema to match the new form requirements
-- Run this in your Supabase SQL editor

-- ========================================
-- 1. Make short_description NULLABLE
-- ========================================
-- Description is now optional in the form

ALTER TABLE transfer_packages 
ALTER COLUMN short_description DROP NOT NULL;

COMMENT ON COLUMN transfer_packages.short_description IS 'Optional short description for listings';

-- ========================================
-- 2. Verify transfer_vehicle_images table exists
-- ========================================
-- This table should already exist from the main schema
-- It links vehicle images directly to vehicles

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transfer_vehicle_images'
    ) THEN
        CREATE TABLE transfer_vehicle_images (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vehicle_id UUID NOT NULL REFERENCES transfer_package_vehicles(id) ON DELETE CASCADE,
          file_name VARCHAR(255) NOT NULL,
          file_size INTEGER,
          mime_type VARCHAR(100),
          storage_path TEXT NOT NULL,
          public_url TEXT,
          alt_text TEXT,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX idx_transfer_vehicle_images_vehicle_id ON transfer_vehicle_images(vehicle_id);
        
        -- Enable RLS
        ALTER TABLE transfer_vehicle_images ENABLE ROW LEVEL SECURITY;
        
        -- RLS Policies
        CREATE POLICY "Anyone can view vehicle images"
        ON transfer_vehicle_images FOR SELECT TO public USING (true);

        CREATE POLICY "Operators can manage vehicle images"
        ON transfer_vehicle_images FOR ALL TO authenticated
        USING (EXISTS (
          SELECT 1 FROM transfer_package_vehicles v
          JOIN transfer_packages p ON p.id = v.package_id
          WHERE v.id = vehicle_id 
          AND p.operator_id = auth.uid()
        ));
    END IF;
END $$;

-- ========================================
-- 3. Add helper column to track vehicle images (optional)
-- ========================================
-- Add a column to track if vehicle has an image (for quick queries)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transfer_package_vehicles' 
        AND column_name = 'has_image'
    ) THEN
        ALTER TABLE transfer_package_vehicles 
        ADD COLUMN has_image BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN transfer_package_vehicles.has_image IS 'Quick flag to check if vehicle has image';
    END IF;
END $$;

-- ========================================
-- 4. Create function to update has_image flag
-- ========================================

CREATE OR REPLACE FUNCTION update_vehicle_has_image()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE transfer_package_vehicles
        SET has_image = true
        WHERE id = NEW.vehicle_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Check if there are other images for this vehicle
        IF NOT EXISTS (
            SELECT 1 FROM transfer_vehicle_images 
            WHERE vehicle_id = OLD.vehicle_id
        ) THEN
            UPDATE transfer_package_vehicles
            SET has_image = false
            WHERE id = OLD.vehicle_id;
        END IF;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. Create trigger for has_image flag
-- ========================================

DROP TRIGGER IF EXISTS trigger_update_vehicle_has_image ON transfer_vehicle_images;

CREATE TRIGGER trigger_update_vehicle_has_image
AFTER INSERT OR UPDATE OR DELETE ON transfer_vehicle_images
FOR EACH ROW
EXECUTE FUNCTION update_vehicle_has_image();

-- ========================================
-- 6. Verification queries
-- ========================================

-- Check short_description is nullable
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'transfer_packages' 
AND column_name = 'short_description';

-- Check vehicle images table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'transfer_vehicle_images'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
    tablename, 
    policyname, 
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('transfer_vehicle_images', 'transfer_package_vehicles')
ORDER BY tablename, cmd;

-- ========================================
-- 7. Test data integrity
-- ========================================

-- Count existing records
SELECT 
    'transfer_packages' as table_name,
    COUNT(*) as count
FROM transfer_packages
UNION ALL
SELECT 
    'transfer_package_vehicles' as table_name,
    COUNT(*) as count
FROM transfer_package_vehicles
UNION ALL
SELECT 
    'transfer_vehicle_images' as table_name,
    COUNT(*) as count
FROM transfer_vehicle_images;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

SELECT '✅ Transfer package schema fixed successfully!' as status,
       'short_description is now optional' as change_1,
       'transfer_vehicle_images table ready' as change_2,
       'has_image flag added to vehicles' as change_3;

