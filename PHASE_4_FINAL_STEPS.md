# Phase 4: Final Steps to Complete URL Update 🔄

## Current Status

- ✅ Files migrated to S3 (30 files)
- ✅ Code updated to use S3
- ⏳ Database URLs need updating (blocked by deployment issues)

---

## Issues to Fix

### **Issue 1: App Crashes (Supabase Missing)**

**Problem:** App tries to use Supabase but env vars aren't in Amplify

**Fix:** Add environment variables to Amplify

1. Go to **Amplify Console** → Your App → **Environment variables**
2. Add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://megmjzszmqnmzdxwzigt.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   ```
3. Also add AWS variables (if not already set):
   ```
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=travel-app-storage-1769
   RDS_HOST=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com
   RDS_PORT=5432
   RDS_DB=postgres
   RDS_USER=postgres
   RDS_PASSWORD=ju3vrLHJUW8PqDG4
   ```
4. Click **Save** → Wait for redeploy (5-10 min)

---

### **Issue 2: API Route Not Deployed**

**Problem:** `/api/admin/update-urls` returns 404

**Fix:** The route exists in code, but needs to be deployed

1. **Option A: Auto-deploy** (if Git connected)
   - The route is already in your code
   - Just commit and push to trigger deployment
   - Or wait for Amplify to redeploy after adding env vars

2. **Option B: Manual deploy**
   - The route file exists: `src/app/api/admin/update-urls/route.ts`
   - Amplify should pick it up on next deployment

---

## After Fixing Issues

Once the app is deployed and working:

1. **Open your Amplify app** in browser
2. **Open browser console** (F12)
3. **Run:**
   ```javascript
   fetch('/api/admin/update-urls', { method: 'POST' })
     .then(r => r.json())
     .then(data => {
       console.log('✅ Result:', data);
       if (data.success) {
         console.log(`Updated ${data.updated.publicUrl} URLs`);
         console.log(`Remaining: ${data.verification.remainingSupabaseUrls}`);
       }
     });
   ```

4. **Verify:**
   - Should see `success: true`
   - Should see `remainingSupabaseUrls: 0`
   - Should see `s3Urls: 30`

---

## Summary

**What's Done:**
- ✅ Files migrated
- ✅ Code updated

**What's Needed:**
- ⏳ Add env vars to Amplify
- ⏳ Wait for deployment
- ⏳ Call API route
- ⏳ Verify URLs updated

---

**Next Action:** Add environment variables to Amplify now! 🚀

