# Phase 4: Storage Migration - Ready! 🚀

## ✅ What's Been Done

### **1. Infrastructure Created**
- ✅ S3 upload API routes (`/api/upload`, `/api/upload/presigned`)
- ✅ AWS file upload service (`src/lib/aws/file-upload.ts`)
- ✅ Compatible interface with Supabase version

### **2. Code Updated**
- ✅ `src/lib/supabase/activity-packages.ts` - Uses S3 for uploads/deletes
- ✅ `src/lib/supabase/transfer-packages.ts` - Uses S3 for uploads
- ✅ All file upload functions now use AWS S3

### **3. Migration Script Ready**
- ✅ `aws-migration-scripts/migrate-storage.ts` - Main migration script
- ✅ `aws-migration-scripts/phase4-migrate-storage.ps1` - PowerShell wrapper

---

## 🚀 Next Steps

### **Step 1: Run File Migration**

Migrate all files from Supabase Storage to S3:

```powershell
.\aws-migration-scripts\phase4-migrate-storage.ps1
```

**What it does:**
- Lists all files in Supabase buckets:
  - `activity-package-images`
  - `transfer-packages`
  - `multi-city-packages`
- Downloads from Supabase
- Uploads to S3 with same folder structure
- Preserves metadata

**Expected time:** Depends on file count (usually 5-30 minutes)

---

### **Step 2: Update Database URLs (After Migration)**

After files are migrated, update database URLs:

```sql
-- Update activity_package_images URLs
UPDATE activity_package_images
SET 
  public_url = REPLACE(public_url, 
    'https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public/',
    'https://travel-app-storage-1769.s3.us-east-1.amazonaws.com/'),
  storage_path = REPLACE(storage_path,
    'https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public/',
    'activity-package-images/')
WHERE public_url LIKE '%supabase.co%';
```

---

### **Step 3: Test**

1. **Test file uploads:**
   - Upload a new image
   - Verify it goes to S3

2. **Test file displays:**
   - Check existing images load from S3
   - Verify URLs work

3. **Test file deletes:**
   - Delete an image
   - Verify it's removed from S3

---

## 📋 Environment Variables Required

Ensure `.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
S3_BUCKET_NAME=travel-app-storage-1769
AWS_REGION=us-east-1
```

---

## ✅ Phase 4 Complete When:

- ✅ All files migrated to S3
- ✅ Database URLs updated
- ✅ File uploads work with S3
- ✅ File displays work with S3
- ✅ File deletes work with S3

---

**Ready to migrate files?** Run the migration script! 🚀

