# Phase 4: Verify Database URL Update ✅

## Check if Update Worked

After running `./update-urls.sh`, verify the results:

### **Step 1: Check Script Output**

You should have seen output like:
```
🔄 Updating database URLs from Supabase to S3...
📦 Updating activity_package_images table...
Connecting to: travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com:5432/postgres
Testing connection...
✅ Connection successful!
Updating public_url...
UPDATE 30
✅ public_url updated
Updating storage_path...
UPDATE 30
✅ storage_path updated
🔍 Verifying updates...
 remaining_supabase_urls | s3_urls 
-------------------------+--------
                       0 |     30
✅ Database URL update completed successfully!
```

---

### **Step 2: Manual Verification**

If you want to verify manually, run:

```bash
psql "postgresql://postgres:ju3vrLHJUW8PqDG4@travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com:5432/postgres" -c "SELECT COUNT(*) as remaining_supabase FROM activity_package_images WHERE public_url LIKE '%supabase.co%';"
```

Should return: `remaining_supabase | 0`

---

### **Step 3: Check Sample URLs**

```bash
psql "postgresql://postgres:ju3vrLHJUW8PqDG4@travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com:5432/postgres" -c "SELECT id, LEFT(public_url, 100) as url FROM activity_package_images WHERE public_url LIKE '%s3.amazonaws.com%' LIMIT 3;"
```

Should show S3 URLs like:
```
https://travel-app-storage-1769.s3.us-east-1.amazonaws.com/activity-package-images/...
```

---

## If Script Didn't Run

If you didn't see the output above, check:

1. **Did you see any errors?** Share the error message.

2. **Check if script exists:**
   ```bash
   ls -la update-urls.sh
   ```

3. **Run with verbose output:**
   ```bash
   bash -x update-urls.sh
   ```

4. **Check environment variables:**
   ```bash
   echo $RDS_PASSWORD
   echo $RDS_HOST
   ```

---

## Next Steps After Successful Update

1. ✅ Database URLs updated
2. ✅ Test file displays in application
3. ✅ Verify images load from S3

---

**What output did you see?** Share it and I'll help verify! 🚀

