# reCAPTCHA Setup & Fix Guide

## Issues Fixed ✅

### Problem 1: `window.grecaptcha.render is not a function`
**Root Cause**: The reCAPTCHA script was trying to render before `grecaptcha` was fully initialized.

**Solution**: 
- Added proper waiting mechanism using `grecaptcha.ready()` when available
- Added delay to ensure DOM is ready before rendering
- Improved error handling

### Problem 2: `reCAPTCHA couldn't find user-provided function: onRecaptchaLoad`
**Root Cause**: The script URL had `onload=onRecaptchaLoad` parameter, but the global function `window.onRecaptchaLoad` was never defined.

**Solution**:
- Removed `onload=onRecaptchaLoad` from the script URL
- Using Next.js Script component's `onLoad` callback instead
- This is the proper way to handle script loading in Next.js

### Problem 3: 404 Error
**Root Cause**: Could be related to script loading or missing environment variable.

**Solution**: Added error handling in Script component's `onError` callback.

---

## Environment Variables Required

Make sure you have these in your `.env.local` file:

```bash
# reCAPTCHA v2 Site Key (Public - safe to expose)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Ld33CIsAAAAALWHIk57tR-rPKOwdTQTVWJwGSMF

# reCAPTCHA Secret Key (Server-side only - NEVER expose)
RECAPTCHA_SECRET_KEY=6Ld33CIsAAAAAAMtPMvXfPXZMdYdQ0dFGqHw7TfJ
```

**Important**: 
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `RECAPTCHA_SECRET_KEY` should NOT have `NEXT_PUBLIC_` prefix (server-side only)

---

## How It Works Now

### 1. Script Loading (`PhoneLoginTab.tsx`)
```tsx
<Script
  src={`https://www.google.com/recaptcha/api.js?render=explicit`}
  onLoad={handleRecaptchaLoad}
  onError={() => {
    console.error('Failed to load reCAPTCHA script');
    setError('Failed to load security verification. Please refresh the page.');
  }}
  strategy="lazyOnload"
/>
```

- Uses `render=explicit` mode (manual rendering)
- No `onload` parameter in URL (handled by Next.js)
- `lazyOnload` strategy loads script when needed

### 2. Widget Rendering
```tsx
useEffect(() => {
  if (!recaptchaLoaded || !RECAPTCHA_SITE_KEY) return;

  const renderRecaptcha = () => {
    if (window.grecaptcha && recaptchaRef.current && !recaptchaWidgetId.current) {
      // Use grecaptcha.ready() if available (v3), otherwise direct render (v2)
      if (window.grecaptcha.ready) {
        window.grecaptcha.ready(() => {
          // Render widget
        });
      } else {
        // Direct render for v2
      }
    }
  };

  const timer = setTimeout(renderRecaptcha, 100);
  return () => clearTimeout(timer);
}, [recaptchaLoaded]);
```

- Waits for script to load (`recaptchaLoaded` state)
- Uses `grecaptcha.ready()` when available
- Small delay ensures DOM is ready

---

## Testing reCAPTCHA

### 1. Check Environment Variable
```javascript
// In browser console
console.log(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
// Should show your site key
```

### 2. Check Script Loading
Open browser DevTools → Network tab:
- Look for `recaptcha/api.js` request
- Should return 200 status
- Check if script loads successfully

### 3. Check Widget Rendering
- Open browser DevTools → Console
- Should NOT see: `window.grecaptcha.render is not a function`
- Should NOT see: `reCAPTCHA couldn't find user-provided function`
- Widget should appear in the form

### 4. Test in Development
In development mode, reCAPTCHA is optional (won't block submission).
In production mode, reCAPTCHA is required.

---

## Common Issues & Solutions

### Issue: reCAPTCHA widget doesn't appear
**Solutions**:
1. Check `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set
2. Check browser console for errors
3. Verify script loads in Network tab
4. Check if domain is registered in reCAPTCHA admin

### Issue: "Invalid site key" error
**Solutions**:
1. Verify site key matches your domain
2. Check if using correct key (v2 vs v3)
3. Ensure domain is added in reCAPTCHA admin console

### Issue: Script loads but widget doesn't render
**Solutions**:
1. Check if `recaptchaRef.current` exists (DOM element)
2. Check browser console for render errors
3. Verify `RECAPTCHA_SITE_KEY` is not empty
4. Try refreshing the page

### Issue: Works in dev but not production
**Solutions**:
1. Verify environment variables are set in production
2. Check if domain is registered in reCAPTCHA admin
3. Check production build includes the variable
4. Verify no CORS issues

---

## reCAPTCHA Admin Console Setup

1. Go to: https://www.google.com/recaptcha/admin
2. Select your site or create new
3. **reCAPTCHA type**: v2 → "I'm not a robot" Checkbox
4. **Domains**: Add your domains
   - `localhost` (for development)
   - `dev.travelselbuy.com` (for staging)
   - `travelselbuy.com` (for production)
5. Copy **Site Key** → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
6. Copy **Secret Key** → `RECAPTCHA_SECRET_KEY`

---

## Files Modified

1. ✅ `src/components/auth/PhoneLoginTab.tsx`
   - Fixed script loading
   - Improved widget rendering logic
   - Added error handling

2. ✅ `src/components/auth/SignupForm.tsx`
   - Fixed widget rendering to wait for script
   - Added polling mechanism if script not ready

---

## Next Steps

1. **Verify Environment Variables**:
   ```bash
   # Check if variables are set
   echo $NEXT_PUBLIC_RECAPTCHA_SITE_KEY
   ```

2. **Test the Fix**:
   - Clear browser cache
   - Restart dev server
   - Open `/login` page
   - Switch to "Phone Number" tab
   - Check if reCAPTCHA widget appears

3. **Monitor Console**:
   - Should NOT see render errors
   - Should NOT see "onRecaptchaLoad" errors
   - Widget should appear and be interactive

---

## Additional Notes

- **reCAPTCHA v2** is used (checkbox type)
- **Explicit rendering** mode (manual control)
- **Lazy loading** strategy (loads when needed)
- **Production mode** requires reCAPTCHA completion
- **Development mode** allows skipping (for testing)

If issues persist, check:
1. Browser console for specific errors
2. Network tab for failed requests
3. reCAPTCHA admin console for domain/key issues
4. Environment variables are properly set
