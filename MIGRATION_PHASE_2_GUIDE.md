# Phase 2 – Database Migration (Supabase ➜ AWS RDS)

This guide walks you through exporting the existing Supabase database, importing it into the new AWS RDS PostgreSQL instance, and updating the application configuration.

> **Current infra recap**
> - RDS Instance ID: `travel-app-db`
> - Username: `postgres`
> - Password: `ju3vrLHJUW8PqDG4`
> - Security Group (RDS): `sg-0351956ce61a8d1f1`
> - S3 Bucket: `travel-app-storage-1769`

---

## 1. Pre-check: make sure RDS is ready

```powershell
# Check status (wait for "available")
aws rds describe-db-instances `
  --db-instance-identifier travel-app-db `
  --query "DBInstances[0].DBInstanceStatus" --output text

# Get endpoint once available
aws rds describe-db-instances `
  --db-instance-identifier travel-app-db `
  --query "DBInstances[0].Endpoint.Address" --output text
```

Save the endpoint (looks like `travel-app-db.xxxxxx.us-east-1.rds.amazonaws.com`) so you can connect later.

---

## 2. Install PostgreSQL client tools

You need `psql` and `pg_dump` locally.

### Option A – Winget (Windows 10/11)
```powershell
winget install PostgreSQL.PostgreSQL
```

### Option B – Download installer
1. Go to https://www.postgresql.org/download/windows/
2. Download the latest PostgreSQL installer (include command-line tools)
3. Add `C:\Program Files\PostgreSQL\<version>\bin` to your `PATH`

Verify:
```powershell
psql --version
pg_dump --version
```

---

## 3. (Optional) Allow your IP to reach RDS

The RDS security group currently only allows traffic from inside the VPC. To import data from your laptop, temporarily allow your public IP:

```powershell
# Get your current public IP
$myIp = (Invoke-RestMethod -Uri "https://checkip.amazonaws.com/").Trim()

# Allow access to port 5432 from your IP
aws ec2 authorize-security-group-ingress `
  --group-id sg-0351956ce61a8d1f1 `
  --protocol tcp --port 5432 --cidr "$myIp/32"
```

> **Remember to remove this rule after the migration:**
> ```powershell
> aws ec2 revoke-security-group-ingress `
>   --group-id sg-0351956ce61a8d1f1 `
>   --protocol tcp --port 5432 --cidr "$myIp/32"
> ```

If you prefer not to expose RDS publicly, you can spin up a temporary EC2 instance in the VPC and run the import from there.

---

## 4. Export the Supabase database

You need the Supabase Postgres connection details from the Supabase dashboard:

- **Host**: `db.<project-ref>.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: shown in dashboard (also in `env_temp.txt`)

### 4.1 Export schema (structure only)
```powershell
$env:PGPASSWORD = "<SUPABASE_DB_PASSWORD>"
pg_dump `
  --host <SUPABASE_DB_HOST> `
  --port 5432 `
  --username postgres `
  --dbname postgres `
  --schema-only `
  --no-owner --no-acl `
  --file supabase_schema.sql
```

### 4.2 Export data
```powershell
pg_dump `
  --host <SUPABASE_DB_HOST> `
  --port 5432 `
  --username postgres `
  --dbname postgres `
  --data-only `
  --no-owner --no-acl `
  --file supabase_data.sql
```

Tips:
- Keep both files in the project root (`supabase_schema.sql`, `supabase_data.sql`)
- If the dump is large, add `--compress=9` to reduce file size

---

## 5. Import into RDS

Once RDS is available and you have the endpoint:

### 5.1 Set RDS password environment variable
```powershell
$env:PGPASSWORD = "ju3vrLHJUW8PqDG4"
$rdsHost = "<RDS_ENDPOINT_FROM_STEP_1>"
```

### 5.2 Import schema
```powershell
psql `
  --host $rdsHost `
  --port 5432 `
  --username postgres `
  --dbname postgres `
  --file supabase_schema.sql
```

### 5.3 Import data
```powershell
psql `
  --host $rdsHost `
  --port 5432 `
  --username postgres `
  --dbname postgres `
  --file supabase_data.sql
```

### 5.4 Run post-import checks
```sql
-- From inside psql
\dt

SELECT table_name, table_rows
FROM (
  SELECT 'users' AS table_name, COUNT(*)::text AS table_rows FROM users
  UNION ALL
  SELECT 'activity_packages', COUNT(*)::text FROM activity_packages
  UNION ALL
  SELECT 'transfer_packages', COUNT(*)::text FROM transfer_packages
  UNION ALL
  SELECT 'multi_city_packages', COUNT(*)::text FROM multi_city_packages
) q;

SELECT * FROM pg_policies;
```

If you rely on extensions (e.g., `uuid-ossp`), enable them:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 5.5 Reset sequences (optional but recommended)
```sql
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format('SELECT setval(%L, (SELECT MAX(id) FROM %I), true);',
      rec.sequence_name, replace(rec.sequence_name, '_id_seq', ''));
  END LOOP;
END$$;
```

---

## 6. Clean up security group rule (if added)

```powershell
aws ec2 revoke-security-group-ingress `
  --group-id sg-0351956ce61a8d1f1 `
  --protocol tcp --port 5432 `
  --cidr "$myIp/32"
```

---

## 7. Update `.env.local`

After import succeeds, update `.env.local` with the real RDS endpoint:
```env
RDS_HOSTNAME=<RDS_ENDPOINT>
RDS_PORT=5432
RDS_DATABASE=postgres
RDS_USERNAME=postgres
RDS_PASSWORD=ju3vrLHJUW8PqDG4
```

Run `npm run dev` locally and confirm the app connects to RDS (database still empty? check logs).

---

## 8. Verification checklist

- [ ] RDS status is `available`
- [ ] Schema imported without errors
- [ ] Data imported (row counts match Supabase)
- [ ] Sequences reset (no duplicate key issues)
- [ ] `.env.local` updated with RDS endpoint
- [ ] Temporary SG rule removed
- [ ] Supabase dumps stored safely (backups)

---

## 9. Next steps

1. Run application locally against RDS to ensure everything works
2. Proceed to **Phase 3 (Authentication – Cognito)**
3. Keep Supabase running until AWS stack is fully validated

Need help? Check `AWS_MIGRATION_STEP_BY_STEP.md` (Phase 2), or ask. 🚀

