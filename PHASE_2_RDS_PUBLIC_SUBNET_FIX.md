# Phase 2: Fix RDS Public Access Issue

## 🔍 Problem Identified

RDS is in **private subnets**, which blocks public connections even when marked as "publicly accessible".

## ✅ Solution Applied

1. ✅ Created new DB subnet group with **public subnets**
2. ✅ Modified RDS to use public subnet group
3. ⏳ RDS is restarting (takes 2-5 minutes)

---

## ⏱️ Wait for RDS to Restart

**Check status:**
```bash
aws rds describe-db-instances --db-instance-identifier travel-app-db --query "DBInstances[0].[DBInstanceStatus,PubliclyAccessible]" --output text
```

Wait until status is `available` and `PubliclyAccessible` is `True`.

---

## 🚀 Then Try Import Again in CloudShell

Once RDS is available, run in CloudShell:

```bash
export PGPASSWORD='ju3vrLHJUW8PqDG4'

# Import schema
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=supabase_schema.sql

# Import data
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=supabase_data.sql
```

---

## 🔒 After Migration: Move Back to Private Subnets

For security, move RDS back to private subnets:

```bash
aws rds modify-db-instance \
  --db-instance-identifier travel-app-db \
  --db-subnet-group-name travel-app-db-subnet-group \
  --no-publicly-accessible \
  --apply-immediately
```

---

**RDS is restarting. Wait 2-5 minutes, then try the import again in CloudShell!** ⏳

