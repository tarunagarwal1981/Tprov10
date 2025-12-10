# Setting Up reCAPTCHA in AWS Amplify

## Current Issue: "Invalid key type" Error

**Problem**: Your reCAPTCHA key type doesn't match the widget type.

**Solution**: Create a new v2 Checkbox key and update Amplify environment variables.

---

## Step-by-Step Fix

### Step 1: Create Correct reCAPTCHA Key in Google

1. **Go to**: https://www.google.com/recaptcha/admin
2. **Click**: **"+"** or **"Create"** button
3. **Fill in**:
   - **Label**: `TravClan Production` (or any name)
   - **reCAPTCHA type**: 
     ```
     ✅ v2 → "I'm not a robot" Checkbox
     ```
     **⚠️ MUST be Checkbox, NOT v3 or Invisible!**
   
   - **Domains**: Add these (one per line):
     ```
     localhost
     127.0.0.1
     dev.travelselbuy.com
     *.dev.travelselbuy.com
     travelselbuy.com
     *.travelselbuy.com
     ```
   
   - **Accept** Terms of Service
   - **Click**: Submit

4. **Copy the keys**:
   - **Site Key**: `6LdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` → Use for `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - **Secret Key**: `6LdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX_SECRET` → Use for `RECAPTCHA_SECRET_KEY`

---

### Step 2: Update AWS Amplify Environment Variables

#### Option A: Via Amplify Console (Recommended)

1. **Go to**: AWS Amplify Console
2. **Select**: Your App
3. **Navigate to**: **App settings** → **Environment variables**
4. **Add/Update** these variables:

   **Variable 1:**
   - **Key**: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - **Value**: `6LdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` (your Site Key)
   - **⚠️ Important**: Must have `NEXT_PUBLIC_` prefix!

   **Variable 2:**
   - **Key**: `RECAPTCHA_SECRET_KEY`
   - **Value**: `6LdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX_SECRET` (your Secret Key)
   - **⚠️ Important**: NO `NEXT_PUBLIC_` prefix!

5. **Click**: **Save**

#### Option B: Via Amplify CLI

```bash
# Set Site Key (public)
amplify env add NEXT_PUBLIC_RECAPTCHA_SITE_KEY

# Set Secret Key (private)
amplify env add RECAPTCHA_SECRET_KEY
```

---

### Step 3: Redeploy Your App

**After updating environment variables:**

1. **Option A - Auto Deploy**: 
   - If you have auto-deploy enabled, Amplify will automatically redeploy
   - Wait for the build to complete

2. **Option B - Manual Deploy**:
   - Go to Amplify Console → Your App
   - Click **"Redeploy this version"** or trigger a new deployment

3. **Wait for deployment** to complete (usually 5-10 minutes)

---

### Step 4: Verify the Fix

1. **After deployment completes**, visit your app
2. **Go to**: `/login` page
3. **Switch to**: "Phone Number" tab
4. **Check**:
   - ✅ reCAPTCHA widget should appear (no error)
   - ✅ Should show "I'm not a robot" checkbox
   - ✅ Should NOT show "Invalid key type" error
   - ✅ Button should enable after completing reCAPTCHA

5. **Check browser console** (F12):
   - Should see: `✅ reCAPTCHA script loaded successfully`
   - Should see: `✅ reCAPTCHA widget rendered (v2)`
   - Should NOT see: "Invalid key type" error

---

## Verification Checklist

### In Google reCAPTCHA Admin:
- [ ] Site created with **v2 → "I'm not a robot" Checkbox** type
- [ ] Type column shows **"v2"** or **"Checkbox"** (NOT v3 or Invisible)
- [ ] `localhost` is added to domains
- [ ] Production domain is added to domains
- [ ] Site Key copied (starts with `6Ld...`)

### In AWS Amplify:
- [ ] `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set (with `NEXT_PUBLIC_` prefix)
- [ ] `RECAPTCHA_SECRET_KEY` is set (without `NEXT_PUBLIC_` prefix)
- [ ] No extra spaces or quotes in values
- [ ] App redeployed after updating variables

### In Browser:
- [ ] Widget appears without error
- [ ] Can complete reCAPTCHA challenge
- [ ] Button enables after completing reCAPTCHA
- [ ] Console shows success messages

---

## Troubleshooting

### Still Seeing "Invalid key type"?

1. **Double-check key type in reCAPTCHA admin**:
   - Go to: https://www.google.com/recaptcha/admin
   - Check the **Type** column
   - Must say **"v2"** or **"Checkbox"**

2. **Verify Amplify variables**:
   - Check variable names are EXACTLY:
     - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (with prefix)
     - `RECAPTCHA_SECRET_KEY` (without prefix)

3. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear cache completely

4. **Wait for deployment**:
   - Environment variables only take effect after redeploy
   - Check Amplify build logs to confirm deployment completed

---

## Key Type Reference

| Key Type | Script URL | Widget Appearance | Works with Our Code? |
|----------|-----------|-------------------|---------------------|
| **v2 Checkbox** | `api.js?render=explicit` | "I'm not a robot" checkbox | ✅ **YES** |
| v2 Invisible | `api.js?render=explicit` | No checkbox (invisible) | ❌ NO |
| v3 | `api.js?render=KEY` | No widget (score-based) | ❌ NO |

**Our code uses**: v2 Checkbox with explicit render
**You need**: v2 Checkbox key

---

## Summary

**The Fix:**
1. ✅ Create **NEW** site in Google reCAPTCHA admin
2. ✅ Select **v2 → "I'm not a robot" Checkbox** (NOT v3!)
3. ✅ Add all domains (localhost + production)
4. ✅ Copy Site Key → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` in Amplify
5. ✅ Copy Secret Key → `RECAPTCHA_SECRET_KEY` in Amplify
6. ✅ Redeploy app
7. ✅ Test and verify

**The Error Means:**
- Your current key is v3 or v2 Invisible
- You need v2 Checkbox key instead
- Create a new site with the correct type

---

**Next Step**: Create a new v2 Checkbox site in Google reCAPTCHA admin, then update Amplify environment variables.
