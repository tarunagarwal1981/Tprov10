-- Test query to check activity packages in database
-- Run this in your Supabase SQL Editor to see if packages exist

-- 1. Check if activity_packages table exists and count total packages
SELECT COUNT(*) as total_packages 
FROM activity_packages;

-- 2. View all packages with basic information
SELECT 
    id,
    operator_id,
    title,
    short_description,
    status,
    base_price,
    currency,
    destination_city,
    destination_country,
    created_at,
    published_at
FROM activity_packages
ORDER BY created_at DESC;

-- 3. Check packages with their images
SELECT 
    ap.id,
    ap.title,
    ap.status,
    ap.base_price,
    COUNT(api.id) as image_count,
    MAX(CASE WHEN api.is_cover THEN api.public_url END) as cover_image_url
FROM activity_packages ap
LEFT JOIN activity_package_images api ON ap.id = api.package_id
GROUP BY ap.id, ap.title, ap.status, ap.base_price
ORDER BY ap.created_at DESC;

-- 4. Check packages by status
SELECT 
    status,
    COUNT(*) as count
FROM activity_packages
GROUP BY status;

-- 5. Check packages for a specific operator (replace with actual user ID)
-- First, get your user ID from auth.users
SELECT id, email, name, role 
FROM auth.users 
WHERE email = 'your-email@example.com'; -- Replace with your email

-- Then use that ID here:
SELECT 
    ap.id,
    ap.title,
    ap.status,
    ap.base_price,
    ap.created_at
FROM activity_packages ap
WHERE ap.operator_id = 'YOUR_USER_ID_HERE'; -- Replace with actual user ID

-- 6. Check if RLS policies are working
-- This should only show packages you own or published ones
SELECT 
    ap.id,
    ap.title,
    ap.status,
    ap.operator_id = auth.uid() as is_mine
FROM activity_packages ap;

-- 7. Check related data counts
SELECT 
    'activity_packages' as table_name, 
    COUNT(*) as count 
FROM activity_packages
UNION ALL
SELECT 
    'activity_package_images', 
    COUNT(*) 
FROM activity_package_images
UNION ALL
SELECT 
    'activity_package_time_slots', 
    COUNT(*) 
FROM activity_package_time_slots
UNION ALL
SELECT 
    'activity_package_variants', 
    COUNT(*) 
FROM activity_package_variants
UNION ALL
SELECT 
    'activity_package_faqs', 
    COUNT(*) 
FROM activity_package_faqs;

