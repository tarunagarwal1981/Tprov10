# Fix: RECAPTCHA_SECRET_KEY Missing in Amplify

## Problem Identified ✅

**Error**: `reCAPTCHA not configured - RECAPTCHA_SECRET_KEY missing`

**Root Cause**: The `RECAPTCHA_SECRET_KEY` environment variable is not set or not accessible in your Amplify deployment.

---

## Solution: Add Secret Key to Amplify

### Step 1: Get Your Secret Key

1. Go to: https://www.google.com/recaptcha/admin
2. Find your site (the one with Site Key: `6Lfc9yMsAA...`)
3. Click on the site to view details
4. Copy the **Secret Key** (not the Site Key!)
   - Secret Key usually starts with `6Lfc9yMsAA...` (same prefix as Site Key)
   - It's the **private** key, shown below the Site Key

---

### Step 2: Add to Amplify Environment Variables

#### Via AWS Amplify Console:

1. **Go to**: AWS Amplify Console
   - https://console.aws.amazon.com/amplify

2. **Select**: Your App

3. **Navigate to**: 
   - **App settings** → **Environment variables**

4. **Check if `RECAPTCHA_SECRET_KEY` exists**:
   - Look in the list of environment variables
   - If it's missing, you need to add it

5. **Add the Secret Key**:
   - Click **"Manage variables"** or **"Add variable"**
   - **Key**: `RECAPTCHA_SECRET_KEY`
   - **Value**: Your Secret Key from Step 1
   - **⚠️ IMPORTANT**: 
     - NO `NEXT_PUBLIC_` prefix!
     - Just `RECAPTCHA_SECRET_KEY`
     - No spaces or quotes around the value

6. **Verify both keys are set**:
   - ✅ `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` = `6Lfc9yMsAA...` (with prefix)
   - ✅ `RECAPTCHA_SECRET_KEY` = `6Lfc9yMsAA..._SECRET` (without prefix)

7. **Save** the environment variables

---

### Step 3: Redeploy Your App

**After adding the environment variable:**

1. **Option A - Auto Deploy**:
   - If auto-deploy is enabled, Amplify will automatically redeploy
   - Wait for the build to complete (usually 5-10 minutes)

2. **Option B - Manual Deploy**:
   - Go to Amplify Console → Your App
   - Click **"Redeploy this version"** or trigger a new deployment
   - Wait for deployment to complete

---

### Step 4: Verify the Fix

**After deployment completes:**

1. **Test the login flow**:
   - Go to `/login` page
   - Enter phone number
   - Complete reCAPTCHA
   - Click "NEXT"

2. **Check browser console**:
   - Should NOT see: `RECAPTCHA_SECRET_KEY missing`
   - Should see: Success or different error (if any)

3. **Check server logs** (Amplify/CloudWatch):
   - Should see: `Has secret key: true`
   - Should see: `Secret key length: 40` (or similar)
   - Should NOT see: `RECAPTCHA_SECRET_KEY missing`

---

## Common Mistakes

### ❌ Wrong: Using Site Key as Secret Key
- Site Key and Secret Key are different!
- Site Key is public (starts with `6Lfc9yMsAA...`)
- Secret Key is private (also starts with `6Lfc9yMsAA...` but different value)

### ❌ Wrong: Adding NEXT_PUBLIC_ Prefix
- `RECAPTCHA_SECRET_KEY` should NOT have `NEXT_PUBLIC_` prefix
- Only `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` has the prefix
- Secret key is server-side only, so no prefix needed

### ❌ Wrong: Wrong Variable Name
- Must be exactly: `RECAPTCHA_SECRET_KEY`
- Not: `RECAPTCHA_SECRET` (missing `_KEY`)
- Not: `NEXT_PUBLIC_RECAPTCHA_SECRET_KEY` (has prefix)

### ❌ Wrong: Not Redeploying
- Environment variables only take effect after redeploy
- Just saving variables isn't enough
- Must wait for deployment to complete

---

## Verification Checklist

### In Google reCAPTCHA Admin:
- [ ] Found your site with Site Key: `6Lfc9yMsAA...`
- [ ] Copied the **Secret Key** (not Site Key)
- [ ] Verified both keys are from the same site

### In AWS Amplify:
- [ ] `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` exists (with prefix)
- [ ] `RECAPTCHA_SECRET_KEY` exists (without prefix)
- [ ] Both values are set (not empty)
- [ ] No extra spaces or quotes
- [ ] Saved the environment variables
- [ ] Redeployed the app
- [ ] Deployment completed successfully

### After Testing:
- [ ] No "RECAPTCHA_SECRET_KEY missing" error
- [ ] Server logs show: `Has secret key: true`
- [ ] Login flow works or shows different error (not "missing")

---

## Quick Reference

**Environment Variables Needed:**

```bash
# Frontend (public - exposed to browser)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lfc9yMsAA...YOUR_SITE_KEY

# Backend (private - server-side only)
RECAPTCHA_SECRET_KEY=6Lfc9yMsAA...YOUR_SECRET_KEY
```

**Key Differences:**
- Site Key: Has `NEXT_PUBLIC_` prefix, used in browser
- Secret Key: No prefix, used on server only
- Both must be from the same reCAPTCHA site

---

## Still Not Working?

### Check 1: Verify Variable is Set
- Go to Amplify → Environment variables
- Confirm `RECAPTCHA_SECRET_KEY` is in the list
- Check that the value is not empty

### Check 2: Verify After Redeploy
- Environment variables only work after redeploy
- Check that deployment completed successfully
- Wait a few minutes after adding variable

### Check 3: Check Server Logs
- Look for: `Has secret key: true`
- If still `false`, the variable isn't being read
- May need to check Amplify build configuration

### Check 4: Verify Key Format
- Secret Key should be ~40 characters long
- Should start with same prefix as Site Key
- Should be different from Site Key value

---

## Summary

**The Problem:**
- `RECAPTCHA_SECRET_KEY` is not set in Amplify
- Server can't verify reCAPTCHA tokens
- Error: "RECAPTCHA_SECRET_KEY missing"

**The Fix:**
1. ✅ Get Secret Key from reCAPTCHA admin
2. ✅ Add to Amplify as `RECAPTCHA_SECRET_KEY` (no prefix)
3. ✅ Verify both keys are set
4. ✅ Redeploy app
5. ✅ Test and verify

---

**Next Step**: Add `RECAPTCHA_SECRET_KEY` to Amplify environment variables and redeploy.
