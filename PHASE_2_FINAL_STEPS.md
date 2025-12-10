# Phase 2: Final Steps - Complete Import

## ✅ Current Status

- ✅ EC2 Bastion instance created: `i-0cf90a4dc4f39debd`
- ✅ Instance is in same VPC as RDS (can connect)
- ✅ SQL files will be auto-downloaded to `/tmp/` on instance
- ✅ PostgreSQL client will be installed automatically

---

## 🚀 Complete Import via EC2 Instance

### **Method 1: AWS Systems Manager Session Manager (Recommended - No SSH Keys)**

1. **Go to EC2 Console**
   - https://console.aws.amazon.com/ec2/
   - Find instance: **migration-bastion**

2. **Connect via Session Manager**
   - Select instance → **Connect** → **Session Manager** tab → **Connect**
   - This opens a browser-based terminal (no SSH keys needed!)

3. **Run Import Commands**

Once connected, run:

```bash
# Files should already be in /tmp/ (downloaded by user-data)
# If not, download them:
aws s3 cp s3://travel-app-storage-1769/migration/supabase_schema.sql /tmp/
aws s3 cp s3://travel-app-storage-1769/migration/supabase_data.sql /tmp/

# Set password
export PGPASSWORD='ju3vrLHJUW8PqDG4'

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
     --command="SELECT 'users' as table_name, COUNT(*) FROM users UNION ALL SELECT 'activity_packages', COUNT(*) FROM activity_packages;"
```

---

### **Method 2: Direct from CloudShell (If Connection Works Now)**

Sometimes connections work after a few minutes. Try again in CloudShell:

```bash
export PGPASSWORD='ju3vrLHJUW8PqDG4'
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --command="SELECT NOW();"
```

If this works, proceed with the import commands.

---

## ✅ After Successful Import

1. **Verify data** - Check row counts match
2. **Update .env.local** with RDS credentials
3. **Delete EC2 instance** (to save costs):
   ```bash
   aws ec2 terminate-instances --instance-ids i-0cf90a4dc4f39debd
   ```
4. **Make RDS private again** (for security):
   ```bash
   aws rds modify-db-instance \
     --db-instance-identifier travel-app-db \
     --no-publicly-accessible \
     --apply-immediately
   ```

---

## 🎯 Recommended: Use Session Manager

**Go to EC2 Console → Find "migration-bastion" → Connect → Session Manager → Connect**

Then run the import commands above!

---

**EC2 instance is ready. Connect via Session Manager and run the import! 🚀**

