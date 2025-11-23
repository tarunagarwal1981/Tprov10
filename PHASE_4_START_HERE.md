# Phase 4: Storage Migration - Start Here 🚀

## 🎯 Goal
Migrate all files from Supabase Storage to AWS S3 and update application code.

---

## ✅ Prerequisites Check

Before starting, ensure you have:

1. **S3 Bucket Created** ✅
   - Bucket name: `travel-app-storage-1769`
   - Region: `us-east-1`

2. **Environment Variables** (in `.env.local`):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   S3_BUCKET_NAME=travel-app-storage-1769
   AWS_REGION=us-east-1
   ```

3. **AWS Credentials Configured** ✅
   - Already configured via `aws configure`

---

## 📋 Phase 4 Steps

### **Step 4.1: Migrate Files to S3**

Run the migration script to copy all files:

```powershell
.\aws-migration-scripts\phase4-migrate-storage.ps1
```

**What it does:**
- Lists all files in Supabase buckets:
  - `activity-package-images`
  - `transfer-packages`
  - `multi-city-packages`
- Downloads files from Supabase
- Uploads to S3 with same folder structure
- Preserves metadata and content types
- Skips files that already exist

**Expected output:**
```
📦 Migrating bucket: activity-package-images
Found X files to migrate
✅ Migrated: file1.jpg
✅ Migrated: file2.png
...
📊 Migration Summary
✅ Successfully migrated: X
```

---

### **Step 4.2: Update Application Code**

After migration, update code to use S3:

1. **Update Upload Functions**
   - `src/lib/supabase/activity-packages.ts` → Use S3
   - `src/lib/supabase/transfer-packages.ts` → Use S3
   - `src/lib/supabase/file-upload.ts` → Replace with S3

2. **Update File URLs**
   - Update database URLs from Supabase to S3
   - Update image display components

---

### **Step 4.3: Test File Operations**

1. Test file uploads
2. Test file downloads/displays
3. Verify URLs work

---

## 🚀 Quick Start

**1. Check environment variables:**
```powershell
# Check if variables are set
$env:NEXT_PUBLIC_SUPABASE_URL
$env:SUPABASE_SERVICE_ROLE_KEY
$env:S3_BUCKET_NAME
```

**2. Run migration:**
```powershell
.\aws-migration-scripts\phase4-migrate-storage.ps1
```

**3. After migration completes, proceed to code updates**

---

## 📝 Notes

- Migration script is idempotent (safe to run multiple times)
- Files already in S3 will be skipped
- Original Supabase files remain (for rollback if needed)
- Migration preserves folder structure

---

**Ready to start?** Run the migration script! 🚀

