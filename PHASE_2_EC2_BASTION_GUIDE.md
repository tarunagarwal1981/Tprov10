# Phase 2: Import Using EC2 Bastion Host

## 🎯 Solution: Use EC2 Instance in Same VPC

Since RDS is in private subnets, we'll use an EC2 instance in the same VPC to connect.

---

## 🚀 Option 1: Use AWS Systems Manager (No SSH Keys Needed)

### **Step 1: Create EC2 Instance**

I've started creating an EC2 instance. Wait for it to be running, then:

### **Step 2: Connect via Systems Manager**

1. Go to: https://console.aws.amazon.com/ec2/
2. Find instance named "migration-bastion"
3. Select it → **Connect** → **Session Manager** → **Connect**

### **Step 3: Run Import Commands**

Once connected via Session Manager, run:

```bash
# Files should already be downloaded (via user-data)
# If not:
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

## 🚀 Option 2: Use CloudShell with VPC Endpoint (If Available)

If your account has VPC endpoints configured, CloudShell might be able to connect through them.

---

## 🚀 Option 3: Wait and Retry in CloudShell

Sometimes the connection works after a few minutes. Try again in CloudShell:

```bash
export PGPASSWORD='ju3vrLHJUW8PqDG4'
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --command="SELECT NOW();"
```

---

## 🧹 Cleanup After Migration

Once import is complete, **delete the EC2 instance**:

```bash
aws ec2 terminate-instances --instance-ids <INSTANCE_ID>
```

---

**Check if EC2 instance was created, then use Session Manager to connect!** 🚀

