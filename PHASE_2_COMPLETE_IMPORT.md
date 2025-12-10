# Phase 2: Complete Import - Final Instructions

## ✅ Everything is Ready!

- ✅ EC2 Instance: `i-0cf90a4dc4f39debd` (running)
- ✅ Public IP: `54.172.175.47`
- ✅ SQL files uploaded to S3
- ✅ Instance in same VPC as RDS (can connect)

---

## 🚀 Method 1: Connect via AWS Console (Easiest)

### **Step 1: Open EC2 Console**
- Go to: https://console.aws.amazon.com/ec2/
- Find instance: **migration-bastion** (or search for `i-0cf90a4dc4f39debd`)

### **Step 2: Connect via Session Manager**
1. Select the instance
2. Click **"Connect"** button
3. Go to **"Session Manager"** tab
4. Click **"Connect"**
5. Browser-based terminal opens!

### **Step 3: Run Import Commands**

Once connected, copy and paste these commands:

```bash
# Download files (if not already downloaded)
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

# If connection works, import schema
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
     --command="SELECT 'users' as table_name, COUNT(*) FROM users UNION ALL SELECT 'activity_packages', COUNT(*) FROM activity_packages UNION ALL SELECT 'transfer_packages', COUNT(*) FROM transfer_packages;"
```

---

## 🚀 Method 2: Use AWS CLI from CloudShell

If Session Manager doesn't work, you can send commands via SSM:

```bash
# Send import command to EC2
aws ssm send-command \
  --instance-ids i-0cf90a4dc4f39debd \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["export PGPASSWORD='\''ju3vrLHJUW8PqDG4'\''","aws s3 cp s3://travel-app-storage-1769/migration/supabase_schema.sql /tmp/","aws s3 cp s3://travel-app-storage-1769/migration/supabase_data.sql /tmp/","psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com --port=5432 --username=postgres --dbname=postgres --file=/tmp/supabase_schema.sql","psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com --port=5432 --username=postgres --dbname=postgres --file=/tmp/supabase_data.sql"]' \
  --output text \
  --query "Command.CommandId"
```

Then check status:
```bash
aws ssm list-command-invocations --command-id <COMMAND_ID> --details
```

---

## ✅ Expected Results

After successful import:
- ✅ Tables created in RDS
- ✅ Data inserted (433 rows total)
- ✅ Verification shows row counts:
  - users: 12 rows
  - activity_packages: 42 rows
  - transfer_packages: 27 rows
  - multi_city_packages: 14 rows

---

## 🧹 Cleanup After Import

1. **Delete EC2 instance** (to save costs):
   ```bash
   aws ec2 terminate-instances --instance-ids i-0cf90a4dc4f39debd
   ```

2. **Make RDS private again**:
   ```bash
   aws rds modify-db-instance \
     --db-instance-identifier travel-app-db \
     --no-publicly-accessible \
     --apply-immediately
   ```

3. **Update .env.local**:
   ```env
   RDS_HOSTNAME=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com
   RDS_PORT=5432
   RDS_DATABASE=postgres
   RDS_USERNAME=postgres
   RDS_PASSWORD=ju3vrLHJUW8PqDG4
   ```

---

## 🎯 Recommended: Use Method 1 (AWS Console → Session Manager)

**Go to EC2 Console → Find "migration-bastion" → Connect → Session Manager → Connect**

Then run the import commands. This is the easiest method! 🚀

---

**EC2 instance is ready at: 54.172.175.47**

**Connect and run the import now!** ✅

