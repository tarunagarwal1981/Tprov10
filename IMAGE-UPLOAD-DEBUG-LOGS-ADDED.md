# 🔍 Image Upload Debug Logs - Complete Tracing

## 📋 Overview

Comprehensive console logging has been added throughout the entire image upload and save flow to diagnose why pictures are not being saved in activity packages.

---

## 🎯 What Was Added

### **1. BasicInformationTab - Image Upload Entry Point** ✅

**File**: `src/components/packages/forms/tabs/BasicInformationTab.tsx`

**Logs Added**:
- `🖼️ [BasicInfoTab] handleImageUpload called` - When user selects images
- `✅ [BasicInfoTab] Images processed` - After processUploadedFiles completes
- `🎯 [BasicInfoTab] Setting featured image` - When setting featured image
- `🖼️ [BasicInfoTab] Setting gallery images` - When adding to gallery
- `🔄 [BasicInfoTab] handleImagesChange called` - When images array changes
- `❌ [BasicInfoTab] Error processing images` - Any errors

**What It Shows**:
```typescript
🖼️ [BasicInfoTab] handleImageUpload called {
  filesCount: 2,
  isFeatured: false,
  fileNames: ['beach.jpg', 'sunset.png'],
  fileSizes: [245678, 189034]
}

✅ [BasicInfoTab] Images processed {
  processedCount: 2,
  processedImages: [
    { id: 'img-123', url: 'data:image/jpeg;base64,/9j/4AAQ...', fileName: 'beach.jpg' },
    { id: 'img-124', url: 'data:image/png;base64,iVBORw0KGgo...', fileName: 'sunset.png' }
  ]
}

🖼️ [BasicInfoTab] Setting gallery images {
  currentCount: 0,
  newCount: 2,
  newGallery: [...]
}
```

---

### **2. formDataToDatabase - Data Transformation** ✅

**File**: `src/lib/supabase/activity-packages.ts`

**Logs Added**:
- `📦 [formDataToDatabase] Processing images` - Shows raw images from form
- `✅ [formDataToDatabase] Images transformed` - Shows database format

**What It Shows**:
```typescript
📦 [formDataToDatabase] Processing images {
  imageGalleryCount: 2,
  imageGallery: [
    { fileName: 'beach.jpg', url: 'data:image/jpeg;base64,/9j/4AAQ...', isCover: false },
    { fileName: 'sunset.png', url: 'data:image/png;base64,iVBORw0KGgo...', isCover: false }
  ],
  featuredImage: {
    fileName: 'cover.jpg',
    url: 'data:image/jpeg;base64,/9j/4AAQ...',
    isCover: true
  }
}

✅ [formDataToDatabase] Images transformed {
  totalImages: 3,
  images: [
    { file_name: 'cover.jpg', storage_path: 'data:image/jpeg;base64,/9j/4AAQ...', is_cover: true },
    { file_name: 'beach.jpg', storage_path: 'data:image/jpeg;base64,/9j/4AAQ...', is_cover: false },
    { file_name: 'sunset.png', storage_path: 'data:image/png;base64,iVBORw0KGgo...', is_cover: false }
  ]
}
```

**Important Fix**: Also added `featuredImage` to the images array (it was missing!)

---

### **3. Page-Level Save Handlers** ✅

**File**: `src/app/operator/packages/create/activity/page.tsx`

**Logs Added**:
- `💾 [Page] Saving activity package draft` - At start of save
- `📦 [Page] Transformed database data` - After formDataToDatabase
- `🚀 [Page] Publishing activity package` - At start of publish

**What It Shows**:
```typescript
💾 [Page] Saving activity package draft: {
  title: 'Desert Safari Adventure',
  hasImages: true,
  imageGalleryCount: 2,
  hasFeaturedImage: true
}

📦 [Page] Transformed database data: {
  packageTitle: 'Desert Safari Adventure',
  hasImages: true,
  imageCount: 3
}
```

---

### **4. updateActivityPackage - Database Save** ✅

