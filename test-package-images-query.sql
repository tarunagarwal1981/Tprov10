-- Test query to check if package images are properly linked

-- Check Activity Packages with images
SELECT 
    ap.id,
    ap.title,
    ap.status,
    COUNT(api.id) as image_count,
    ARRAY_AGG(api.public_url) as image_urls,
    ARRAY_AGG(api.is_cover) as is_cover_flags
FROM activity_packages ap
LEFT JOIN activity_package_images api ON api.package_id = ap.id
GROUP BY ap.id, ap.title, ap.status
ORDER BY ap.created_at DESC
LIMIT 10;

-- Check Transfer Packages with images
SELECT 
    tp.id,
    tp.title,
    tp.status,
    COUNT(tpi.id) as image_count,
    ARRAY_AGG(tpi.public_url) as image_urls,
    ARRAY_AGG(tpi.is_cover) as is_cover_flags
FROM transfer_packages tp
LEFT JOIN transfer_package_images tpi ON tpi.package_id = tp.id
GROUP BY tp.id, tp.title, tp.status
ORDER BY tp.created_at DESC
LIMIT 10;

-- Check Multi-City Packages with images
SELECT 
    mcp.id,
    mcp.title,
    mcp.status,
    COUNT(mcpi.id) as image_count,
    ARRAY_AGG(mcpi.public_url) as image_urls,
    ARRAY_AGG(mcpi.is_cover) as is_cover_flags
FROM multi_city_packages mcp
LEFT JOIN multi_city_package_images mcpi ON mcpi.package_id = mcp.id
GROUP BY mcp.id, mcp.title, mcp.status
ORDER BY mcp.created_at DESC
LIMIT 10;

-- Check if there are orphaned images
SELECT 'activity' as type, COUNT(*) as orphaned_images
FROM activity_package_images api
WHERE NOT EXISTS (SELECT 1 FROM activity_packages WHERE id = api.package_id)
UNION ALL
SELECT 'transfer' as type, COUNT(*) as orphaned_images
FROM transfer_package_images tpi
WHERE NOT EXISTS (SELECT 1 FROM transfer_packages WHERE id = tpi.package_id)
UNION ALL
SELECT 'multi_city' as type, COUNT(*) as orphaned_images
FROM multi_city_package_images mcpi
WHERE NOT EXISTS (SELECT 1 FROM multi_city_packages WHERE id = mcpi.package_id);

