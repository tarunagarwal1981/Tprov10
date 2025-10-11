# 📦 Storage Bucket Setup Guide - Fix 500 Error

## Problem
Getting **500 Internal Server Error** when uploading images because:
1. Storage bucket doesn't exist OR
2. Storage bucket policies are not configured

## Solution: Use Supabase Dashboard (Not SQL)

You can't set storage policies via SQL Editor due to permissions. Use the Supabase Dashboard instead:

---

## 📋 Step-by-Step Instructions

### Step 1: Go to Storage
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/megmjzszmqnmzdxwzigt
2. Click **Storage** in the left sidebar
3. Look for a bucket named `activity-packages`

### Step 2A: If Bucket Doesn't Exist → Create It

1. Click **"New bucket"** button (top right)
2. Fill in:
   - **Name:** `activity-packages`
   - **Public bucket:** ✅ **ON** (toggle to enabled)
   - **File size limit:** 52428800 (50 MB)
   - **Allowed MIME types:** Leave empty (allow all) or add: `image/jpeg,image/png,image/webp,image/gif`
3. Click **"Create bucket"**

### Step 2B: If Bucket Exists → Check Settings

1. Click on the `activity-packages` bucket
2. Click **Settings** (gear icon at top)
3. Verify:
   - ✅ **Public bucket** is **ON**
   - ✅ File size limit is reasonable (at least 10 MB)
4. Click **Save** if you made changes

### Step 3: Configure Bucket Policies

1. While in the `activity-packages` bucket, click **"Policies"** tab
2. You should see a button **"New Policy"** or policy configuration

#### Policy 1: Allow Authenticated Users to Upload (REQUIRED)

Click **"New Policy"** and configure:

```
Policy name: Allow authenticated uploads
Allowed operation: INSERT
Target roles: authenticated
USING expression: (bucket_id = 'activity-packages'::text)
WITH CHECK expression: ((bucket_id = 'activity-packages'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
```

**Or use the "For authenticated users only" template and customize it.**

#### Policy 2: Allow Public Read Access (REQUIRED)

Click **"New Policy"** again:

```
Policy name: Public read access
Allowed operation: SELECT
Target roles: public
USING expression: (bucket_id = 'activity-packages'::text)
```

**Or use the "For public read access" template.**

#### Policy 3: Allow Authenticated Users to Delete (Optional)

```
Policy name: Allow authenticated delete
Allowed operation: DELETE
Target roles: authenticated
USING expression: ((bucket_id = 'activity-packages'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
```

### Step 4: Alternative - Use Policy Templates

Supabase provides templates. When creating a policy:

1. Click **"Use a template"** dropdown
2. Select these templates:
   - ✅ **"Allow authenticated uploads"** → Customize bucket_id to `activity-packages`
   - ✅ **"Allow public read access"** → Customize bucket_id to `activity-packages`
3. Click **Save policy** for each

---

## 🔧 Quick Visual Checklist

After setup, your Storage → activity-packages → Policies should show:

```
✅ Policy: Allow authenticated uploads
   Operation: INSERT
   Target: authenticated users

✅ Policy: Public read access  
   Operation: SELECT
   Target: public (everyone)

✅ Policy: Allow authenticated delete (optional)
   Operation: DELETE
   Target: authenticated users
```

---

## ✅ Verification

### Test 1: Upload via Dashboard
1. Go to Storage → `activity-packages`
2. Click **"Upload file"** button
3. Try uploading a test image
4. If it works → Bucket is configured ✅

### Test 2: Upload via App
1. Go to your app: https://travelselbuy.netlify.app
2. Try creating a package with images
3. Should work now! No more 500 errors ✅

---

## 🚨 Common Issues

### Issue: "Bucket is private"
**Fix:** Enable "Public bucket" toggle in bucket settings

### Issue: "New policies not showing"
**Fix:** 
1. Refresh the Supabase Dashboard page
2. Or click "Policies" tab again

### Issue: "Policy validation error"
**Fix:** Make sure:
- Bucket name is exactly `activity-packages` (no spaces, lowercase)
- Expression syntax is correct (copy from above)

---

## 📚 Additional Resources

- Supabase Storage Docs: https://supabase.com/docs/guides/storage
- Storage RLS Policies: https://supabase.com/docs/guides/storage/security/access-control

---

## 🎯 Summary

| What | Where | Action |
|------|-------|--------|
| **Database RLS** | SQL Editor | ✅ Run `fix-database-rls-only.sql` |
| **Storage Bucket** | Dashboard → Storage | ✅ Create `activity-packages` bucket |
| **Storage Policies** | Dashboard → Storage → Policies | ✅ Add upload & read policies |

**After both are done → Package creation will work perfectly!** 🚀

