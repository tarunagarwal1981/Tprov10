# 🚀 Netlify Environment Variables Setup Guide

## 🚨 CRITICAL: Your Deployment is Broken

Your site is trying to connect to `http://localhost.invalid` instead of Supabase because **environment variables are not set in Netlify**.

## ✅ Fix This NOW - Step by Step

### Step 1: Go to Netlify Dashboard

1. Go to: https://app.netlify.com/
2. Click on your site: **travelselbuy**
3. Go to: **Site configuration** → **Environment variables**

### Step 2: Add These Environment Variables

Click **Add a variable** and add these **3 variables**:

#### Variable 1: NEXT_PUBLIC_SUPABASE_URL
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://megmjzszmqnmzdxwzigt.supabase.co
```

#### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTE3ODYsImV4cCI6MjA3NTEyNzc4Nn0.BN_tgy60e4UeRyeohwGe48P8QY9KNgFu8dw__AMxRGE
```

#### Variable 3: SUPABASE_SERVICE_ROLE_KEY
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MTc4NiwiZXhwIjoyMDc1MTI3Nzg2fQ.i2kYiW0n-1uuJuTK5HH6sc0W7Vpjrl4SEXBq8TwL-KA
```

### Step 3: Deploy Settings (Important for Next.js)

**For ALL scopes (Production, Deploy Previews, Branch deploys):**
- Make sure all 3 variables are added to **all scopes**
- Or select "Same value for all deploy contexts"

### Step 4: Redeploy

After adding variables:
1. Go to: **Deploys** tab
2. Click: **Trigger deploy** → **Clear cache and deploy site**
3. Wait for deployment to complete (2-5 minutes)

### Step 5: Verify Fix

Once deployed:
1. Open: https://travelselbuy.netlify.app/login
2. Try logging in with: `operator@gmail.com`
3. Check browser console - should NOT see `localhost.invalid` error anymore

## 📸 Visual Guide

### Where to Find Environment Variables in Netlify:

```
Netlify Dashboard
  └─ Your Site (travelselbuy)
     └─ Site configuration (left sidebar)
        └─ Environment variables
           └─ Add a variable (button)
```

### What It Should Look Like:

```
✅ NEXT_PUBLIC_SUPABASE_URL
   Value: https://megmjzszmqnmzdxwzigt.supabase.co
   Scopes: All

✅ NEXT_PUBLIC_SUPABASE_ANON_KEY  
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6...
   Scopes: All

✅ SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6...
   Scopes: All
```

## 🔍 Why This Happened

The code in `src/lib/supabase/client.ts` (line 36) has a fallback:

```typescript
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials missing at init time.');
  return createBrowserClient<Database>('http://localhost.invalid', 'anon');
}
```

This fallback prevents the build from failing, but creates a non-functional deployment.

## ⚠️ Important Notes

1. **Variable Names Must Be EXACT** - Including the `NEXT_PUBLIC_` prefix
2. **No Trailing Spaces** - Copy/paste carefully
3. **All Scopes** - Variables must be available for production builds
4. **Redeploy Required** - Changes don't take effect until you redeploy

## 🎯 Quick Copy-Paste

For your convenience, here's the exact format for Netlify:

```env
NEXT_PUBLIC_SUPABASE_URL=https://megmjzszmqnmzdxwzigt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTE3ODYsImV4cCI6MjA3NTEyNzc4Nn0.BN_tgy60e4UeRyeohwGe48P8QY9KNgFu8dw__AMxRGE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MTc4NiwiZXhwIjoyMDc1MTI3Nzg2fQ.i2kYiW0n-1uuJuTK5HH6sc0W7Vpjrl4SEXBq8TwL-KA
```

## 🧪 Test After Deployment

Run this in your browser console on the deployed site:

```javascript
console.log('Supabase URL:', window.__NEXT_DATA__?.buildId ? 'Check Network Tab' : 'N/A');

// Then try login and check Network tab
// You should see requests to: https://megmjzszmqnmzdxwzigt.supabase.co
// NOT: http://localhost.invalid
```

## 📞 Need Help?

If you're still seeing `localhost.invalid` after adding variables and redeploying:

1. Double-check variable names (exact match required)
2. Make sure variables are in "Production" scope
3. Try a "Clear cache and deploy" instead of normal deploy
4. Check Netlify build logs for any errors

---

**DO THIS NOW - Your production site is broken until you add these variables!** 🚨

