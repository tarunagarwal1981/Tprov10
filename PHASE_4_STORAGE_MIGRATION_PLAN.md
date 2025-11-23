# Phase 4: Storage Migration Plan 📦

## 🎯 Goal
Migrate files from Supabase Storage to AWS S3, then update application code.

---

## ✅ Prerequisites

- ✅ S3 bucket created: `travel-app-storage-1769`
- ✅ Amplify deployed (after setup)
- ✅ Supabase Storage access (for migration)

---

## 📋 Phase 4 Steps

### **Step 4.1: Analyze Supabase Storage**

1. **List all buckets in Supabase**
2. **Identify files to migrate**
3. **Check file sizes and counts**

### **Step 4.2: Migrate Files to S3**

1. **Use migration script** (`aws-migration-scripts/migrate-storage.ts`)
2. **Download from Supabase Storage**
3. **Upload to S3**
4. **Preserve file paths and metadata**

### **Step 4.3: Update Application Code**

1. **Update upload code** to use S3
2. **Update download code** to use S3
3. **Update file URLs** in database
4. **Test file operations**

### **Step 4.4: Configure CloudFront (Optional)**

1. **Create CloudFront distribution**
2. **Point to S3 bucket**
3. **Update file URLs to use CloudFront**

---

## 🔧 Files to Update

1. **Upload Components**
   - Find file upload components
   - Replace Supabase Storage with S3

2. **Download/Display Components**
   - Update image/file URLs
   - Use S3 presigned URLs or CloudFront

3. **API Routes**
   - Update file upload endpoints
   - Update file download endpoints

---

## 📝 Migration Script

Already created: `aws-migration-scripts/migrate-storage.ts`

**Usage:**
```bash
npx tsx aws-migration-scripts/migrate-storage.ts
```

---

## ✅ Phase 4 Complete When:

- ✅ All files migrated to S3
- ✅ Upload code updated
- ✅ Download code updated
- ✅ File URLs updated in database
- ✅ CloudFront configured (optional)

---

**Ready after Amplify setup!** 🚀

