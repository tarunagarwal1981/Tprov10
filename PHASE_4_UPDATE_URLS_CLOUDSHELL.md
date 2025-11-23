# Phase 4: Update Database URLs via CloudShell 🔄

## Problem
RDS is in a private subnet and not accessible from local machine. We need to update URLs from within AWS.

## Solution: Use AWS CloudShell

AWS CloudShell has VPC access to RDS, so we can run the update from there.

---

## Steps

### **Step 1: Open AWS CloudShell**

1. Go to AWS Console
2. Click the CloudShell icon (top right)
3. Wait for CloudShell to initialize

### **Step 2: Upload and Run Script**

**Option A: Copy script content**

1. Copy the script from `aws-migration-scripts/cloudshell-update-urls.sh`
2. Paste into CloudShell
3. Make it executable:
   ```bash
   chmod +x cloudshell-update-urls.sh
   ```

**Option B: Download from S3**

If you uploaded the script to S3:
```bash
aws s3 cp s3://travel-app-storage-1769/migration/cloudshell-update-urls.sh .
chmod +x cloudshell-update-urls.sh
```

### **Step 3: Set Environment Variables**

```bash
export RDS_PASSWORD='your_rds_password'
export RDS_HOST='travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com'
export RDS_PORT='5432'
export RDS_DB='postgres'
export RDS_USER='postgres'
```

### **Step 4: Install PostgreSQL Client (if needed)**

```bash
sudo yum install -y postgresql15
```

### **Step 5: Run the Script**

```bash
./cloudshell-update-urls.sh
```

---

## Alternative: Manual SQL Update

If you prefer to run SQL manually:

```sql
-- Connect to RDS (from CloudShell or EC2 with access)
psql -h travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d postgres

-- Then run:
UPDATE activity_package_images
SET public_url = REPLACE(
  public_url,
  'https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public/activity-package-images/',
  'https://travel-app-storage-1769.s3.us-east-1.amazonaws.com/activity-package-images/'
)
WHERE public_url LIKE '%supabase.co%';

UPDATE activity_package_images
SET storage_path = REPLACE(
  storage_path,
  'https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public/activity-package-images/',
  'activity-package-images/'
)
WHERE storage_path LIKE '%supabase.co%';

-- Verify
SELECT COUNT(*) 
FROM activity_package_images
WHERE public_url LIKE '%supabase.co%' OR storage_path LIKE '%supabase.co%';
```

---

## Expected Output

```
🔄 Updating database URLs from Supabase to S3...
📦 Updating activity_package_images table...
UPDATE 30
UPDATE 30
 remaining_supabase_urls | s3_urls 
-------------------------+--------
                       0 |     30
✅ Database URL update completed!
```

---

## After Update

1. ✅ Verify URLs are updated
2. ✅ Test file displays in application
3. ✅ Verify images load from S3

---

**Ready to update!** 🚀

