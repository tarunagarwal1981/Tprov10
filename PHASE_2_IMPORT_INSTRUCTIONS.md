# Phase 2: Import to RDS - Manual Instructions

## ✅ Export Complete!

We've successfully exported your Supabase database:
- **Schema file**: `supabase_schema.sql` (13.64 KB)
- **Data file**: `supabase_data.sql` (310.05 KB)
- **Tables exported**: 31 tables
- **Total rows**: 433 rows

---

## 📥 Import to RDS

Since direct connection from your machine is timing out, here are alternative methods:

### **Option 1: Use AWS CloudShell (Recommended)**

AWS CloudShell has PostgreSQL tools pre-installed and can connect to RDS:

1. **Open AWS CloudShell**
   - Go to: https://console.aws.amazon.com/cloudshell
   - Click "CloudShell" icon in AWS Console

2. **Upload SQL files**
   ```bash
   # In CloudShell, upload files using the upload button
   # Or use S3:
   aws s3 cp supabase_schema.sql s3://travel-app-storage-1769/
   aws s3 cp supabase_data.sql s3://travel-app-storage-1769/
   ```

3. **Download in CloudShell**
   ```bash
   aws s3 cp s3://travel-app-storage-1769/supabase_schema.sql .
   aws s3 cp s3://travel-app-storage-1769/supabase_data.sql .
   ```

4. **Import to RDS**
   ```bash
   export PGPASSWORD='ju3vrLHJUW8PqDG4'
   psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
        --port=5432 \
        --username=postgres \
        --dbname=postgres \
        --file=supabase_schema.sql
   
   psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
        --port=5432 \
        --username=postgres \
        --dbname=postgres \
        --file=supabase_data.sql
   ```

---

### **Option 2: Use EC2 Instance (If CloudShell doesn't work)**

1. **Create EC2 instance in the same VPC**
   ```bash
   aws ec2 run-instances \
     --image-id ami-0c55b159cbfafe1f0 \
     --instance-type t2.micro \
     --subnet-id subnet-043c87443f8ef0263 \
     --security-group-ids sg-03d1d3d0c41a29e7a \
     --key-name your-key-pair
   ```

2. **SSH into EC2 and install PostgreSQL client**
   ```bash
   sudo yum install postgresql15 -y
   ```

3. **Upload SQL files and import** (same as CloudShell)

---

### **Option 3: Use pgAdmin or DBeaver (GUI Tools)**

1. **Install pgAdmin** or **DBeaver**
   ```powershell
   winget install PostgreSQL.pgAdmin
   # OR
   winget install DBeaver.DBeaver
   ```

2. **Connect to RDS**
   - Host: `travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com`
   - Port: `5432`
   - Database: `postgres`
   - Username: `postgres`
   - Password: `ju3vrLHJUW8PqDG4`
   - SSL: Required

3. **Import SQL files**
   - Open pgAdmin
   - Right-click on database → "Query Tool"
   - Open `supabase_schema.sql` and execute
   - Open `supabase_data.sql` and execute

---

### **Option 4: Upload to S3 and Use Lambda**

Create a Lambda function that reads from S3 and imports to RDS (more complex but automated).

---

## 🔍 Verify Import

After importing, verify with:

```sql
SELECT 
  'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'activity_packages', COUNT(*) FROM activity_packages
UNION ALL
SELECT 'transfer_packages', COUNT(*) FROM transfer_packages
UNION ALL
SELECT 'multi_city_packages', COUNT(*) FROM multi_city_packages;
```

---

## 🔒 After Import: Make RDS Private Again

For security, make RDS private again:

```bash
aws rds modify-db-instance \
  --db-instance-identifier travel-app-db \
  --no-publicly-accessible \
  --apply-immediately
```

And remove the public access rule from security group:

```bash
aws ec2 revoke-security-group-ingress \
  --group-id sg-0351956ce61a8d1f1 \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0
```

---

## 📝 Files Ready

Your SQL files are in the project root:
- `supabase_schema.sql`
- `supabase_data.sql`

**Recommended: Use AWS CloudShell (Option 1) - it's the easiest!** 🚀

