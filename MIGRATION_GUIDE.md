# Database Migration Guide

This guide will help you run the phone authentication database migration.

## Prerequisites

1. **Database Connection**: Ensure your `.env.local` file has the correct RDS credentials:
   ```bash
   RDS_HOST=your_rds_host.rds.amazonaws.com
   RDS_PORT=5432
   RDS_DB=postgres
   RDS_USER=postgres
   RDS_PASSWORD=your_password
   ```

2. **Database Access**: Your RDS instance must be accessible from your local machine (or run this from an EC2 instance/VPC with access).

## Option 1: Using Node.js Script (Recommended)

### Step 1: Check Current Migration Status

```bash
npm run migrate:check
```

This will show you which tables and columns already exist in your database.

### Step 2: Run the Migration

```bash
npm run migrate
```

This script will:
- Connect to your RDS database using the same connection logic as your app
- Execute all SQL statements from `migrations/001_phone_auth_schema.sql`
- Show progress for each statement
- Handle errors gracefully (skips "already exists" errors)
- Provide a summary at the end

### What Gets Created

The migration will create:

1. **Users Table Updates**:
   - `country_code` (VARCHAR)
   - `phone_number` (VARCHAR)
   - `phone_verified` (BOOLEAN)
   - `email_verified` (BOOLEAN)
   - `auth_method` (VARCHAR)
   - `profile_completion_percentage` (INTEGER)
   - `onboarding_completed` (BOOLEAN)

2. **New Tables**:
   - `otp_codes` - Stores OTP codes with expiration
   - `account_details` - User profile information
   - `brand_details` - Company/brand information
   - `business_details` - Business operational details
   - `documents` - KYC document storage
   - `otp_rate_limits` - Rate limiting for OTP requests

3. **Functions**:
   - `calculate_profile_completion()` - Calculates profile completion percentage
   - `update_updated_at_column()` - Auto-updates timestamps

4. **Indexes**: For performance optimization

## Option 2: Using psql (Alternative)

If you prefer using `psql` directly:

```bash
# On Windows (PowerShell)
$env:PGPASSWORD="your_password"
psql -h your_rds_host.rds.amazonaws.com -U postgres -d postgres -f migrations/001_phone_auth_schema.sql

# On Linux/Mac
PGPASSWORD=your_password psql -h your_rds_host.rds.amazonaws.com -U postgres -d postgres -f migrations/001_phone_auth_schema.sql
```

## Option 3: Using Database GUI Tool

1. Open your database management tool (pgAdmin, DBeaver, etc.)
2. Connect to your RDS instance
3. Open the SQL file: `migrations/001_phone_auth_schema.sql`
4. Execute the entire script

## Verification

After running the migration, verify it worked:

```bash
npm run migrate:check
```

Or manually check in your database:

```sql
-- Check users table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('country_code', 'phone_number', 'phone_verified');

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('otp_codes', 'account_details', 'brand_details', 'business_details', 'documents');
```

## Troubleshooting

### Error: "Connection refused"
- Check your RDS security group allows connections from your IP
- Verify RDS_HOST, RDS_PORT are correct
- Ensure RDS instance is running

### Error: "Authentication failed"
- Verify RDS_USER and RDS_PASSWORD are correct
- Check if the user has necessary permissions

### Error: "Relation already exists"
- This is normal if you've run the migration before
- The script handles these errors gracefully
- Use `IF NOT EXISTS` clauses in the SQL

### Error: "Permission denied"
- Ensure your database user has CREATE TABLE, ALTER TABLE permissions
- You may need to run as a superuser or grant permissions

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Remove new tables
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS business_details CASCADE;
DROP TABLE IF EXISTS brand_details CASCADE;
DROP TABLE IF EXISTS account_details CASCADE;
DROP TABLE IF EXISTS otp_rate_limits CASCADE;
DROP TABLE IF EXISTS otp_codes CASCADE;

-- Remove functions
DROP FUNCTION IF EXISTS calculate_profile_completion(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Remove columns from users table
ALTER TABLE users 
DROP COLUMN IF EXISTS country_code,
DROP COLUMN IF EXISTS phone_number,
DROP COLUMN IF EXISTS phone_verified,
DROP COLUMN IF EXISTS email_verified,
DROP COLUMN IF EXISTS auth_method,
DROP COLUMN IF EXISTS profile_completion_percentage,
DROP COLUMN IF EXISTS onboarding_completed;

-- Remove indexes
DROP INDEX IF EXISTS idx_users_phone;
DROP INDEX IF EXISTS idx_users_phone_unique;
```

## Next Steps

After successful migration:

1. ✅ Verify migration status: `npm run migrate:check`
2. ✅ Configure AWS services (SNS, SES, S3, reCAPTCHA)
3. ✅ Add environment variables from `.env.example.phone-auth`
4. ✅ Test the phone login/signup flow

## Support

If you encounter issues:
1. Check the error message in the terminal
2. Verify your database connection settings
3. Ensure you have the necessary permissions
4. Review the migration SQL file for syntax issues

