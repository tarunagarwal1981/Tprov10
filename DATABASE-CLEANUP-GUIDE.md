# Database Cleanup Guide

## 🎯 Goal
Clean up all test/duplicate transfer packages from the database.

---

## 📋 Quick Start (Recommended Steps)

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Inspect Current Data

Copy and paste this query to see what you have:

```sql
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
```

Click "Run" to execute.

### Step 3: Check for Duplicates

```sql
-- Check duplicates (packages with same title)
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
```

### Step 4: See Related Records

```sql
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
    (SELECT COUNT(*) FROM transfer_point_to_point_pricing WHERE package_id = p.id) as p2p_pricing
FROM transfer_packages p
ORDER BY p.created_at DESC;
```

---

## 🗑️ Deletion Options

### ⚠️ IMPORTANT: These operations are IRREVERSIBLE!

Choose ONE option below based on your needs:

### Option 1: Delete ALL Transfer Packages (Nuclear Option)
```sql
-- Deletes EVERYTHING - use if all packages are test/junk
DELETE FROM transfer_packages;
```

**When to use:** All packages are test data and you want to start fresh.

---

### Option 2: Delete Only YOUR Packages
```sql
-- Replace 'YOUR_USER_ID' with your actual operator_id
DELETE FROM transfer_packages 
WHERE operator_id = 'YOUR_USER_ID';
```

**When to use:** Multiple operators exist, only want to clean your own packages.

**How to find your operator_id:**
```sql
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

---

### Option 3: Delete Only DRAFT Packages (Keep Published)
```sql
-- Keeps published packages, removes drafts
DELETE FROM transfer_packages 
WHERE status = 'draft';
```

**When to use:** You have some good published packages but lots of draft junk.

---

### Option 4: Delete Duplicates (Keep Newest)
```sql
-- Keeps the most recent package with each title
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
```

**When to use:** You have duplicate titles and want to keep only the most recent version.

---

### Option 5: Delete Packages Older Than a Date
```sql
-- Delete packages created before a specific date
DELETE FROM transfer_packages 
WHERE created_at < '2025-01-26 00:00:00';
```

**When to use:** You want to keep recent packages but delete old test data.

---

## ✅ Verify Deletion

After deleting, run these queries to confirm:

```sql
-- Check remaining packages
SELECT COUNT(*) as remaining_packages FROM transfer_packages;

-- Check remaining vehicles (should be 0 if all packages deleted)
SELECT COUNT(*) as remaining_vehicles FROM transfer_package_vehicles;

-- Check remaining pricing (should be 0 if all packages deleted)
SELECT COUNT(*) as remaining_hourly_pricing FROM transfer_hourly_pricing;
SELECT COUNT(*) as remaining_p2p_pricing FROM transfer_point_to_point_pricing;
```

**Expected Results (if you deleted all packages):**
- `remaining_packages`: 0
- `remaining_vehicles`: 0
- `remaining_hourly_pricing`: 0
- `remaining_p2p_pricing`: 0

---

## 🖼️ Cleanup Storage Images (After DB Cleanup)

The database delete will remove records, but NOT the actual image files in storage.

### Manual Storage Cleanup

1. Go to Supabase Dashboard
2. Click "Storage" in the left sidebar
3. Navigate to your bucket (usually `transfer-packages` or similar)
4. You'll see folders with user IDs
5. Manually delete the folders you want to remove

### Automated Storage Cleanup (Advanced)

If you have many images, you can use the Supabase Storage API:

```javascript
// Run this in your browser console or Node.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SERVICE_ROLE_KEY' // Use service role key, not anon key
)

// List all files in transfer-packages bucket
const { data: files } = await supabase
  .storage
  .from('transfer-packages')
  .list()

// Delete specific folder
await supabase
  .storage
  .from('transfer-packages')
  .remove(['USER_ID/subfolder'])
```

---

## 🔍 Check Other Package Types (Optional)

If you also want to check/clean other package types:

### Activity Packages
```sql
SELECT COUNT(*) FROM activity_packages;
SELECT * FROM activity_packages ORDER BY created_at DESC LIMIT 10;
-- DELETE FROM activity_packages; -- uncomment to delete
```

### Multi-City Packages
```sql
SELECT COUNT(*) FROM multi_city_packages;
SELECT * FROM multi_city_packages ORDER BY created_at DESC LIMIT 10;
-- DELETE FROM multi_city_packages; -- uncomment to delete
```

### All Package Types at Once
```sql
-- Count all packages across all types
SELECT 
    'transfer_packages' as type, 
    COUNT(*) as count 
FROM transfer_packages
UNION ALL
SELECT 
    'activity_packages' as type, 
    COUNT(*) as count 
FROM activity_packages
UNION ALL
SELECT 
    'multi_city_packages' as type, 
    COUNT(*) as count 
FROM multi_city_packages;
```

---

## 🛡️ Safety Tips

1. **Always inspect first** - Run SELECT queries before DELETE
2. **Start small** - Delete one package first to test
3. **Use WHERE clauses** - Be specific about what to delete
4. **Backup if needed** - Export tables as CSV before deleting
5. **Check foreign keys** - Understand what will cascade delete

---

## 🎯 Recommended Approach for Your Case

Since you mentioned all packages are test/auto-saved duplicates:

### Step-by-Step Safe Cleanup

```sql
-- 1. See what you have
SELECT 
    id, 
    title, 
    status, 
    created_at 
FROM transfer_packages 
ORDER BY created_at DESC;

-- 2. Count them
SELECT COUNT(*) FROM transfer_packages;

-- 3. If the count looks right and they're all test data, delete all
DELETE FROM transfer_packages;

-- 4. Verify (should return 0)
SELECT COUNT(*) FROM transfer_packages;

-- 5. Check related tables (should all be 0)
SELECT COUNT(*) FROM transfer_package_vehicles;
SELECT COUNT(*) FROM transfer_hourly_pricing;
SELECT COUNT(*) FROM transfer_point_to_point_pricing;
```

---

## 📊 Database Foreign Key Cascade

When you delete a `transfer_packages` record, these will **automatically** delete:

```
transfer_packages (deleted)
  ↓
  ├─ transfer_package_images (auto-deleted)
  ├─ transfer_package_vehicles (auto-deleted)
  │   └─ transfer_vehicle_images (auto-deleted)
  ├─ transfer_package_stops (auto-deleted)
  ├─ transfer_additional_services (auto-deleted)
  ├─ transfer_hourly_pricing (auto-deleted)
  └─ transfer_point_to_point_pricing (auto-deleted)
```

**You only need to delete from `transfer_packages`** - everything else cascades!

---

## 🚨 Troubleshooting

### "Permission denied"
- You might not have delete permissions
- Make sure you're logged in as the owner or service role

### "Foreign key constraint violation"
- This shouldn't happen with CASCADE configured
- Check if RLS policies are blocking the cascade

### "Too many rows to delete"
- Add a LIMIT if you have thousands of records:
```sql
DELETE FROM transfer_packages 
WHERE id IN (
    SELECT id FROM transfer_packages LIMIT 100
);
```

---

## ✅ After Cleanup

Once cleaned:
1. ✅ Database is fresh
2. ✅ No duplicate packages
3. ✅ No test data
4. ✅ Ready to create real packages

**Next:** Test creating a new transfer package to make sure everything works!

---

## 📞 Need Help?

If you're unsure about any of these steps:
1. Start with the inspection queries (STEP 1)
2. Share the results
3. We can determine the best cleanup approach together

**Remember:** The cleanup script (`cleanup-transfer-packages.sql`) has all these queries ready to copy-paste!

