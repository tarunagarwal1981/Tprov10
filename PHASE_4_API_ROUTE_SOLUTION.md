# Phase 4: Update URLs via API Route (Easiest Solution!) 🚀

## Why This Works

Your app is deployed on **AWS Amplify**, which has **VPC access** to RDS. This means the API route can connect to RDS even though CloudShell cannot.

---

## Steps

### **Step 1: Verify API Route is Deployed**

The API route is at: `src/app/api/admin/update-urls/route.ts`

If you haven't deployed it yet:
1. Commit and push to your Git repository
2. Amplify will automatically deploy it

### **Step 2: Call the API Route**

Once deployed, open your deployed app in a browser and run this in the **browser console** (F12 → Console):

```javascript
fetch('/api/admin/update-urls', { 
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => {
    console.log('✅ Update Result:', data);
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

### **Step 3: Check Results**

You should see output like:
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
  },
  "sample": [...]
}
```

---

## Alternative: Use curl (if you have the deployed URL)

```bash
curl -X POST https://your-amplify-app.amplifyapp.com/api/admin/update-urls \
  -H "Content-Type: application/json"
```

---

## Security Note

⚠️ **Important:** The API route currently has no authentication. After running it once, you should either:
1. Add authentication to the route
2. Remove the route after use
3. Add a secret token check

For now, it's fine for a one-time migration.

---

## Why This is Better Than CloudShell

- ✅ No security group changes needed
- ✅ Works immediately (Amplify has VPC access)
- ✅ Can verify results in browser
- ✅ Easier to use

---

**Ready to try?** Open your deployed app and run the fetch command in the browser console! 🚀

