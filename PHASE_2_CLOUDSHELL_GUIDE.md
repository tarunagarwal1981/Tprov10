# Phase 2: Complete Import Using AWS CloudShell

## ✅ What's Done

- ✅ Data exported from Supabase (31 tables, 433 rows)
- ✅ SQL files created: `supabase_schema.sql` and `supabase_data.sql`
- ✅ Files uploaded to S3: `s3://travel-app-storage-1769/migration/`
- ✅ RDS is publicly accessible
- ✅ Security group allows connections

---

## 🚀 Complete Import Using CloudShell

### **Step 1: Open AWS CloudShell**

1. Go to: https://console.aws.amazon.com/cloudshell
2. Click the **CloudShell** icon in the AWS Console (top right)
3. Wait for CloudShell to initialize (takes ~30 seconds)

### **Step 2: Run Import Script**

Copy and paste this entire command into CloudShell:

```bash
# Download and run the import script
curl -o import.sh https://raw.githubusercontent.com/your-repo/aws-migration-scripts/cloudshell-import.sh
# OR manually copy the script content below

# Set variables
export RDS_ENDPOINT="travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com"
export RDS_USER="postgres"
export RDS_PASSWORD="ju3vrLHJUW8PqDG4"
export RDS_DATABASE="postgres"
export S3_BUCKET="travel-app-storage-1769"

# Install PostgreSQL client
sudo yum install -y postgresql15

# Download SQL files from S3
aws s3 cp s3://${S3_BUCKET}/migration/supabase_schema.sql .
aws s3 cp s3://${S3_BUCKET}/migration/supabase_data.sql .

# Set password
export PGPASSWORD="${RDS_PASSWORD}"

# Import schema
echo "📥 Importing schema..."
psql --host=${RDS_ENDPOINT} --port=5432 --username=${RDS_USER} --dbname=${RDS_DATABASE} --file=supabase_schema.sql

# Import data
echo "📥 Importing data..."
psql --host=${RDS_ENDPOINT} --port=5432 --username=${RDS_USER} --dbname=${RDS_DATABASE} --file=supabase_data.sql

# Verify
echo "🔍 Verifying..."
psql --host=${RDS_ENDPOINT} --port=5432 --username=${RDS_USER} --dbname=${RDS_DATABASE} --command="SELECT 'users' as table, COUNT(*) FROM users;"
```

---

## 📋 Manual Steps (If Script Doesn't Work)

### **1. Download Files from S3**

```bash
aws s3 cp s3://travel-app-storage-1769/migration/supabase_schema.sql .
aws s3 cp s3://travel-app-storage-1769/migration/supabase_data.sql .
```

### **2. Install PostgreSQL Client**

```bash
sudo yum install -y postgresql15
```

### **3. Import Schema**

```bash
export PGPASSWORD='ju3vrLHJUW8PqDG4'
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=supabase_schema.sql
```

### **4. Import Data**

```bash
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=supabase_data.sql
```

### **5. Verify**

```bash
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --command="SELECT 'users' as table_name, COUNT(*) FROM users UNION ALL SELECT 'activity_packages', COUNT(*) FROM activity_packages;"
```

---

## ✅ Expected Output

After successful import, you should see:
- Schema imported (CREATE TABLE statements)
- Data imported (INSERT statements)
- Verification showing row counts:
  - users: 12 rows
  - activity_packages: 42 rows
  - transfer_packages: 27 rows
  - multi_city_packages: 14 rows

---

## 🔒 After Import: Secure RDS

Once import is complete, make RDS private again:

```bash
aws rds modify-db-instance \
  --db-instance-identifier travel-app-db \
  --no-publicly-accessible \
  --apply-immediately
```

---

## 📝 Update .env.local

After successful import, update your `.env.local`:

```env
RDS_HOSTNAME=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DATABASE=postgres
RDS_USERNAME=postgres
RDS_PASSWORD=ju3vrLHJUW8PqDG4
```

---

**Ready to import? Open CloudShell and run the commands above! 🚀**