**File**: `src/lib/supabase/activity-packages.ts`

**Logs Added**:
- `🔄 [updateActivityPackage] Starting update` - Entry point
- `📸 [updateActivityPackage] Processing images` - Raw images received
- `🔍 [updateActivityPackage] Image separation` - Base64 vs already uploaded
- `📤 [updateActivityPackage] Uploading base64 images to storage` - Upload start
- `✅ [updateActivityPackage] Upload complete` - Upload results
- `🎯 [updateActivityPackage] Final images ready` - Before database insert
- `💾 [updateActivityPackage] Deleting old images and inserting new ones` - Database operation
- `✅ [updateActivityPackage] Images saved to database` - Success confirmation
- `❌ [updateActivityPackage] Error inserting images` - Any database errors

**What It Shows**:
```typescript
🔄 [updateActivityPackage] Starting update {
  packageId: '123-456-789',
  hasImages: true,
  imageCount: 3
}

📸 [updateActivityPackage] Processing images {
  totalImages: 3,
  images: [
    { file_name: 'cover.jpg', is_base64: true, is_cover: true },
    { file_name: 'beach.jpg', is_base64: true, is_cover: false },
    { file_name: 'sunset.png', is_base64: true, is_cover: false }
  ]
}

🔍 [updateActivityPackage] Image separation {
  base64Count: 3,
  alreadyUploadedCount: 0
}

📤 [updateActivityPackage] Uploading base64 images to storage {
  count: 3
}

✅ [updateActivityPackage] Upload complete {
  uploadCount: 3,
  results: [
    { path: 'user123/activity-packages-images/cover_167890...', publicUrl: 'https://supabase.co/storage/...' },
    { path: 'user123/activity-packages-images/beach_167890...', publicUrl: 'https://supabase.co/storage/...' },
    { path: 'user123/activity-packages-images/sunset_167890...', publicUrl: 'https://supabase.co/storage/...' }
  ]
}

🎯 [updateActivityPackage] Final images ready {
  finalImageCount: 3,
  finalImages: [
    { file_name: 'cover.jpg', storage_path: 'user123/...', public_url: 'https://...', is_cover: true },
    { file_name: 'beach.jpg', storage_path: 'user123/...', public_url: 'https://...', is_cover: false },
    { file_name: 'sunset.png', storage_path: 'user123/...', public_url: 'https://...', is_cover: false }
  ]
}

💾 [updateActivityPackage] Deleting old images and inserting new ones {
  packageId: '123-456-789',
  imageCount: 3
}

✅ [updateActivityPackage] Images saved to database {
  savedCount: 3,
  savedImages: [
    { id: 'db-img-1', file_name: 'cover.jpg', public_url: 'https://...', is_cover: true },
    { id: 'db-img-2', file_name: 'beach.jpg', public_url: 'https://...', is_cover: false },
    { id: 'db-img-3', file_name: 'sunset.png', public_url: 'https://...', is_cover: false }
  ]
}
```

---

## 🔍 How to Use the Logs

### **Step 1: Open Browser Console**
Press `F12` or right-click → "Inspect" → "Console" tab

### **Step 2: Upload Images**
1. Go to activity package creation form
2. Upload images (featured and/or gallery)
3. Watch console for `🖼️ [BasicInfoTab]` logs

### **Step 3: Save/Publish**
1. Click "Save Draft" or "Publish"
2. Watch for the complete flow:
   - `💾 [Page]` → Form submission
   - `📦 [formDataToDatabase]` → Data transformation
   - `🔄 [updateActivityPackage]` → Database update
   - `📸 📤 ✅` → Image processing & upload
   - `💾 ✅` → Database save

### **Step 4: Check for Issues**
Look for:
- ❌ **Red error logs** - Something failed
- **Missing logs** - Part of the flow didn't execute
- **Count mismatches** - Images lost along the way
- **Empty arrays** - No images being passed

---

## 🐛 Common Issues to Look For

