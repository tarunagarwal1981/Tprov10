# Phase 2: S3 Permissions Fixed ✅

## 🔧 Problem Fixed

The EC2 instance didn't have permission to read from S3 bucket. I've added S3 read permissions to the IAM role.

---

## ✅ Solution Applied

Added S3 read policy to `SSMInstanceRole`:
- ✅ `s3:GetObject` - Read files from bucket
- ✅ `s3:ListBucket` - List bucket contents
- ✅ Applied to: `travel-app-storage-1769` bucket

---

## 🚀 Try Again Now!

Go back to **EC2 Instance Connect** and run:

```bash
# Download files (should work now!)
aws s3 cp s3://travel-app-storage-1769/migration/supabase_schema.sql /tmp/
aws s3 cp s3://travel-app-storage-1769/migration/supabase_data.sql /tmp/

# Set password
export PGPASSWORD='ju3vrLHJUW8PqDG4'

# Test connection
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --command="SELECT NOW();"
```

**If connection works, continue with import:**

```bash
# Import schema
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=/tmp/supabase_schema.sql

# Import data
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=/tmp/supabase_data.sql

# Verify
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --command="SELECT 'users' as table_name, COUNT(*) FROM users UNION ALL SELECT 'activity_packages', COUNT(*) FROM activity_packages UNION ALL SELECT 'transfer_packages', COUNT(*) FROM transfer_packages UNION ALL SELECT 'multi_city_packages', COUNT(*) FROM multi_city_packages;"
```

---

## ⚠️ Note

If you still get 403 errors, wait 10-20 seconds for IAM permissions to propagate, then try again.

---

**Go back to EC2 Instance Connect and try the S3 copy commands again!** 🚀

