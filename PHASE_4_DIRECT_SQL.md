# Phase 4: Update URLs Using Direct SQL (Easiest!) 🚀

## ✅ No Node.js Needed!

Since PostgreSQL client is already installed on the EC2 instance, we can use **psql directly** - much simpler!

---

## 🚀 Quick Steps

### **Step 1: Connect via EC2 Instance Connect**

1. Go to [EC2 Console](https://console.aws.amazon.com/ec2/)
2. Find instance: `i-056a065313dae8712`
3. Select it → **Connect** → **EC2 Instance Connect** → **Connect**

**If EC2 Instance Connect still fails:**
- Wait 1-2 minutes for instance to fully initialize
- Try again
- Or use SSH if you have a key pair

---

### **Step 2: Run These Commands**

Once connected, copy and paste these commands:

```bash
# Download SQL script from S3
aws s3 cp s3://travel-app-storage-1769/migration/update-urls.sql /tmp/

# Set password
export PGPASSWORD='ju3vrLHJUW8PqDG4'

# Run the update
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=/tmp/update-urls.sql
```

---

### **Step 3: Verify Results**

You should see:
```
UPDATE 30
UPDATE 30
 remaining | s3_count 
-----------+----------
         0 |       30
```

This means:
- ✅ 30 URLs updated
- ✅ 0 remaining Supabase URLs
- ✅ 30 S3 URLs

---

## 📋 Alternative: Run SQL Directly

If you prefer, you can paste the SQL directly:

```bash
export PGPASSWORD='ju3vrLHJUW8PqDG4'

psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --command="UPDATE activity_package_images SET public_url = REPLACE(public_url, 'https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public/activity-package-images/', 'https://travel-app-storage-1769.s3.us-east-1.amazonaws.com/activity-package-images/') WHERE public_url LIKE '%supabase.co%';"

psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --command="UPDATE activity_package_images SET storage_path = REPLACE(storage_path, 'https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public/activity-package-images/', 'activity-package-images/') WHERE storage_path LIKE '%supabase.co%';"
```

---

## ✅ After Success

Terminate the instance:
```bash
aws ec2 terminate-instances --instance-ids i-056a065313dae8712
```

---

**This is the simplest approach - no Node.js needed!** 🚀

