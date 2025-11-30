# Fix Netlify Environment Variables - Supabase Connection

## Problem

Getting `ERR_NAME_NOT_RESOLVED` on Netlify deployed site, but Supabase project is confirmed working (status 200 OK).

## Root Cause

Environment variables in Netlify need:
1. Correct `NEXT_PUBLIC_` prefix for client-side variables
2. To be set in the right scope (all contexts)
3. A new deployment after changes

## ✅ Verified Working

Your Supabase project is **ACTIVE and HEALTHY**:
- URL: `https://megmjzszmqnmzdxwzigt.supabase.co` ✅
- Status: 200 OK ✅
- Response time: 425ms ✅
- JWT token valid until 2035 ✅

## Fix Steps

### Step 1: Check Environment Variable Names

In Netlify Dashboard → Site Settings → Environment Variables, verify you have **EXACTLY** these names:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

**⚠️ CRITICAL**: The `NEXT_PUBLIC_` prefix is REQUIRED for client-side access in Next.js!

### Step 2: Verify Variable Values

Check that the values match exactly:

```bash
# MUST have the https:// protocol
NEXT_PUBLIC_SUPABASE_URL=https://megmjzszmqnmzdxwzigt.supabase.co

# Full JWT token (no quotes, no spaces) - Replace with your actual anon key
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]

# Service role (server-side only) - Replace with your actual service role key
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]
```

### Step 3: Set Variables in Netlify (Detailed)

1. **Go to Netlify Dashboard**
   - https://app.netlify.com
   - Select your site

2. **Navigate to Environment Variables**
   - Click **"Site settings"**
   - Scroll to **"Environment variables"**
   - Click **"Edit variables"** or **"Add a variable"**

3. **Add Each Variable**
   
   **Variable 1:**
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://megmjzszmqnmzdxwzigt.supabase.co`
   - Scopes: ✅ All scopes (Production, Deploy Previews, Branch deploys)
   - Click **"Save"**

   **Variable 2:**
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: (paste the full JWT token from above)
   - Scopes: ✅ All scopes
   - Click **"Save"**

   **Variable 3:**
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: (paste the service role key from above)
   - Scopes: ✅ All scopes
   - Click **"Save"**

### Step 4: Common Mistakes to Avoid

❌ **Wrong prefix**:
```
SUPABASE_URL=...           # Missing NEXT_PUBLIC_
PUBLIC_SUPABASE_URL=...    # Wrong prefix
```

✅ **Correct**:
```
NEXT_PUBLIC_SUPABASE_URL=...
```

❌ **Missing protocol**:
```
NEXT_PUBLIC_SUPABASE_URL=megmjzszmqnmzdxwzigt.supabase.co
```

✅ **Correct**:
```
NEXT_PUBLIC_SUPABASE_URL=https://megmjzszmqnmzdxwzigt.supabase.co
```

❌ **Quotes or spaces**:
```
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_URL= https://...
```

✅ **Correct**:
```
NEXT_PUBLIC_SUPABASE_URL=https://...
```

### Step 5: Trigger New Deployment

After setting/updating environment variables:

**Option A: Trigger Redeploy (Fastest)**
1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** dropdown
3. Select **"Deploy site"**
4. Wait for build to complete (2-5 minutes)

**Option B: Git Push (Recommended)**
```bash
# Make a small change (like adding a comment)
git commit --allow-empty -m "Trigger redeploy with env vars"
git push origin dev
```

### Step 6: Verify in Build Log

After triggering deployment:

1. Go to **"Deploys"** → Click latest deploy
2. Check build log for:
   ```
   ✓ Linting and checking validity of types
   ✓ Compiled successfully
   ```
3. Look for environment variables (they won't show values for security):
   ```
   - Environments: .env.local
   ```

### Step 7: Test the Live Site

1. Open your Netlify URL
2. Open browser console (F12)
3. Try to login
4. Check console for:
   ```javascript
   // Should see connection attempt to correct URL
   🔐 Starting login process for: operator@gmail.com
   [Auth] signInWithPassword endpoint: https://megmjzszmqnmzdxwzigt.supabase.co/auth/v1
   ```

## Verification Checklist

After deployment, verify:

- [ ] Environment variables have `NEXT_PUBLIC_` prefix
- [ ] No typos in variable names
- [ ] Values have no quotes or extra spaces
- [ ] URL includes `https://` protocol
- [ ] Variables are set for all scopes
- [ ] New deployment triggered after setting vars
- [ ] Build completed successfully
- [ ] Browser console shows correct Supabase URL
- [ ] No `ERR_NAME_NOT_RESOLVED` error

## Debug: Check Runtime Environment Variables

Add this temporary debug page to verify env vars are loaded:

Create `src/app/debug-env/page.tsx`:
```typescript
export default function DebugEnv() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variables Debug</h1>
      <pre>
        NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}
        <br />
        NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET ✅' : 'NOT SET ❌'}
      </pre>
    </div>
  );
}
```

Access at: `https://your-site.netlify.app/debug-env`

**Expected output**:
```
NEXT_PUBLIC_SUPABASE_URL: https://megmjzszmqnmzdxwzigt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY: SET ✅
```

## Alternative: Use Netlify CLI

Set environment variables via CLI:

```bash
# Install Netlify CLI if not installed
npm install -g netlify-cli

# Login
netlify login

# Link to your site
netlify link

# Set environment variables (replace with your actual values)
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://[YOUR_PROJECT_REF].supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "[YOUR_SUPABASE_ANON_KEY]"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "[YOUR_SUPABASE_SERVICE_ROLE_KEY]"

# List to verify
netlify env:list

# Trigger build
netlify build
netlify deploy --prod
```

## Screenshot Guide

Your Netlify environment variables page should look like this:

```
Environment variables (3)

🔑 NEXT_PUBLIC_SUPABASE_URL
   Production, Deploy Previews, Branch deploys
   Value: https://megmjzszmqnmzdxwzigt.supabase.co

🔑 NEXT_PUBLIC_SUPABASE_ANON_KEY
   Production, Deploy Previews, Branch deploys
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (hidden)

🔑 SUPABASE_SERVICE_ROLE_KEY
   Production, Deploy Previews, Branch deploys
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (hidden)
```

## Still Having Issues?

If the error persists after following all steps:

1. **Clear Netlify cache and redeploy**:
   - Go to Site Settings → Build & deploy
   - Click "Clear cache and retry deploy"

2. **Check Supabase project status**:
   - Go to https://supabase.com/dashboard
   - Verify project is not paused

3. **Test Supabase directly**:
   ```bash
   curl https://megmjzszmqnmzdxwzigt.supabase.co/rest/v1/
   ```
   Should return: `{"message":"Welcome to PostgREST"}`

4. **Check browser console for actual URL being used**:
   - Look for the exact URL in the failed request
   - Compare with your env var value

## Summary

The fix is simple: **Ensure NEXT_PUBLIC_ prefix + redeploy**

Your Supabase is working fine. The issue is just environment variable configuration in Netlify.


