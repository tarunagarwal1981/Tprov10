# Fix: Lead Purchases ID Column Missing DEFAULT

## Issue Summary

When trying to purchase a lead on the travel agent dashboard, the operation fails with the following error:

```
null value in column "id" of relation "lead_purchases" violates not-null constraint
```

## Root Cause

The `lead_purchases` table in AWS RDS was created without a `DEFAULT` value for the `id` column. The original Supabase schema had:

```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
```

But the AWS migration script (`create-lead-purchases-table.ts`) created it as:

```sql
id UUID PRIMARY KEY
```

When the application tries to INSERT a new purchase record without specifying an `id`, PostgreSQL expects a value but there's no default to generate one, causing the NOT NULL constraint violation.

## Solution

### Immediate Fix (Run This First)

Run the fix script to add the DEFAULT to the existing table:

```bash
npx ts-node aws-migration-scripts/fix-lead-purchases-id-default.ts
```

This script will:
1. Enable the `pgcrypto` extension (or `uuid-ossp` as fallback) for UUID generation
2. Add `DEFAULT gen_random_uuid()` to the `id` column
3. Verify the change was applied correctly

### Prevention

The migration scripts have been updated to include the DEFAULT for future table creations:
- ✅ `aws-migration-scripts/create-lead-purchases-table.ts` - Updated
- ✅ `aws-migration-scripts/migrate-lead-purchases.ts` - Updated

## Technical Details

### UUID Generation Functions

PostgreSQL supports multiple ways to generate UUIDs:

1. **`gen_random_uuid()`** - Available in PostgreSQL 13+ or via `pgcrypto` extension
   - Preferred method (simpler, no extension needed in PG 13+)
   
2. **`uuid_generate_v4()`** - Requires `uuid-ossp` extension
   - Fallback if `gen_random_uuid()` is not available

The fix script tries `gen_random_uuid()` first, then falls back to `uuid_generate_v4()` if needed.

### CloudWatch Logs Analysis

The error logs showed:
- The INSERT query was executed correctly
- The error occurred because `id` was `null` in the failing row
- The table structure didn't have a DEFAULT to auto-generate the UUID

## Verification

After running the fix script, you can verify the fix by:

1. **Check the column default:**
   ```sql
   SELECT column_default 
   FROM information_schema.columns 
   WHERE table_name = 'lead_purchases' AND column_name = 'id';
   ```
   Should return something like: `gen_random_uuid()` or `uuid_generate_v4()`

2. **Test a purchase:**
   - Try purchasing a lead from the travel agent dashboard
   - The purchase should complete successfully without errors

## Related Files

- `aws-migration-scripts/fix-lead-purchases-id-default.ts` - Fix script
- `aws-migration-scripts/create-lead-purchases-table.ts` - Updated migration script
- `aws-migration-scripts/migrate-lead-purchases.ts` - Updated migration script
- `src/lib/services/marketplaceService.ts` - Purchase lead service (no changes needed)
- `src/app/api/marketplace/purchase/route.ts` - Purchase API endpoint (no changes needed)

## Notes

- This issue only affects the AWS RDS database. The Supabase database had the correct schema.
- The feature was working before migration because Supabase had the DEFAULT configured.
- No application code changes are needed - the fix is purely at the database schema level.

