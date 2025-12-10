# Database Migration Using DBeaver

DBeaver is the easiest way to run the migration if you have it installed.

## Step 1: Connect to Your RDS Database

1. Open DBeaver
2. Click **New Database Connection** (or `Ctrl+Shift+N`)
3. Select **PostgreSQL**
4. Enter connection details:
   - **Host**: `travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **Username**: `postgres`
   - **Password**: `ju3vrLHJUW8PqDG4`
5. Click **Test Connection**
   - If it fails, you may need to:
     - Enable SSL (check "Use SSL" in connection settings)
     - Update RDS Security Group to allow your IP (temporary)
6. Click **Finish**

## Step 2: Open the Migration SQL File

1. In DBeaver, go to **File** → **Open File** (or `Ctrl+O`)
2. Navigate to: `migrations/001_phone_auth_schema.sql`
3. The SQL file will open in a SQL editor tab

## Step 3: Execute the Migration

### Option A: Execute Entire Script (Recommended)

1. Make sure you're connected to the correct database (check the connection name in the SQL editor)
2. Click **Execute SQL Script** button (or press `Ctrl+Alt+X`)
   - This will execute all statements in the file
3. Review the results in the **Scripts** tab at the bottom
4. Check for any errors (they'll be highlighted in red)

### Option B: Execute Statement by Statement

1. Place cursor on a statement
2. Press `Ctrl+Enter` to execute that statement
3. Review the result
4. Move to next statement

## Step 4: Verify Migration

Run these queries to verify everything was created:

```sql
-- Check users table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('country_code', 'phone_number', 'phone_verified', 'email_verified', 'auth_method', 'profile_completion_percentage', 'onboarding_completed')
ORDER BY column_name;

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('otp_codes', 'account_details', 'brand_details', 'business_details', 'documents', 'otp_rate_limits')
ORDER BY table_name;

-- Check functions exist
SELECT proname 
FROM pg_proc 
WHERE proname IN ('calculate_profile_completion', 'update_updated_at_column');
```

## Troubleshooting

### Connection Issues

**Error: Connection timeout**
- Your RDS security group may not allow connections from your IP
- Solution: Temporarily add your IP to the RDS security group inbound rules
  - Go to AWS RDS Console → Your instance → Security groups
  - Edit inbound rules
  - Add: PostgreSQL (5432) from your IP
  - Save and try again

**Error: SSL required**
- Enable SSL in DBeaver connection settings
- Go to connection properties → SSL tab
- Check "Use SSL" and "Allow SSL self-signed certificate"

### SQL Execution Errors

**Error: "already exists"**
- This is normal if you've run the migration before
- The migration uses `IF NOT EXISTS` clauses, so it's safe to run multiple times

**Error: "permission denied"**
- Your database user needs CREATE TABLE, ALTER TABLE permissions
- You may need to run as a superuser or grant permissions

## What Gets Created

The migration creates:

✅ **Users table updates**: 7 new columns for phone auth
✅ **6 new tables**: otp_codes, account_details, brand_details, business_details, documents, otp_rate_limits
✅ **2 functions**: calculate_profile_completion, update_updated_at_column
✅ **Multiple indexes**: For performance optimization
✅ **Triggers**: Auto-update timestamps

## After Migration

Once the migration is complete:

1. ✅ Verify all tables/columns exist (use verification queries above)
2. ✅ Configure AWS services (SNS, SES, S3, reCAPTCHA)
3. ✅ Add environment variables from `.env.example.phone-auth`
4. ✅ Test the phone login/signup flow

## Rollback (If Needed)

If you need to rollback, you can run this in DBeaver:

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

---

**That's it!** DBeaver makes this process much simpler than command-line tools.

