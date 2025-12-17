# Folder Name Mismatch Fix - Summary

## 🎯 Issue Identified

You were absolutely right! There was a **folder name mismatch**:

- **Upload code** was using: `activity-package-images` (without 's')
- **Fetching code** was looking for: `activity-packages-images/` (with 's')
- **Database** has paths with: `activity-packages-images/` (with 's')

This mismatch meant:
- Images might be saved to one folder
- But code was trying to fetch from another folder
- AWS returns 403 "Access Denied" instead of 404 when object doesn't exist (for security)

## ✅ Fixes Applied

### 1. **Fixed Upload Function** (`src/lib/supabase/activity-packages.ts`)
- Changed `bucket: 'activity-package-images'` → `bucket: 'activity-packages-images'`
- Updated delete function to use correct path
- Now all uploads will use the consistent path with 's'

### 2. **Updated Fetching Code** (Both API routes)
- Now checks for **both** path formats (with and without 's')
- Normalizes old paths (without 's') to new format (with 's')
- Falls back to original path if normalized path fails

### 3. **Path Normalization**
- If database has: `activity-package-images/...` (old format)
- Code converts to: `activity-packages-images/...` (new format)
- Tries normalized path first, then original as fallback

## 🔍 What to Check Next

### 1. Verify Where Objects Actually Are in S3

The objects might be in the **old folder** (without 's'):

1. Go to: **AWS S3 Console** → **travel-app-storage-1769**
2. Check if you have **both** folders:
   - `activity-package-images/` (without 's') - OLD
   - `activity-packages-images/` (with 's') - NEW
3. Check which folder has your actual image files

### 2. Update Database Paths (If Needed)

If objects are in the old folder but database has new paths:

**Option A: Update Database Paths**
```sql
-- Update storage_path to match actual S3 location
UPDATE activity_package_images
SET storage_path = REPLACE(storage_path, 'activity-packages-images/', 'activity-package-images/')
WHERE storage_path LIKE 'activity-packages-images/%';
```

**Option B: Move Objects in S3** (if you have access)
- Copy objects from old folder to new folder
- Or use the code's fallback mechanism (already implemented)

### 3. Test the Fix

1. **Restart your dev server**:
   ```bash
   # Stop (Ctrl+C)
   npm run dev
   ```

2. **Load the operator dashboard**

3. **Check server logs** for:
   - `🔄 [API] Normalized storage path:` - Shows path conversion
   - `🔄 [API] Trying original path as fallback:` - Shows fallback attempt
   - `✅ [API] Presigned URL generated` - Success!

4. **Check browser console** - Images should load now

## 📋 Current Behavior

The code now:
1. ✅ Checks for both path formats
2. ✅ Normalizes old paths to new format
3. ✅ Tries normalized path first
4. ✅ Falls back to original path if normalized fails
5. ✅ Uses correct path for new uploads

## ⚠️ If Still Getting 403 Errors

If you still get 403 after this fix, it means:
1. **Objects don't exist** at either path (check S3)
2. **Deny policy still exists** (check Groups, Permissions Boundary, SCP)
3. **Wrong credentials** being used (verify .env.local)

## 🎯 Next Steps

1. **Check S3** - See which folder actually has your images
2. **Restart server** - Load the fixes
3. **Test** - See if images load
4. **If still 403** - Check where objects actually are and update database or move objects

The path normalization should handle most cases, but we need to verify where the objects actually exist in S3!

