# Phase 2: Fix SSM Agent - Alternative Methods

## 🔍 Problem

SSM Agent is not online because EC2 instance doesn't have IAM role with SSM permissions.

## ✅ Solution Applied

I've created and attached an IAM role with SSM permissions. Wait 30-60 seconds for SSM agent to register.

---

## 🚀 Method 1: Try Session Manager Again (After 1 Minute)

1. Go to: https://console.aws.amazon.com/ec2/
2. Find instance: **migration-bastion**
3. Select → **Connect** → **Session Manager** tab
4. Wait 30-60 seconds, then click **"Connect"** again

The SSM agent should now be online!

---

## 🚀 Method 2: Use EC2 Instance Connect (No SSH Keys Needed!)

EC2 Instance Connect provides browser-based SSH without keys:

1. **Go to EC2 Console**
   - https://console.aws.amazon.com/ec2/
   - Find instance: **migration-bastion**

2. **Connect via EC2 Instance Connect**
   - Select instance → **Connect** → **EC2 Instance Connect** tab
   - Click **"Connect"**
   - Browser-based terminal opens!

3. **Run Import Commands**

Once connected:

```bash
# Download files
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
     --command="SELECT 'users' as table_name, COUNT(*) FROM users;"
```

---

## 🚀 Method 3: Auto-Run Import on Instance Startup

I can create a new instance with user-data that automatically runs the import. Would you like me to do this?

---

## ✅ Recommended: Use EC2 Instance Connect (Method 2)

**EC2 Instance Connect** is the easiest - no SSH keys, no SSM setup needed!

1. Go to EC2 Console
2. Find "migration-bastion"
3. Connect → EC2 Instance Connect → Connect
4. Run the import commands

---

**Try EC2 Instance Connect now - it should work immediately!** 🚀

