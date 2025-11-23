# Phase 4: Final Solution - Use API Route 🚀

## ✅ Why API Route is Best

Since EC2 connection is having issues, the **API route approach is the simplest and most reliable**:

- ✅ Already created: `src/app/api/admin/update-urls/route.ts`
- ✅ Amplify has VPC access to RDS
- ✅ No EC2 connection needed
- ✅ Can verify results in browser
- ✅ Works immediately after deployment

---

## 🚀 Quick Steps

### **Step 1: Verify API Route is Deployed**

The route should already be in your code. If Amplify is connected to Git, it should auto-deploy.

**Or manually trigger deployment:**
- Commit and push to your repository
- Amplify will automatically deploy

---

### **Step 2: Call API Route from Browser**

1. **Open your deployed Amplify app** in browser
   - URL: `https://main.d2p2uq8t9xysui.amplifyapp.com` (or your app URL)

2. **Open browser console** (F12 → Console tab)

3. **Run this command:**
   ```javascript
   fetch('/api/admin/update-urls', { method: 'POST' })
     .then(r => r.json())
     .then(data => {
       console.log('✅ Result:', data);
       if (data.success) {
         console.log(`Updated ${data.updated.publicUrl} public_url records`);
         console.log(`Updated ${data.updated.storagePath} storage_path records`);
         console.log(`Remaining Supabase URLs: ${data.verification.remainingSupabaseUrls}`);
         console.log(`S3 URLs: ${data.verification.s3Urls}`);
       }
     })
     .catch(error => {
       console.error('❌ Error:', error);
     });
   ```

---

### **Step 3: Verify Results**

You should see:
```json
{
  "success": true,
  "updated": {
    "publicUrl": 30,
    "storagePath": 30
  },
  "verification": {
    "remainingSupabaseUrls": 0,
    "s3Urls": 30
  }
}
```

---

## ✅ After Success

1. ✅ Database URLs updated
2. ✅ Phase 4 complete!
3. 🧹 Terminate EC2 instance (optional):
   ```bash
   aws ec2 terminate-instances --instance-ids i-056a065313dae8712
   ```

---

## 🎯 Why This Works

- Amplify is deployed in your VPC
- Has direct access to RDS
- No connection issues
- No EC2 needed
- Works immediately

---

**This is the easiest and most reliable method!** 🚀

Try it now - open your Amplify app and run the fetch command in the browser console!

