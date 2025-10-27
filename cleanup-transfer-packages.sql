-- ========================================
-- CLEANUP ALL TRANSFER PACKAGES
-- ========================================
-- This script will DELETE ALL transfer packages and their related data
-- USE WITH CAUTION - This is irreversible!
-- Recommended: Run the inspection queries first to see what will be deleted

-- ========================================
-- STEP 1: INSPECT CURRENT DATA (Run this first!)
-- ========================================

-- Check all transfer packages
SELECT 
    id,
    title,
    status,
    operator_id,
    created_at,
    updated_at
FROM transfer_packages
ORDER BY created_at DESC;

-- Count packages per operator
SELECT 
    operator_id,
    COUNT(*) as package_count,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
    COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count
FROM transfer_packages
GROUP BY operator_id;

-- Check duplicates (packages with same title by same operator)
SELECT 
    operator_id,
    title,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY created_at) as package_ids,
    array_agg(created_at ORDER BY created_at) as created_dates
FROM transfer_packages
GROUP BY operator_id, title
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Count related records per package
SELECT 
    p.id,
    p.title,
    p.status,
    p.created_at,
    (SELECT COUNT(*) FROM transfer_package_vehicles WHERE package_id = p.id) as vehicles,
    (SELECT COUNT(*) FROM transfer_vehicle_images vi 
     JOIN transfer_package_vehicles v ON vi.vehicle_id = v.id 
     WHERE v.package_id = p.id) as vehicle_images,
    (SELECT COUNT(*) FROM transfer_hourly_pricing WHERE package_id = p.id) as hourly_pricing,
    (SELECT COUNT(*) FROM transfer_point_to_point_pricing WHERE package_id = p.id) as p2p_pricing,
    (SELECT COUNT(*) FROM transfer_package_images WHERE package_id = p.id) as package_images
FROM transfer_packages p
ORDER BY p.created_at DESC;

-- ========================================
-- STEP 2: BACKUP (Optional but Recommended)
-- ========================================
-- If you want to backup before deleting, run these in order:

-- Note: Supabase doesn't support CREATE TABLE AS SELECT directly in SQL editor
-- Instead, you can export via the Supabase dashboard:
-- 1. Go to Table Editor
-- 2. Select each table
-- 3. Click "..." menu → "Download as CSV"
-- 4. Save the files locally

-- ========================================
-- STEP 3: DELETE ALL TRANSFER PACKAGES
-- ========================================
-- This will cascade delete all related records due to foreign key constraints

-- OPTION A: Delete ALL transfer packages for ALL operators
-- ⚠️ WARNING: This deletes EVERYTHING
-- Uncomment the next line to execute:
-- DELETE FROM transfer_packages;

-- OPTION B: Delete packages for a SPECIFIC operator
-- Replace 'YOUR_OPERATOR_ID' with your actual operator ID
-- Uncomment and modify the next line to execute:
-- DELETE FROM transfer_packages WHERE operator_id = 'YOUR_OPERATOR_ID';

-- OPTION C: Delete only DRAFT packages (keep published ones)
-- Uncomment the next line to execute:
-- DELETE FROM transfer_packages WHERE status = 'draft';

-- OPTION D: Delete packages older than a specific date
-- Uncomment and modify the next line to execute:
-- DELETE FROM transfer_packages WHERE created_at < '2025-01-26 00:00:00';

-- OPTION E: Delete duplicate packages (keep the newest one per title)
-- This is more complex - it keeps the most recent package with each title
-- Uncomment the next block to execute:
/*
DELETE FROM transfer_packages
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY operator_id, title 
                ORDER BY created_at DESC
            ) as rn
        FROM transfer_packages
    ) t
    WHERE rn > 1
);
*/

-- ========================================
-- STEP 4: VERIFY DELETION
-- ========================================

-- Check remaining packages
SELECT COUNT(*) as remaining_packages
FROM transfer_packages;

-- Check remaining vehicles (should be 0 if all packages deleted)
SELECT COUNT(*) as remaining_vehicles
FROM transfer_package_vehicles;

-- Check remaining vehicle images (should be 0 if all packages deleted)
SELECT COUNT(*) as remaining_vehicle_images
FROM transfer_vehicle_images;

-- Check remaining hourly pricing (should be 0 if all packages deleted)
SELECT COUNT(*) as remaining_hourly_pricing
FROM transfer_hourly_pricing;

-- Check remaining point-to-point pricing (should be 0 if all packages deleted)
SELECT COUNT(*) as remaining_p2p_pricing
FROM transfer_point_to_point_pricing;

-- ========================================
-- STEP 5: CLEANUP ORPHANED IMAGES (Optional)
-- ========================================
-- If you deleted packages but images remain in storage,
-- you'll need to clean them up manually in Supabase Storage

-- List all image paths that should be cleaned up
SELECT DISTINCT
    storage_path,
    'transfer-packages/' || split_part(storage_path, '/', 3) as bucket_path
FROM transfer_package_images
WHERE package_id NOT IN (SELECT id FROM transfer_packages);

SELECT DISTINCT
    vi.storage_path,
    'transfer-packages/vehicles/' || split_part(vi.storage_path, '/', 4) as bucket_path
FROM transfer_vehicle_images vi
JOIN transfer_package_vehicles v ON vi.vehicle_id = v.id
WHERE v.package_id NOT IN (SELECT id FROM transfer_packages);

-- To clean up storage:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Navigate to the bucket
-- 3. Delete the orphaned folders/files

-- ========================================
-- STEP 6: RESET AUTO-INCREMENT (Optional)
-- ========================================
-- PostgreSQL uses sequences for IDs
-- If you want to reset the sequence counters:

-- Note: Only do this if you deleted ALL records and want to start from 1
-- This is usually not necessary as UUIDs don't use sequences

-- ========================================
-- RECOMMENDED APPROACH
-- ========================================

-- 1. First, run all STEP 1 queries to see what you have
-- 2. Identify which packages to delete (all? specific operator? duplicates?)
-- 3. Choose the appropriate DELETE query from STEP 3
-- 4. Run the STEP 4 queries to verify
-- 5. Check Supabase Storage and clean up orphaned images if needed

-- ========================================
-- QUICK CLEANUP FOR YOUR SPECIFIC CASE
-- ========================================
-- Since you mentioned all packages are test/auto-saved duplicates,
-- here's a safe approach:

-- Step 1: Check what you have
SELECT 
    COUNT(*) as total_packages,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as drafts,
    COUNT(CASE WHEN status = 'published' THEN 1 END) as published
FROM transfer_packages;

-- Step 2: If you want to delete ALL (uncomment to execute)
-- DELETE FROM transfer_packages;

-- Step 3: Verify (should return 0)
-- SELECT COUNT(*) FROM transfer_packages;

-- ========================================
-- IMPORTANT NOTES
-- ========================================
-- 1. CASCADE DELETE is configured, so deleting a package will automatically delete:
--    - transfer_package_images
--    - transfer_package_vehicles (which will also delete transfer_vehicle_images)
--    - transfer_package_stops
--    - transfer_additional_services
--    - transfer_hourly_pricing
--    - transfer_point_to_point_pricing
--
-- 2. Files in Supabase Storage are NOT automatically deleted
--    You need to manually clean them up in the Storage dashboard
--
-- 3. Always run inspection queries first!
--
-- 4. If you're unsure, start with deleting just DRAFT packages
--
-- 5. You can't undo a DELETE - be careful!

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT '✅ Cleanup script ready!' as status,
       'Run the inspection queries first, then choose your delete option' as instruction;

