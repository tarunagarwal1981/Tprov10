# ✅ Ready to Import in CloudShell!

## Current Status

- ✅ RDS Status: `available`
- ✅ Publicly Accessible: `True`
- ✅ SQL files downloaded in CloudShell
- ✅ PostgreSQL client installed
- ✅ Security group allows connections

---

## 🚀 Run These Commands in CloudShell NOW

Copy and paste these commands one by one:

### **1. Test Connection First**

```bash
export PGPASSWORD='ju3vrLHJUW8PqDG4'
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --command="SELECT NOW();"
```

**Expected:** Should show current timestamp. If this works, proceed!

### **2. Import Schema**

```bash
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=supabase_schema.sql
```

**Expected:** Creates all tables. Some "already exists" warnings are normal.

### **3. Import Data**

```bash
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=supabase_data.sql
```

**Expected:** Inserts all data. Some "duplicate key" warnings are normal.

### **4. Verify Migration**

```bash
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --command="SELECT 'users' as table_name, COUNT(*) FROM users UNION ALL SELECT 'activity_packages', COUNT(*) FROM activity_packages UNION ALL SELECT 'transfer_packages', COUNT(*) FROM transfer_packages UNION ALL SELECT 'multi_city_packages', COUNT(*) FROM multi_city_packages;"
```

**Expected:** Should show row counts for each table.

---

## ✅ Success Indicators

After running all commands, you should see:
- ✅ Connection successful
- ✅ Tables created
- ✅ Data inserted
- ✅ Row counts match exported data

---

## 🎯 Next Steps After Import

1. **Make RDS private again** (for security)
2. **Update .env.local** with RDS credentials
3. **Proceed to Phase 3** (Cognito setup)

---

**Run the commands above in CloudShell now!** 🚀

