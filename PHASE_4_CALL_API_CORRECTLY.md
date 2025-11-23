# Phase 4: Call API Route Correctly 🔧

## Problem
You tried to call the API from AWS Console, but it needs to be called from your **deployed Amplify app**.

---

## Solution: Use the Correct URL

### **Step 1: Find Your Amplify App URL**

**Option A: AWS Console**
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click on your app
3. Copy the app URL (e.g., `https://main.xxxxx.amplifyapp.com`)

**Option B: AWS CLI**
```bash
aws amplify list-apps
aws amplify get-app --app-id YOUR_APP_ID
```

**Option C: Check Your Git Repository**
- Look for Amplify deployment URLs in your repository README or documentation

---

### **Step 2: Call the API from Your App**

**Option A: From Browser Console on Your App**

1. Open your deployed app in a browser: `https://YOUR_APP_URL.amplifyapp.com`
2. Open browser console (F12 → Console)
3. Run:

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
    } else {
      console.error('❌ Error:', data);
    }
  })
  .catch(error => {
    console.error('❌ Request failed:', error);
  });
```

**Option B: From Any Terminal (using curl)**

```bash
curl -X POST https://YOUR_APP_URL.amplifyapp.com/api/admin/update-urls \
  -H "Content-Type: application/json"
```

---

### **Step 3: Verify Results**

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
  "sample": [
    {
      "id": "...",
      "public_url": "https://travel-app-storage-1769.s3.us-east-1.amazonaws.com/...",
      "storage_path": "activity-package-images/..."
    }
  ]
}
```

---

## Common Errors

### **403 Forbidden / Missing Authentication Token**
- **Cause:** Calling from wrong domain (e.g., AWS Console)
- **Fix:** Call from your Amplify app URL

### **404 Not Found**
- **Cause:** API route not deployed yet
- **Fix:** Commit and push to trigger Amplify deployment

### **500 Internal Server Error**
- **Cause:** Database connection issue or SQL error
- **Fix:** Check Amplify logs for details

---

## Quick Test

To test if the API route exists:

```javascript
// From your app's browser console
fetch('/api/admin/update-urls', { method: 'GET' })
  .then(r => r.text())
  .then(console.log);
```

If you get a 404, the route isn't deployed yet.

---

**Important:** Make sure you're calling from your **deployed Amplify app**, not AWS Console! 🚀

