# Fix: RECAPTCHA_SECRET_KEY Branch Configuration Issue

## Problem Identified ✅

**From Screenshots:**
- ✅ `RECAPTCHA_SECRET_KEY` is set in **"dev" branch**
- ❌ `RECAPTCHA_SECRET_KEY` is **NOT** visible in **"All branches"**
- ❌ Error: `reCAPTCHA not configured - RECAPTCHA_SECRET_KEY missing`

**Root Cause**: The environment variable is set for "dev" branch only, but your app might be:
1. Running on a different branch (main, production, etc.)
2. Using "All branches" configuration which doesn't have the key
3. Not redeployed after adding the variable

---

## Solution: Set RECAPTCHA_SECRET_KEY for All Branches

### Step 1: Verify Current Branch Configuration

**In AWS Amplify Console:**

1. Go to: **Your App** → **App settings** → **Environment variables**
2. **Check the branch selector** (top of the page):
   - Is it set to "All branches" or a specific branch?
   - What branch is your current deployment using?

3. **Check if `RECAPTCHA_SECRET_KEY` exists**:
   - For "All branches"
   - For your active deployment branch (main, production, etc.)

---

### Step 2: Add RECAPTCHA_SECRET_KEY to "All branches"

**This ensures it works for ALL branches:**

1. **In Amplify Console** → **Environment variables**
2. **Select "All branches"** from the branch dropdown (if not already selected)
3. **Check if `RECAPTCHA_SECRET_KEY` exists**:
   - If missing, click **"Manage variables"** or **"Add variable"**
   - **Key**: `RECAPTCHA_SECRET_KEY`
   - **Value**: `6Lfc9yMsAAAAAJDI_aTHdk2_VMewjG12CifG81U4` (from your Google reCAPTCHA admin)
   - **⚠️ IMPORTANT**: 
     - NO `NEXT_PUBLIC_` prefix
     - No spaces or quotes
     - Must match the Secret Key from your reCAPTCHA site

4. **Save** the environment variable

---

### Step 3: Verify Both Keys Are Set for "All branches"

**Check these variables exist for "All branches":**

- ✅ `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` = `6Lfc9yMsAAAAAKSNUUMQKSOcupjVL3lcnKnayyMc`
- ✅ `RECAPTCHA_SECRET_KEY` = `6Lfc9yMsAAAAAJDI_aTHdk2_VMewjG12CifG81U4`

**Both should be:**
- Set for "All branches" (or your deployment branch)
- Have correct values (matching Google reCAPTCHA admin)
- No extra spaces or quotes

---

### Step 4: Redeploy Your App

**After adding/updating the environment variable:**

1. **Option A - Auto Deploy**:
   - If auto-deploy is enabled, Amplify will automatically redeploy
   - Wait for the build to complete (usually 5-10 minutes)

2. **Option B - Manual Deploy**:
   - Go to Amplify Console → Your App
   - Click **"Redeploy this version"** or trigger a new deployment
   - **Important**: Make sure you're deploying the branch that has the variable set

3. **Wait for deployment** to complete

---

### Step 5: Verify the Fix

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
   - Should see: `Secret key prefix: 6Lfc9yMsAA...`

---

## Branch Configuration Best Practices

### Option 1: Set for "All branches" (Recommended)

**Pros:**
- Works for all branches automatically
- No need to configure per branch
- Easier to manage

**Cons:**
- Same key for all environments (dev, staging, prod)
- Less granular control

**When to use:**
- When you want the same reCAPTCHA keys for all environments
- For simpler setups

---

### Option 2: Set per Branch (Advanced)

**Pros:**
- Different keys per environment
- More secure (separate keys for prod)
- Better for multi-environment setups

**Cons:**
- Need to configure for each branch
- More complex to manage

**When to use:**
- When you have separate reCAPTCHA sites for dev/staging/prod
- For enterprise setups with multiple environments

---

## Common Issues

### Issue 1: Variable Set for Wrong Branch

**Symptoms:**
- Variable exists in "dev" but app runs on "main"
- Error: `RECAPTCHA_SECRET_KEY missing`

**Fix:**
- Set variable for "All branches" OR
- Set variable for the branch your app is using

---

### Issue 2: Not Redeployed After Adding Variable

**Symptoms:**
- Variable is set in Amplify
- Error still persists
- Server logs show: `Has secret key: false`

**Fix:**
- Redeploy the app after adding the variable
- Wait for deployment to complete
- Environment variables only take effect after redeploy

---

### Issue 3: Variable Name Typo

**Symptoms:**
- Variable exists but with wrong name
- Error: `RECAPTCHA_SECRET_KEY missing`

**Fix:**
- Verify exact name: `RECAPTCHA_SECRET_KEY`
- Not: `RECAPTCHA_SECRET` (missing `_KEY`)
- Not: `NEXT_PUBLIC_RECAPTCHA_SECRET_KEY` (has prefix)

---

## Verification Checklist

### In AWS Amplify:
- [ ] Selected "All branches" (or your deployment branch)
- [ ] `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` exists (with prefix)
- [ ] `RECAPTCHA_SECRET_KEY` exists (without prefix)
- [ ] Both values are set (not empty)
- [ ] Values match Google reCAPTCHA admin
- [ ] Saved the environment variables
- [ ] Redeployed the app
- [ ] Deployment completed successfully

### After Testing:
- [ ] No "RECAPTCHA_SECRET_KEY missing" error
- [ ] Server logs show: `Has secret key: true`
- [ ] Server logs show: `Secret key length: 40`
- [ ] Login flow works or shows different error (not "missing")

---

## Quick Fix Steps

1. ✅ Go to Amplify → Environment variables
2. ✅ Select **"All branches"** from dropdown
3. ✅ Add/Update: `RECAPTCHA_SECRET_KEY` = `6Lfc9yMsAAAAAJDI_aTHdk2_VMewjG12CifG81U4`
4. ✅ Verify `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is also set for "All branches"
5. ✅ Save environment variables
6. ✅ Redeploy app
7. ✅ Wait for deployment to complete
8. ✅ Test login flow

---

## Summary

**The Problem:**
- `RECAPTCHA_SECRET_KEY` is set for "dev" branch only
- App might be running on different branch or "All branches"
- Variable not available at runtime

**The Fix:**
1. ✅ Set `RECAPTCHA_SECRET_KEY` for **"All branches"** (or your deployment branch)
2. ✅ Verify both keys are set
3. ✅ Redeploy app
4. ✅ Test and verify

---

**Next Step**: Add `RECAPTCHA_SECRET_KEY` to "All branches" in Amplify and redeploy.
