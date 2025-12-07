# Fix: reCAPTCHA Server-Side Verification Failed ❌

## Problem Identified

**Error**: `reCAPTCHA verification failed` (400 error)

**Status**:
- ✅ Client-side: Widget working, token received
- ❌ Server-side: Verification failing

**Root Cause**: The `RECAPTCHA_SECRET_KEY` is either:
1. Not set in Amplify environment variables
2. Wrong key (doesn't match the site key)
3. Key is for a different reCAPTCHA site

---

## Solution: Fix Server-Side Verification

### Step 1: Verify Secret Key in Amplify

**In AWS Amplify Console:**

1. Go to: **Your App** → **App settings** → **Environment variables**
2. **Check if `RECAPTCHA_SECRET_KEY` exists**:
   - Should be listed in the environment variables
   - Should NOT have `NEXT_PUBLIC_` prefix
   - Value should be the Secret Key from Google reCAPTCHA admin

3. **If missing or wrong**:
   - Get Secret Key from: https://www.google.com/recaptcha/admin
   - Find your site → Copy **Secret Key** (not Site Key!)
   - Add/Update in Amplify: `RECAPTCHA_SECRET_KEY` = `YOUR_SECRET_KEY`

---

### Step 2: Verify Key Pair Matches

**The Site Key and Secret Key MUST be from the SAME reCAPTCHA site!**

**Check in Google reCAPTCHA Admin:**

1. Go to: https://www.google.com/recaptcha/admin
2. Find your site
3. Verify:
   - **Site Key** (in Amplify as `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`) matches
   - **Secret Key** (in Amplify as `RECAPTCHA_SECRET_KEY`) matches
   - Both are from the **same site** (same row in the admin)

**Common Mistake:**
- ❌ Site Key from Site A, Secret Key from Site B
- ✅ Both keys from the same site

---

### Step 3: Check Amplify Environment Variables

**Required Variables:**

```bash
# Frontend (public - exposed to browser)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Backend (private - server-side only)
RECAPTCHA_SECRET_KEY=6LdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX_SECRET
```

**⚠️ Important:**
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` - **WITH** `NEXT_PUBLIC_` prefix
- `RECAPTCHA_SECRET_KEY` - **WITHOUT** `NEXT_PUBLIC_` prefix
- Both must be from the same reCAPTCHA site
- No extra spaces or quotes

---

### Step 4: Check Server Logs

**After redeploying, check Amplify build logs or CloudWatch:**

Look for these messages:
- `🔍 Verifying reCAPTCHA token...` - Verification started
- `❌ reCAPTCHA verification failed:` - Error details
- `✅ reCAPTCHA verification successful` - Success

**Error codes to look for:**
- `invalid-input-response` - Token is invalid or expired
- `invalid-input-secret` - Secret key is wrong
- `missing-input-secret` - Secret key not set
- `timeout-or-duplicate` - Token already used or expired

---

### Step 5: Common Issues & Fixes

#### Issue 1: Secret Key Not Set

**Symptoms:**
- Server logs show: `❌ RECAPTCHA_SECRET_KEY not set`
- Error: `reCAPTCHA not configured`

**Fix:**
1. Go to Amplify → Environment variables
2. Add: `RECAPTCHA_SECRET_KEY` = Your Secret Key
3. Redeploy

---

#### Issue 2: Wrong Secret Key

**Symptoms:**
- Error: `invalid-input-secret`
- Verification fails even with token

**Fix:**
1. Go to reCAPTCHA admin
2. Find your site
3. Copy the **Secret Key** (not Site Key!)
4. Update in Amplify
5. Redeploy

---

#### Issue 3: Key Mismatch

**Symptoms:**
- Site Key and Secret Key from different sites
- Verification fails

**Fix:**
1. Verify both keys are from the same site in reCAPTCHA admin
2. If not, create a new site and use both keys from it
3. Update both in Amplify
4. Redeploy

---

#### Issue 4: Token Expired

**Symptoms:**
- Error: `timeout-or-duplicate`
- Token was already used

**Fix:**
- This is normal - tokens expire after use
- User needs to complete reCAPTCHA again
- Widget should auto-reset

---

## Verification Steps

### 1. Check Amplify Environment Variables

**In Amplify Console:**
- [ ] `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` exists (with prefix)
- [ ] `RECAPTCHA_SECRET_KEY` exists (without prefix)
- [ ] Both values are set (not empty)
- [ ] No extra spaces or quotes

### 2. Verify Keys Match

**In Google reCAPTCHA Admin:**
- [ ] Site Key in Amplify matches Site Key in admin
- [ ] Secret Key in Amplify matches Secret Key in admin
- [ ] Both keys are from the same site (same row)

### 3. Test After Fix

1. **Redeploy** app in Amplify
2. **Wait** for deployment to complete
3. **Test** the login flow:
   - Enter phone number
   - Complete reCAPTCHA
   - Click "NEXT"
   - Should NOT see "reCAPTCHA verification failed" error

### 4. Check Server Logs

**In Amplify Console → Build logs or CloudWatch:**
- Should see: `✅ reCAPTCHA verification successful`
- Should NOT see: `❌ reCAPTCHA verification failed`

---

## Quick Fix Checklist

- [ ] Go to Google reCAPTCHA admin
- [ ] Find your site (v2 Checkbox type)
- [ ] Copy **Secret Key** (the private one)
- [ ] Go to Amplify → Environment variables
- [ ] Add/Update: `RECAPTCHA_SECRET_KEY` = Secret Key
- [ ] Verify `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is also set
- [ ] Verify both keys are from the same site
- [ ] Save environment variables
- [ ] Redeploy app
- [ ] Test login flow

---

## Debugging: Check Server Logs

**After the fix, when you test, check:**

1. **Amplify Build Logs**:
   - Go to Amplify Console → Your App → Build history
   - Check latest build logs
   - Look for reCAPTCHA verification messages

2. **CloudWatch Logs** (if configured):
   - Check `/aws/amplify/your-app` log group
   - Look for reCAPTCHA verification errors

3. **Network Tab** (Browser):
   - Check the `/api/auth/phone/init` request
   - Look at the response body for error details

---

## Expected Behavior After Fix

**Console Logs (Server-side):**
```
🔍 Verifying reCAPTCHA token...
✅ reCAPTCHA verification successful: { hostname: '...', ... }
```

**Console Logs (Client-side):**
```
✅ reCAPTCHA token received
[No error - request succeeds]
```

**User Experience:**
- Completes reCAPTCHA
- Clicks "NEXT"
- Proceeds to OTP page or signup form
- No "verification failed" error

---

## Summary

**The Problem:**
- Client gets token ✅
- Server verification fails ❌
- Most likely: `RECAPTCHA_SECRET_KEY` missing or wrong

**The Fix:**
1. ✅ Get Secret Key from reCAPTCHA admin
2. ✅ Add to Amplify as `RECAPTCHA_SECRET_KEY`
3. ✅ Verify it matches the Site Key (same site)
4. ✅ Redeploy app
5. ✅ Test

---

**Next Step**: Check Amplify environment variables and ensure `RECAPTCHA_SECRET_KEY` is set correctly.
