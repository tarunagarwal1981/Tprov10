# Phase 2: Alternative Solution - Use EC2 Bastion Host

## 🔍 Problem

RDS is in private subnets, blocking direct public connections. Modifying subnet group requires restart (5-10 minutes).

## ✅ Alternative: Create EC2 Bastion Host

Since CloudShell connection is timing out, let's create a small EC2 instance in a public subnet to act as a jump host.

---

## 🚀 Quick Solution: Create EC2 Instance

### **Step 1: Create EC2 Instance in Public Subnet**

Run this in your terminal (or CloudShell):

```bash
# Create EC2 instance in public subnet
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --subnet-id subnet-043c87443f8ef0263 \
  --security-group-ids sg-03d1d3d0c41a29e7a \
  --associate-public-ip-address \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=migration-bastion}]" \
  --user-data "#!/bin/bash
yum update -y
yum install -y postgresql15
"
```

**Note:** This creates a free-tier eligible instance. Delete it after migration!

### **Step 2: Get EC2 Public IP**

```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=migration-bastion" "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].PublicIpAddress" \
  --output text
```

### **Step 3: SSH into EC2 and Import**

```bash
# SSH into EC2 (you'll need a key pair)
ssh ec2-user@<EC2_PUBLIC_IP>

# Once inside EC2:
aws s3 cp s3://travel-app-storage-1769/migration/supabase_schema.sql .
aws s3 cp s3://travel-app-storage-1769/migration/supabase_data.sql .

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

## 🎯 Simpler: Wait for RDS Subnet Modification

The RDS subnet group modification is in progress. It requires a restart which takes 5-10 minutes.

**Check status:**
```bash
aws rds describe-db-instances --db-instance-identifier travel-app-db --query "DBInstances[0].[DBInstanceStatus,DBSubnetGroup.DBSubnetGroupName]" --output text
```

Wait until subnet group shows `travel-app-db-subnet-group-public`, then try CloudShell connection again.

---

## 💡 Recommended: Wait 5-10 Minutes

The simplest solution is to **wait for the RDS modification to complete**. Then the CloudShell connection should work.

**Check every 2 minutes:**
```bash
aws rds describe-db-instances --db-instance-identifier travel-app-db --query "DBInstances[0].DBSubnetGroup.DBSubnetGroupName" --output text
```

When it shows `travel-app-db-subnet-group-public`, try the import again in CloudShell.

---

**Choose: Wait for modification OR create EC2 bastion host** ⏳

