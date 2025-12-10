# Phase 4: Run Database URL Update NOW 🚀

## ✅ You're on EC2 Instance Connect Page

If you see a terminal/console, you're connected! Run these commands:

---

## **Step 1: Install PostgreSQL Client (if needed)**

```bash
sudo yum install -y postgresql15
```

---

## **Step 2: Download SQL Script**

```bash
aws s3 cp s3://travel-app-storage-1769/migration/update-urls.sql /tmp/
```

**Expected output:**
```
download: s3://travel-app-storage-1769/migration/update-urls.sql to /tmp/update-urls.sql
```

---

## **Step 3: Set Database Password**

```bash
export PGPASSWORD='ju3vrLHJUW8PqDG4'
```

---

## **Step 4: Run the Update**

```bash
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=/tmp/update-urls.sql
```

---

## ✅ Expected Output

You should see:
```
UPDATE 30
UPDATE 30
 remaining_supabase | s3_count 
--------------------+----------
                  0 |       30
(1 row)

 id |                          public_url                          | storage_path
----+--------------------------------------------------------------+-------------
  1 | https://travel-app-storage-1769.s3.us-east-1.amazonaws.com/... | activity-package-images/...
...
```

**This means:**
- ✅ **30 URLs updated** in `public_url` column
- ✅ **30 URLs updated** in `storage_path` column
- ✅ **0 remaining** Supabase URLs
- ✅ **30 S3 URLs** now in database

---

## 🎉 Success!

If you see the output above, **Phase 4 is complete!**

---

## 🧹 Cleanup (After Success)

Terminate the EC2 instance to save costs:

```bash
# From your local machine (PowerShell)
aws ec2 terminate-instances --instance-ids i-056a065313dae8712
```

---

## ❌ If You See Errors

### **Error: "psql: command not found"**
```bash
sudo yum install -y postgresql15
```

### **Error: "Connection timed out"**
- RDS security group may not allow EC2 access
- Check security group rules

### **Error: "Permission denied"**
```bash
chmod +x /tmp/update-urls.sql
```

---

**Copy-paste these commands into your EC2 terminal now!** 🚀