### **Issue 1: No Images in Form Data**
```typescript
💾 [Page] Saving activity package draft: {
  hasImages: false,  // ❌ PROBLEM: Should be true
  imageGalleryCount: 0,  // ❌ No images
  hasFeaturedImage: false
}
```
**Cause**: Images not being saved to form state
**Solution**: Check BasicInformationTab `setValue` calls

---

### **Issue 2: Images Not Transformed**
```typescript
📦 [formDataToDatabase] Processing images {
  imageGalleryCount: 0,  // ❌ PROBLEM
  imageGallery: []
}
```
**Cause**: formDataToDatabase not receiving images
**Solution**: Check form data structure

---

### **Issue 3: Upload Failure**
```typescript
📤 [updateActivityPackage] Uploading base64 images to storage {
  count: 3
}
❌ Upload error: Storage bucket not found  // ❌ PROBLEM
```
**Cause**: Storage configuration issue
**Solution**: Check Supabase storage bucket exists

---

### **Issue 4: Database Insert Failure**
```typescript
💾 [updateActivityPackage] Deleting old images and inserting new ones
❌ [updateActivityPackage] Error inserting images { error: ... }  // ❌ PROBLEM
```
**Cause**: Database schema or permissions issue
**Solution**: Check activity_package_images table and RLS policies

---

## 📊 Expected Flow (Success)

```
1. User uploads images
   🖼️ [BasicInfoTab] handleImageUpload called
   ✅ [BasicInfoTab] Images processed

2. User clicks Save/Publish
   💾 [Page] Saving activity package draft
   📦 [Page] Transformed database data

3. Data transformation
   📦 [formDataToDatabase] Processing images
   ✅ [formDataToDatabase] Images transformed

4. Database update starts
   🔄 [updateActivityPackage] Starting update
   📸 [updateActivityPackage] Processing images
   🔍 [updateActivityPackage] Image separation

5. Upload to storage
   📤 [updateActivityPackage] Uploading base64 images to storage
   ✅ [updateActivityPackage] Upload complete

6. Prepare for database
   🎯 [updateActivityPackage] Final images ready

7. Save to database
   💾 [updateActivityPackage] Deleting old images and inserting new ones
   ✅ [updateActivityPackage] Images saved to database
```

---

## 🎯 Files Modified

1. **`src/components/packages/forms/tabs/BasicInformationTab.tsx`**
   - Added logs in `handleImageUpload`, `handleImagesChange`

2. **`src/lib/supabase/activity-packages.ts`**
   - Added logs in `formDataToDatabase`
   - Added comprehensive logs in `updateActivityPackage`
   - **Fixed**: Added `featuredImage` to images array

3. **`src/app/operator/packages/create/activity/page.tsx`**
   - Added logs in `handleSave`, `handlePublish`

---

## ✅ Build Status

- ✅ **Build successful** - No compilation errors
- ✅ **Type checking passed** - All TypeScript types valid
- ⚠️ **Minor warnings** - useCallback dependency warnings (non-blocking)

---

## 🚀 Next Steps

1. **Test Upload Flow**:
   - Create/edit activity package
   - Upload images
   - Monitor console logs
   - Copy all logs and share with developer

2. **Identify Issue**:
   - Look for the point where logs stop
   - Check for error messages
   - Verify image counts match at each step

3. **Fix Based on Logs**:
   - The logs will pinpoint exactly where the flow breaks
   - Can fix the specific component/function causing issues

---

## 📝 Notes

- **Logs are emoji-coded** for easy visual scanning
- **All sensitive data truncated** (URLs, base64 strings limited to 50 chars)
- **Non-blocking** - Logs don't affect performance
- **Can be removed** later once issue is fixed

---

## 🎉 Summary

**Complete tracing from user upload → database save!**

Every step is logged:
- ✅ Image selection
- ✅ File processing
- ✅ Form state updates
- ✅ Data transformation
- ✅ Storage upload
- ✅ Database insertion

**Just upload an image and check the console - the logs will show exactly what's happening!** 🔍

