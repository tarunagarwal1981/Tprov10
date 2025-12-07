# Fix: "Invalid key type" Error 🔧

## Problem Identified

**Error**: `ERROR for site owner: Invalid key type`

**Root Cause**: Your reCAPTCHA site key doesn't match the widget type being rendered.

**Our Code Uses**: reCAPTCHA **v2 Checkbox** with **explicit rendering**
- Script: `https://www.google.com/recaptcha/api.js?render=explicit`
- Widget: v2 "I'm not a robot" Checkbox

**Your Key Is Likely**: 
- ❌ reCAPTCHA v3 (Invisible - score-based)
- ❌ reCAPTCHA v2 Invisible
- ✅ **Should be**: reCAPTCHA v2 Checkbox

---

## Solution: Create Correct reCAPTCHA Key

### Step 1: Go to Google reCAPTCHA Admin

1. **Navigate to**: https://www.google.com/recaptcha/admin
2. **Sign in** with your Google account

### Step 2: Create New Site (or Edit Existing)

**If you have an existing site:**
- Check the **Type** column
- If it says "v3" or "v2 Invisible", you need to create a NEW site

**Create New Site:**
1. Click **"+"** button (top right) or **"Create"**
2. Fill in the form:

#### ✅ Correct Settings:

**Label**: 
```
TravClan Auth
```

**reCAPTCHA type**: 
```
✅ v2 → "I'm not a robot" Checkbox
```
**⚠️ IMPORTANT**: Must be **v2 Checkbox**, NOT v3 or v2 Invisible!

**Domains**: Add ALL of these:
```
localhost
127.0.0.1
dev.travelselbuy.com
*.dev.travelselbuy.com
travelselbuy.com
*.travelselbuy.com
```

**⚠️ Important Notes:**
- Add `localhost` for local development
- Add `*.yourdomain.com` for all subdomains
- Don't include `http://` or `https://` - just the domain

3. **Accept** the reCAPTCHA Terms of Service
4. Click **Submit**

### Step 3: Copy the Keys

After creating, you'll see:

**Site Key** (Public - used in frontend):
```
6LdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
→ Copy this to `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

**Secret Key** (Private - used in backend):
```
6LdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX_SECRET
```
→ Copy this to `RECAPTCHA_SECRET_KEY`

---

## Step 4: Update Amplify Environment Variables

### In AWS Amplify Console:

1. **Go to**: Your Amplify App → **Environment variables**
2. **Add/Update** these variables:

```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RECAPTCHA_SECRET_KEY=6LdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX_SECRET
```

**⚠️ Important:**
- `NEXT_PUBLIC_` prefix is REQUIRED for the site key (exposed to browser)
- NO `NEXT_PUBLIC_` prefix for secret key (server-side only)
- Make sure there are NO extra spaces or quotes

3. **Save** the environment variables
4. **Redeploy** your app (or wait for auto-deploy)

---

## Step 5: Verify Key Type

### Check in Google reCAPTCHA Admin:

1. Go to: https://www.google.com/recaptcha/admin
2. Find your site
3. Check the **Type** column:
   - ✅ Should say: **"v2"** or **"Checkbox"**
   - ❌ Should NOT say: **"v3"** or **"Invisible"**

### Verify in Code:

The key should work with this script URL:
```
https://www.google.com/recaptcha/api.js?render=explicit
```

If you have a v3 key, it would use:
```
https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY
```
(But we're NOT using this - we need v2!)

---

## Step 6: Test After Update

1. **Wait for Amplify to redeploy** (or trigger manual deploy)
2. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
3. **Open `/login` page**
4. **Check browser console** (F12):
   - Should see: `✅ reCAPTCHA script loaded successfully`
   - Should see: `✅ reCAPTCHA widget rendered (v2)`
   - Should NOT see: "Invalid key type" error

5. **reCAPTCHA widget should appear**:
   - Should show "I'm not a robot" checkbox
   - Should NOT show error message

---

## Common Mistakes to Avoid

### ❌ Wrong: Using v3 Key
- v3 keys start with different format
- v3 uses invisible verification (no checkbox)
- Won't work with `render=explicit`

### ❌ Wrong: Using v2 Invisible Key
- v2 Invisible doesn't show checkbox
- Also won't work with explicit render

### ❌ Wrong: Domain Not Registered
- Must add `localhost` for dev
- Must add your production domain
- Must match exactly (case-sensitive)

### ❌ Wrong: Wrong Environment Variable Name
- Must be `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (with `NEXT_PUBLIC_`)
- Not `RECAPTCHA_SITE_KEY` (without prefix)
- Frontend can't access variables without `NEXT_PUBLIC_`

---

## Quick Verification Checklist

- [ ] Created new site in reCAPTCHA admin
- [ ] Selected **v2 → "I'm not a robot" Checkbox** (NOT v3)
- [ ] Added `localhost` to domains
- [ ] Added production domain to domains
- [ ] Copied **Site Key** (not Secret Key) to `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- [ ] Copied **Secret Key** to `RECAPTCHA_SECRET_KEY`
- [ ] Updated Amplify environment variables
- [ ] Redeployed app
- [ ] Cleared browser cache
- [ ] Widget appears without error

---

## Still Not Working?

### Check 1: Verify Key in Browser Console
```javascript
// In browser console
console.log('Site Key:', process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
// Should show your v2 Checkbox key
```

### Check 2: Verify Key Type in reCAPTCHA Admin
- Go to: https://www.google.com/recaptcha/admin
- Check the **Type** column for your site
- Must say **"v2"** or **"Checkbox"**

### Check 3: Test Key Directly
```javascript
// In browser console (after page loads)
if (window.grecaptcha) {
  console.log('grecaptcha available');
  // Try to render manually
  const container = document.getElementById('recaptcha-container');
  if (container) {
    try {
      window.grecaptcha.render(container, {
        sitekey: 'YOUR_SITE_KEY_HERE',
        callback: (token) => console.log('Token:', token)
      });
    } catch (e) {
      console.error('Render error:', e);
    }
  }
}
```

---

## Summary

**The Fix:**
1. ✅ Create **NEW** reCAPTCHA site in admin
2. ✅ Select **v2 → "I'm not a robot" Checkbox** (NOT v3!)
3. ✅ Add domains: `localhost`, `yourdomain.com`
4. ✅ Copy Site Key → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` in Amplify
5. ✅ Copy Secret Key → `RECAPTCHA_SECRET_KEY` in Amplify
6. ✅ Redeploy and test

**The Error Happens Because:**
- You're using a v3 key (or v2 Invisible) with v2 Checkbox code
- The key type must match the render type exactly

---

**Next Step**: Create a new v2 Checkbox site in Google reCAPTCHA admin and update Amplify environment variables.
