-- Check what the actual enum values are for package_status

-- Method 1: Check enum type definition
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'package_status'
ORDER BY e.enumsortorder;

-- Method 2: Check activity_packages table structure
SELECT 
    column_name,
    data_type,
    udt_name,
    column_default
FROM information_schema.columns
WHERE table_name = 'activity_packages' 
AND column_name = 'status';

-- Method 3: Check existing values in the table
SELECT DISTINCT status 
FROM activity_packages 
WHERE status IS NOT NULL;

