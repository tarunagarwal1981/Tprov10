# ✅ Ready to Import - CloudShell Commands

## Current Status

- ✅ RDS modification started (moving to public subnets)
- ✅ SQL files downloaded in CloudShell
- ✅ PostgreSQL client installed
- ⏳ Waiting for RDS to finish modifying

---

## 🔍 Check RDS Status First

In CloudShell, check if RDS is ready:

```bash
aws rds describe-db-instances --db-instance-identifier travel-app-db --query "DBInstances[0].[DBInstanceStatus,PubliclyAccessible]" --output text
```

Wait until you see: `available	True`

---

## 🚀 Import Commands (Run in CloudShell)

Once RDS status is `available` and `PubliclyAccessible` is `True`, run:

```bash
# Set password
export PGPASSWORD='ju3vrLHJUW8PqDG4'

# Test connection first
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --command="SELECT NOW();"

# If connection works, import schema
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

# Verify
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --command="SELECT 'users' as table_name, COUNT(*) FROM users UNION ALL SELECT 'activity_packages', COUNT(*) FROM activity_packages;"
```

---

## ⏱️ Expected Timeline

- RDS modification: **2-5 minutes**
- Schema import: **30 seconds**
- Data import: **1-2 minutes**
- **Total: ~5-8 minutes**

---

**Check RDS status, then run the import commands above!** 🚀

