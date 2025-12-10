# Phase 4: Storage Migration Guide 📦

## 🎯 Goal
Migrate all files from Supabase Storage to AWS S3 and update application code.

---

## ✅ Prerequisites

- ✅ S3 bucket created: `travel-app-storage-1769`
- ✅ AWS credentials configured
- ✅ Supabase credentials available (for migration)
- ✅ Amplify deployed

---

## 📋 Phase 4 Steps

### **Step 4.1: Analyze Supabase Storage**

First, let's see what we're migrating:

1. **List Supabase buckets** (from code analysis):
   - `activity-package-images`
   - `transfer-packages`
   - `multi-city-packages`

2. **Check file counts and sizes** (via migration script)

---

### **Step 4.2: Migrate Files to S3**

Run the migration script to copy all files from Supabase to S3:

```bash
npx tsx aws-migration-scripts/migrate-storage.ts
```

**What it does:**
- Lists all files in each Supabase bucket
- Downloads files from Supabase
- Uploads to S3 with same folder structure
- Preserves metadata and content types
- Skips files that already exist in S3

---

### **Step 4.3: Update Application Code**

Replace Supabase Storage with S3 in:

1. **File Upload Components**
   - `src/lib/supabase/file-upload.ts` → Use `src/lib/aws/s3-upload.ts`
   - Update all components that upload files

2. **File Display/Download**
   - Update image URLs in database
   - Use S3 public URLs or presigned URLs

3. **API Routes**
   - Update upload endpoints
   - Update download endpoints

---

### **Step 4.4: Update Database URLs**

Update file URLs in database tables:
- `activity_package_images` table
- Any other tables with Supabase storage URLs

---

### **Step 4.5: Configure S3 Bucket (Optional)**

1. **Make bucket public** (if needed for public images)
2. **Set up CloudFront** (for better performance)
3. **Configure CORS** (for browser uploads)

---

## 🔧 Files to Update

### **1. Upload Utilities**
- ✅ `src/lib/aws/s3-upload.ts` (already exists)
- ❌ `src/lib/supabase/file-upload.ts` (replace usage)

### **2. Components Using Storage**
- Find all components importing `file-upload.ts`
- Replace with `s3-upload.ts`

### **3. Database URLs**
- Update `activity_package_images.public_url` and `storage_path`
- Replace Supabase URLs with S3 URLs

---

## 📝 Migration Script

**Location:** `aws-migration-scripts/migrate-storage.ts`

**Environment Variables Needed:**
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
S3_BUCKET_NAME=travel-app-storage-1769
AWS_REGION=us-east-1
```

---

## ✅ Phase 4 Complete When:

- ✅ All files migrated to S3
- ✅ Upload code updated to use S3
- ✅ Download/display code updated
- ✅ Database URLs updated
- ✅ Application tested with S3

---

**Let's start!** 🚀

