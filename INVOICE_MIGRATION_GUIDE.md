# Invoice Enhancement Migration Guide

This guide will help you run the invoice enhancement database migration to add new invoice fields and lead linking.

## Prerequisites

1. **Database Connection**: Ensure your `.env.local` file has the correct RDS credentials:
   ```bash
   RDS_HOSTNAME=your_rds_host.rds.amazonaws.com
   RDS_PORT=5432
   RDS_DATABASE=postgres
   RDS_USERNAME=postgres
   RDS_PASSWORD=your_password
   ```

   **Alternative variable names** (all supported):
   - `RDS_HOST` or `RDS_HOSTNAME`
   - `RDS_USER` or `RDS_USERNAME`
   - `RDS_DB` or `RDS_DATABASE`
   - `RDS_PASSWORD` (required)
   - `RDS_PORT` (optional, defaults to 5432)

2. **Database Access**: Your RDS instance must be accessible from your local machine (or run this from an EC2 instance/VPC with access).

3. **PostgreSQL Client**: For bash script method, `psql` must be installed.

## Option 1: Using Node.js Script (Recommended)

### Step 1: Verify Environment Variables

Make sure your `.env.local` file contains the RDS credentials:

```bash
# Check if .env.local exists and has required variables
cat .env.local | grep RDS
```

### Step 2: Run the Migration

```bash
npm run migrate:invoice
```

This script will:
- Connect to your RDS database using credentials from `.env.local`
- Execute all SQL statements from `supabase/migrations/028_add_enhanced_invoice_fields.sql`
- Show progress for each statement
- Handle errors gracefully (skips "already exists" errors)
- Provide a summary at the end

## Option 2: Using Bash Script

### Step 1: Make Script Executable (if not already)

```bash
chmod +x run-invoice-migration.sh
```

### Step 2: Run the Migration

```bash
./run-invoice-migration.sh
```

**Note**: This method requires `psql` to be installed:
- macOS: `brew install postgresql`
- Ubuntu: `sudo apt-get install postgresql-client`
- Windows: Download from https://www.postgresql.org/download/windows/

## Option 3: Using psql Directly

If you prefer using `psql` directly:

```bash
# Set environment variables
export PGPASSWORD="your_password"

# Run migration
psql -h your_rds_host.rds.amazonaws.com \
     -p 5432 \
     -U postgres \
     -d postgres \
     -f supabase/migrations/028_add_enhanced_invoice_fields.sql
```

## What Gets Created/Modified

The migration will:

1. **Add `lead_id` column** to `invoices` table:
   - Links invoices directly to leads
   - Foreign key constraint to `leads(id)`
   - Creates index for faster queries

2. **Add Enhanced Invoice Fields**:
   - `billing_address` (JSONB) - Customer billing address
   - `tax_rate` (DECIMAL) - Tax percentage
   - `tax_amount` (DECIMAL) - Calculated tax amount
   - `subtotal` (DECIMAL) - Amount before tax
   - `payment_terms` (TEXT) - Payment terms (e.g., "Net 30")
   - `notes` (TEXT) - Additional notes
   - `currency` (TEXT) - Currency code (default: 'USD')
   - `line_items` (JSONB) - Array of invoice line items

3. **Update Existing Data**:
   - Backfills `lead_id` for existing invoices from their associated itineraries

## Verification

After running the migration, you can verify the changes:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
  AND column_name IN ('lead_id', 'billing_address', 'tax_rate', 'subtotal', 'payment_terms', 'notes', 'currency', 'line_items');

-- Check if index exists
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'invoices' 
  AND indexname = 'idx_invoices_lead_id';

-- Verify existing invoices have lead_id
SELECT id, invoice_number, itinerary_id, lead_id 
FROM invoices 
LIMIT 10;
```

## Troubleshooting

### Error: "Missing RDS configuration"

**Solution**: Ensure `.env.local` file exists and contains:
- `RDS_HOSTNAME` or `RDS_HOST`
- `RDS_USERNAME` or `RDS_USER`
- `RDS_PASSWORD`

### Error: "Connection refused" or "Timeout"

**Solutions**:
1. Check RDS security group allows your IP address
2. Verify RDS endpoint is correct
3. Check network connectivity
4. Ensure RDS instance is running

### Error: "Permission denied" or "Access denied"

**Solution**: Verify database user has `ALTER TABLE` permissions:
```sql
-- Check user permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'invoices';
```

### Error: "Column already exists"

**Solution**: This is expected if migration was partially run before. The migration uses `IF NOT EXISTS` clauses, so it's safe to re-run.

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- Remove new columns (WARNING: This will delete data in those columns)
ALTER TABLE invoices DROP COLUMN IF EXISTS lead_id;
ALTER TABLE invoices DROP COLUMN IF EXISTS billing_address;
ALTER TABLE invoices DROP COLUMN IF EXISTS tax_rate;
ALTER TABLE invoices DROP COLUMN IF EXISTS tax_amount;
ALTER TABLE invoices DROP COLUMN IF EXISTS subtotal;
ALTER TABLE invoices DROP COLUMN IF EXISTS payment_terms;
ALTER TABLE invoices DROP COLUMN IF EXISTS notes;
ALTER TABLE invoices DROP COLUMN IF EXISTS currency;
ALTER TABLE invoices DROP COLUMN IF EXISTS line_items;

-- Drop index
DROP INDEX IF EXISTS idx_invoices_lead_id;
```

## Next Steps

After successful migration:

1. ✅ Verify the build: `npm run build`
2. ✅ Test invoice creation with new fields
3. ✅ Test invoice editing
4. ✅ Verify PDF generation includes new fields
5. ✅ Test invoice linking to leads

## Support

If you encounter issues:
1. Check the migration logs for specific error messages
2. Verify RDS credentials are correct
3. Ensure database user has necessary permissions
4. Check RDS security group settings

