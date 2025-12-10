# Phase 2: Use EC2 Instance Connect (Easiest Method!)

## ✅ No SSM Setup Needed!

**EC2 Instance Connect** works immediately - no IAM roles, no SSH keys, no waiting!

---

## 🚀 Connect Now (Takes 30 Seconds)

### **Step 1: Open EC2 Console**
- Go to: https://console.aws.amazon.com/ec2/
- Find instance: **migration-bastion** (or search `i-0cf90a4dc4f39debd`)

### **Step 2: Connect via EC2 Instance Connect**
1. Select the instance
2. Click **"Connect"** button
3. Go to **"EC2 Instance Connect"** tab (NOT Session Manager)
4. Click **"Connect"**
5. Browser terminal opens immediately! ✅

### **Step 3: Run Import Commands**

Copy and paste these commands one by one:

```bash
# Download SQL files
aws s3 cp s3://travel-app-storage-1769/migration/supabase_schema.sql /tmp/
aws s3 cp s3://travel-app-storage-1769/migration/supabase_data.sql /tmp/

# Set password
export PGPASSWORD='ju3vrLHJUW8PqDG4'

# Test connection first
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --command="SELECT NOW();"
```

**If connection works, continue:**

```bash
# Import schema
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=/tmp/supabase_schema.sql
```

```bash
# Import data
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=/tmp/supabase_data.sql
```

```bash
# Verify migration
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --command="SELECT 'users' as table_name, COUNT(*) FROM users UNION ALL SELECT 'activity_packages', COUNT(*) FROM activity_packages UNION ALL SELECT 'transfer_packages', COUNT(*) FROM transfer_packages UNION ALL SELECT 'multi_city_packages', COUNT(*) FROM multi_city_packages;"
```

---

## ✅ Expected Results

After successful import:
- ✅ Tables created
- ✅ Data inserted (433 rows)
- ✅ Verification shows:
  - users: 12 rows
  - activity_packages: 42 rows
  - transfer_packages: 27 rows
  - multi_city_packages: 14 rows

---

## 🎯 Why EC2 Instance Connect?

- ✅ Works immediately (no setup)
- ✅ No SSH keys needed
- ✅ No IAM roles needed
- ✅ Browser-based terminal
- ✅ Secure (temporary key pair)

---

## 🧹 After Import: Cleanup

1. **Delete EC2 instance**:
   ```bash
   aws ec2 terminate-instances --instance-ids i-0cf90a4dc4f39debd
   ```

2. **Make RDS private**:
   ```bash
   aws rds modify-db-instance \
     --db-instance-identifier travel-app-db \
     --no-publicly-accessible \
     --apply-immediately
   ```

---

**Go to EC2 Console → Connect → EC2 Instance Connect → Connect → Run import commands!** 🚀

**This method works immediately - no waiting!** ✅

