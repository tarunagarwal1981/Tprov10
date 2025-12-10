# Phase 2: Database Migration - Ready to Execute

## ✅ Prerequisites Complete

- ✅ RDS PostgreSQL instance created and available
- ✅ RDS Endpoint: `travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com`
- ✅ RDS Password: `ju3vrLHJUW8PqDG4`
- ✅ Migration script created: `aws-migration-scripts/phase2-migrate-database.ts`

---

## 🚀 Execute Phase 2 Migration

### **Step 1: Get Supabase Database Password**

1. Go to: https://supabase.com/dashboard/project/megmjzszmqnmzdxwzigt/settings/database
2. Find **Database Password** section
3. Click **Reset database password** (if you don't know it) OR use existing password
4. Copy the password

### **Step 2: Set Environment Variable**

```powershell
$env:SUPABASE_DB_PASSWORD="your_supabase_database_password"
```

### **Step 3: Run Migration Script**

```powershell
npx ts-node aws-migration-scripts/phase2-migrate-database.ts
```

---

## 📋 What the Script Does

1. **Connects to Supabase** - Exports schema and data
2. **Saves SQL files** - Creates `supabase_schema.sql` and `supabase_data.sql`
3. **Connects to RDS** - Imports schema and data
4. **Verifies migration** - Checks table counts

---

## ⏱️ Expected Duration

- **Export from Supabase**: 2-5 minutes (depends on data size)
- **Import to RDS**: 5-10 minutes (depends on data size)
- **Total**: ~10-15 minutes

---

## ✅ Success Indicators

After migration completes, you should see:
- ✅ Schema exported and saved
- ✅ Data exported and saved
- ✅ Schema imported to RDS
- ✅ Data imported to RDS
- ✅ Verification showing table row counts

---

## 🔧 Troubleshooting

### **Error: "SUPABASE_DB_PASSWORD not set"**
**Solution:** Set the environment variable:
```powershell
$env:SUPABASE_DB_PASSWORD="your_password"
```

### **Error: "Connection refused"**
**Solution:** 
- Check Supabase project is active (not paused)
- Verify database password is correct
- Check RDS security group allows your IP (if connecting from outside VPC)

### **Error: "Table already exists"**
**Solution:** This is normal - script handles existing objects gracefully

---

## 📝 After Migration

1. **Update `.env.local`** with RDS credentials:
```env
RDS_HOSTNAME=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DATABASE=postgres
RDS_USERNAME=postgres
RDS_PASSWORD=ju3vrLHJUW8PqDG4
```

2. **Test connection** using the database utility:
```typescript
import { testConnection } from '@/lib/aws/database';
await testConnection(); // Should return true
```

3. **Proceed to Phase 3** (Cognito setup)

---

**Ready to migrate? Get your Supabase password and run the script! 🚀**

