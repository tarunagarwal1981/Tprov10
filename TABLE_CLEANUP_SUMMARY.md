# 🗄️ Database Tables - Quick Summary

## Current State

### Activity Packages ✅
**Status: CLEAN - All 7 tables are actively used**

```
activity_packages (main table)
├── activity_package_images
├── activity_package_time_slots
├── activity_package_variants
├── activity_package_faqs
└── Pricing Tables:
    ├── activity_ticket_only_pricing
    └── activity_ticket_with_transfer_pricing
```

---

### Transfer Packages ⚠️
**Status: NEEDS CLEANUP - 4 unused tables**

#### ✅ **KEEP (7 tables)**
```
transfer_packages (main table)
├── transfer_package_images
├── transfer_package_vehicles
├── transfer_package_stops
├── transfer_additional_services
└── Pricing Tables:
    ├── transfer_hourly_pricing
    └── transfer_point_to_point_pricing
```

#### ❌ **REMOVE (4 tables)**
```
❌ transfer_vehicle_images (not used in code)
❌ transfer_pricing_rules (not implemented)
❌ transfer_time_slots (not used)
❌ transfer_booking_restrictions (not implemented)
```

---

## Quick Cleanup

### Option 1: Run SQL Script
```bash
# In Supabase SQL Editor, run:
cleanup-unused-tables.sql
```

### Option 2: Manual Cleanup
```sql
DROP TABLE IF EXISTS transfer_pricing_rules CASCADE;
DROP TABLE IF EXISTS transfer_vehicle_images CASCADE;
DROP TABLE IF EXISTS transfer_time_slots CASCADE;
DROP TABLE IF EXISTS transfer_booking_restrictions CASCADE;
```

---

## Impact Assessment

### Before Cleanup
- **Total Tables:** 18
- **Activity Tables:** 7 ✅
- **Transfer Tables:** 11 ⚠️
- **Unused Tables:** 4 ❌

### After Cleanup
- **Total Tables:** 14
- **Activity Tables:** 7 ✅
- **Transfer Tables:** 7 ✅
- **Unused Tables:** 0 ✅

---

## Benefits

- ✅ **Cleaner database schema**
- ✅ **Easier maintenance**
- ✅ **No breaking changes** (unused tables only)
- ✅ **Better performance** (fewer tables to manage)
- ✅ **Reduced confusion** (only active tables remain)

---

## Files to Review

### SQL Schema Files
- ✅ `supabase-setup.sql` - Activity tables (all good)
- ⚠️ `create-transfer-packages-schema.sql` - Contains unused table definitions
- ✅ `create-transfer-pricing-options-schema.sql` - Active pricing tables
- ✅ `create-activity-pricing-options-schema.sql` - Activity pricing tables

### Service Files
- ✅ `src/lib/supabase/activity-packages.ts` - Uses all activity tables
- ✅ `src/lib/supabase/transfer-packages.ts` - Uses 7 transfer tables only
- ✅ `src/lib/supabase/activity-pricing-options.ts` - Uses pricing tables

---

## Next Steps

1. **Backup database** before cleanup
2. **Run cleanup script**: `cleanup-unused-tables.sql`
3. **Verify results** in Supabase dashboard
4. **Update documentation** as needed

---

**Ready to clean up?**
👉 See full details in `DATABASE_TABLES_AUDIT.md`
👉 Run cleanup script: `cleanup-unused-tables.sql`

