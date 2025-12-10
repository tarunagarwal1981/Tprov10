# Quick Guide: Update Database URLs 🔄

## Problem
RDS is private, so we can't update from local machine.

## ✅ Solution: Use API Route (Easiest)

Since your app is deployed on Amplify (which has VPC access), you can call the API route.

### **Step 1: Deploy the API Route**

The route is already created at `src/app/api/admin/update-urls/route.ts`. 

**Deploy to Amplify:**
- Commit and push to trigger deployment
- Or wait for next deployment

### **Step 2: Call the API**

Once deployed, call it from your browser console or use curl:

```bash
# From browser console (on your deployed site):
fetch('/api/admin/update-urls', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

**Or from terminal (if you have the deployed URL):**
```bash
curl -X POST https://your-amplify-app.amplifyapp.com/api/admin/update-urls
```

### **Step 3: Verify**

Check the response - it should show:
- Number of URLs updated
- Verification counts
- Sample of updated URLs

---

## Alternative: CloudShell

If you prefer CloudShell:

1. Open AWS Console → CloudShell
2. Upload `cloudshell-update-urls.sh`
3. Set `RDS_PASSWORD` environment variable
4. Run the script

See `PHASE_4_UPDATE_URLS_CLOUDSHELL.md` for details.

---

**Recommended: Use the API route** (easiest and fastest) 🚀

