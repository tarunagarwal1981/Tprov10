# Database Migration Instructions

## Migration File Ready
✅ Migration file created: `supabase/migrations/021_restructure_time_slots_schema.sql`

## Connection Issue
The RDS instance appears to be in a VPC and not directly accessible from your local machine. Here are the options to run the migration:

---

## Option 1: Run via AWS Lambda (Recommended)

Since you have AWS credentials configured, you can create a Lambda function to run the migration:

### Step 1: Create Lambda Function
```bash
# The migration script is ready at: scripts/run-migration.js
# You can deploy this as a Lambda function
```

### Step 2: Run via Existing Lambda
If you have a Lambda function that can access RDS (like `travel-app-database-service`), you can invoke it to run the migration.

---

## Option 2: Run via EC2 Instance with RDS Access

If you have an EC2 instance in the same VPC as RDS:

1. **SSH into EC2 instance**
2. **Copy migration files**:
   ```bash
   scp supabase/migrations/021_restructure_time_slots_schema.sql ec2-user@your-ec2:/tmp/
   scp scripts/run-migration.js ec2-user@your-ec2:/tmp/
   scp .env.local ec2-user@your-ec2:/tmp/
   ```

3. **On EC2, run**:
   ```bash
   cd /tmp
   node run-migration.js
   ```

---

## Option 3: Use AWS Systems Manager Session Manager

If your EC2 instances have SSM agent:

1. **Start Session**:
   ```bash
   aws ssm start-session --target i-xxxxxxxxx
   ```

2. **Run migration** on the EC2 instance

---

## Option 4: Make RDS Publicly Accessible (Temporary)

⚠️ **Security Warning**: Only for development/testing

1. **Go to AWS RDS Console**
2. **Select your database**: `travel-app-db`
3. **Modify** → **Connectivity**
4. **Public access**: Enable (temporary)
5. **Security group**: Add inbound rule for your IP on port 5432
6. **Run migration locally**:
   ```bash
   node scripts/run-migration.js
   ```
7. **Disable public access** after migration

---

## Option 5: Use AWS RDS Data API (If Enabled)

If RDS Data API is enabled, you can use AWS SDK:

```javascript
const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');
// Execute migration SQL via Data API
```

---

## Quick Test: Verify Connection

Test if you can connect to RDS:

```bash
# Using Node.js script
node -e "
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({
  host: process.env.RDS_HOST,
  port: process.env.RDS_PORT,
  database: process.env.RDS_DB,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
});
pool.query('SELECT 1').then(() => {
  console.log('✅ Connection successful!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
});
"
```

---

## Migration SQL Content

The migration file updates the default value for `time_slots` JSONB column:

```sql
-- Updates default value from:
{
  "morning": {"time": "", "activities": [], "transfers": []},
  ...
}

-- To:
{
  "morning": {"time": "08:00", "title": "", "activityDescription": "", "transfer": ""},
  ...
}
```

**Note**: Existing data migration is handled automatically in application code (API routes and frontend).

---

## Recommended Approach

Since you're using AWS and have credentials configured:

1. **Use your existing Lambda function** (`travel-app-database-service`) to execute the migration
2. **Or create a one-time migration Lambda** that runs the SQL
3. **Or use EC2/SSM** if you have infrastructure access

The migration SQL is safe to run multiple times (uses `ALTER COLUMN SET DEFAULT` which is idempotent).
