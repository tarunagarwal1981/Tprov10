# reCAPTCHA Debugging Guide 🔍

## Changes Made ✅

1. ✅ **reCAPTCHA is now ALWAYS required** (removed temporary workaround)
2. ✅ **Improved rendering logic** with retry mechanism
3. ✅ **Better error messages** and console logging
4. ✅ **Enhanced debugging** to identify issues

---

## Debugging Steps

### Step 1: Check Environment Variable

**In your `.env.local` file, verify:**
```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=YOUR_SITE_KEY_HERE
```

**Test in browser console:**
```javascript
console.log('Site Key:', process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
// Should show your site key, not undefined or empty
```

**If empty/undefined:**
- ✅ Add the key to `.env.local`
- ✅ Restart dev server (`npm run dev`)
- ✅ Clear browser cache and hard refresh (Ctrl+Shift+R)

---

### Step 2: Check Browser Console

**Open DevTools (F12) → Console tab**

**Look for these messages:**

#### ✅ Success Messages:
- `📜 reCAPTCHA script loaded, checking for grecaptcha...`
- `✅ reCAPTCHA script loaded successfully, grecaptcha available`
- `🔄 Attempting to render reCAPTCHA widget...`
- `✅ reCAPTCHA widget rendered (v2)` or `(v3)`
- `✅ reCAPTCHA token received`

#### ⚠️ Warning Messages:
- `⏳ Waiting for reCAPTCHA script to load...` - Script still loading
- `⚠️ reCAPTCHA container not ready yet` - DOM not ready
- `⚠️ reCAPTCHA script loaded but grecaptcha not available yet` - Retrying

#### ❌ Error Messages:
- `❌ reCAPTCHA not configured: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set`
- `❌ window.grecaptcha is not available`
- `❌ reCAPTCHA render error: [error details]`
- `❌ Failed to render reCAPTCHA after multiple attempts`

---

### Step 3: Check Network Tab

**Open DevTools (F12) → Network tab**

**Look for:**
1. **`recaptcha/api.js` request**
   - Status should be `200 OK`
   - If `404` or `blocked`: Script not loading
   - If `CORS error`: Domain not registered in reCAPTCHA admin

2. **Check if script loads:**
   - Filter by "JS" or "recaptcha"
   - Should see request to `https://www.google.com/recaptcha/api.js`

---

### Step 4: Check reCAPTCHA Container

**In browser console:**
```javascript
// Check if container exists
document.getElementById('recaptcha-container')
// Should return the div element, not null

// Check if grecaptcha is available
window.grecaptcha
// Should return an object with render, reset methods
```

---

### Step 5: Verify reCAPTCHA Admin Settings

1. **Go to**: https://www.google.com/recaptcha/admin
2. **Check your site**:
   - ✅ **Type**: Should be "v2" → "I'm not a robot" Checkbox
   - ✅ **Domains**: Must include:
     - `localhost` (for development)
     - Your production domain
   - ✅ **Site Key**: Matches `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

---

## Common Issues & Solutions

### Issue 1: reCAPTCHA Widget Not Appearing

**Symptoms:**
- No widget visible
- Console shows: `✅ reCAPTCHA widget rendered` but nothing appears

**Solutions:**
1. **Check container visibility:**
   ```javascript
   const container = document.getElementById('recaptcha-container');
   console.log('Container:', container);
   console.log('Container visible:', container?.offsetHeight > 0);
   ```

2. **Check CSS:**
   - Container might be hidden by CSS
   - Check if `min-height: 78px` is applied

3. **Check domain:**
   - Domain must match exactly in reCAPTCHA admin
   - `localhost` for dev, your domain for production

---

### Issue 2: Script Not Loading

**Symptoms:**
- Console shows: `❌ reCAPTCHA script loaded but grecaptcha not available`
- Network tab shows script request failed

**Solutions:**
1. **Check ad blockers:**
   - Disable ad blockers (they often block reCAPTCHA)
   - Try incognito mode

2. **Check network:**
   - Firewall blocking Google domains?
   - VPN interfering?

3. **Check domain registration:**
   - Domain must be registered in reCAPTCHA admin
   - Wait a few minutes after adding domain

---

### Issue 3: "Invalid site key" Error

**Symptoms:**
- Widget appears but shows error
- Console shows invalid key error

**Solutions:**
1. **Verify key matches:**
   - Check `.env.local` matches reCAPTCHA admin
   - No extra spaces or quotes

2. **Check key type:**
   - Must be v2 Checkbox key (not v3)
   - Site key (not secret key)

3. **Restart server:**
   - Environment variables only load on server start
   - `npm run dev` after changing `.env.local`

---

### Issue 4: Widget Renders But Token Never Received

**Symptoms:**
- Widget appears
- User completes challenge
- Button still disabled
- No `✅ reCAPTCHA token received` in console

**Solutions:**
1. **Check callback:**
   - Console should show token received
   - If not, callback might be broken

2. **Check token state:**
   ```javascript
   // In React DevTools, check component state
   // recaptchaToken should be set after completing challenge
   ```

3. **Try resetting:**
   - Refresh page
   - Complete challenge again

---

## Manual Testing

### Test 1: Check Environment Variable
```bash
# In terminal
echo $NEXT_PUBLIC_RECAPTCHA_SITE_KEY
# Or in PowerShell
$env:NEXT_PUBLIC_RECAPTCHA_SITE_KEY
```

### Test 2: Check Script Loading
```javascript
// In browser console
fetch('https://www.google.com/recaptcha/api.js')
  .then(r => console.log('✅ Script accessible:', r.status))
  .catch(e => console.error('❌ Script blocked:', e));
```

### Test 3: Check grecaptcha Object
```javascript
// In browser console (after page loads)
setTimeout(() => {
  console.log('grecaptcha:', window.grecaptcha);
  console.log('Has render:', typeof window.grecaptcha?.render === 'function');
}, 2000);
```

---

## Next Steps

1. **Check browser console** for the debug messages
2. **Verify environment variable** is set correctly
3. **Check reCAPTCHA admin** settings match your domain
4. **Share console logs** if still not working

---

## Quick Checklist

- [ ] `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set in `.env.local`
- [ ] Dev server restarted after adding key
- [ ] Browser console shows script loading
- [ ] Domain registered in reCAPTCHA admin
- [ ] No ad blockers enabled
- [ ] Network tab shows script loads successfully
- [ ] Container div exists in DOM
- [ ] `window.grecaptcha` is available

---

**Status**: reCAPTCHA is now always required. Use the debugging steps above to identify why it's not showing.
