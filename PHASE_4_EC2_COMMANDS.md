# Phase 4: Commands to Run in EC2 Instance Connect

## ✅ Once Connected

If you're connected to EC2 Instance Connect, copy and paste these commands **one by one**:

---

### **Step 1: Download SQL Script**

```bash
aws s3 cp s3://travel-app-storage-1769/migration/update-urls.sql /tmp/
```

---

### **Step 2: Set Database Password**

```bash
export PGPASSWORD='ju3vrLHJUW8PqDG4'
```

---

### **Step 3: Run the Update**

```bash
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=/tmp/update-urls.sql
```

---

## ✅ Expected Output

```
UPDATE 30
UPDATE 30
 remaining | s3_count 
-----------+----------
         0 |       30

 id | url
----+-------
...
```

**This means:**
- ✅ 30 URLs updated
- ✅ 0 remaining Supabase URLs  
- ✅ 30 S3 URLs

---

## 🧹 After Success

Terminate the instance:
```bash
# From your local machine
aws ec2 terminate-instances --instance-ids i-056a065313dae8712
```

---

**Copy-paste these commands into your EC2 terminal now!** 🚀

