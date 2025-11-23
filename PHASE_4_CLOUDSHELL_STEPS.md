# Phase 4: Update URLs in CloudShell - Step by Step 🔄

## Quick Steps

### **Step 1: Open AWS CloudShell**

1. Go to [AWS Console](https://console.aws.amazon.com)
2. Click the **CloudShell icon** (top right, looks like `>_`)
3. Wait for CloudShell to initialize (30-60 seconds)

---

### **Step 2: Create the Script File**

**Option A: Copy-paste (Easiest)**

1. Open the script file: `aws-migration-scripts/cloudshell-update-urls.sh`
2. Copy the entire contents
3. In CloudShell, type:
   ```bash
   nano update-urls.sh
   ```
4. Paste the script (right-click or Ctrl+Shift+V)
5. Save: `Ctrl+O`, then `Enter`, then `Ctrl+X`

**Option B: Upload from S3**

If you uploaded it to S3:
```bash
aws s3 cp s3://travel-app-storage-1769/migration/cloudshell-update-urls.sh .
```

---

### **Step 3: Make Script Executable**

```bash
chmod +x update-urls.sh
```

---

### **Step 4: Set Environment Variables**

```bash
export RDS_PASSWORD='ju3vrLHJUW8PqDG4'
export RDS_HOST='travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com'
export RDS_PORT='5432'
export RDS_DB='postgres'
export RDS_USER='postgres'
```

**Important:** Replace `'your_rds_password_here'` with your actual RDS password!

---

### **Step 5: Install PostgreSQL Client (if needed)**

The script will try to install it automatically, but you can do it manually:

```bash
sudo yum install -y postgresql15
```

---

### **Step 6: Run the Script**

```bash
./update-urls.sh
```

---

### **Step 7: Check Results**

You should see:
```
✅ Connection successful!
✅ public_url updated
✅ storage_path updated
✅ Database URL update completed successfully!
```

---

## Troubleshooting

### **Script Exits Immediately**

**Problem:** Script exits with `[exited]` message

**Solutions:**
1. Check if you set `RDS_PASSWORD`:
   ```bash
   echo $RDS_PASSWORD
   ```
   If empty, set it again.

2. Check script permissions:
   ```bash
   ls -la update-urls.sh
   ```
   Should show `-rwxr-xr-x`. If not, run `chmod +x update-urls.sh`

3. Run script with bash explicitly:
   ```bash
   bash update-urls.sh
   ```

---

### **Connection Failed**

**Error:** `Failed to connect to RDS database`

**Solutions:**
1. Verify RDS endpoint is correct
2. Check RDS security group allows CloudShell IP
3. Verify password is correct

---

### **PostgreSQL Not Found**

**Error:** `psql: command not found`

**Solution:**
```bash
sudo yum install -y postgresql15
```

---

### **Permission Denied**

**Error:** `Permission denied`

**Solution:**
```bash
chmod +x update-urls.sh
```

---

## Alternative: Manual SQL

If the script doesn't work, you can run SQL manually:

```bash
psql "postgresql://postgres:YOUR_PASSWORD@travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com:5432/postgres"
```

Then run:
```sql
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
SELECT COUNT(*) FROM activity_package_images WHERE public_url LIKE '%supabase.co%';
```

---

**Need help?** Check the error message and follow the troubleshooting steps above! 🚀

