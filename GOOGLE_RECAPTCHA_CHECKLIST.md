# Google reCAPTCHA Setup Checklist ✅

## Quick Setup (5 minutes)

### ✅ Step 1: Get Keys from Google (2 min)
1. Go to: https://www.google.com/recaptcha/admin
2. Click **"+"** → Create new site
3. Settings:
   - **Label**: `TravClan Auth`
   - **Type**: v2 → "I'm not a robot" Checkbox
   - **Domains**: 
     ```
     localhost
     dev.travelselbuy.com
     travelselbuy.com
     *.travelselbuy.com
     ```
4. Submit → Copy **Site Key** and **Secret Key**

### ✅ Step 2: Add to `.env.local` (1 min)
```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=YOUR_SITE_KEY_HERE
RECAPTCHA_SECRET_KEY=YOUR_SECRET_KEY_HERE
```

### ✅ Step 3: Restart Dev Server (1 min)
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### ✅ Step 4: Test (1 min)
1. Go to `/login` page
2. Switch to "Phone Number" tab
3. Check if reCAPTCHA widget appears
4. Check browser console for errors

---

## Verification Checklist

- [ ] Site Key added to `.env.local` as `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- [ ] Secret Key added to `.env.local` as `RECAPTCHA_SECRET_KEY`
- [ ] Dev server restarted
- [ ] Widget appears on `/login` page
- [ ] No console errors
- [ ] Can complete reCAPTCHA challenge
- [ ] Form submission works

---

## Common Issues

### Widget doesn't appear
- ✅ Check `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set
- ✅ Check domain is added in reCAPTCHA admin
- ✅ Clear browser cache
- ✅ Check browser console for errors

### "Invalid site key" error
- ✅ Verify key matches your domain
- ✅ Check if using correct key (v2 vs v3)
- ✅ Ensure domain is registered in admin

### Works in dev but not production
- ✅ Verify env vars are set in production
- ✅ Check domain is registered
- ✅ Verify production build includes variable

---

## That's It! 🎉

Your code is already set up correctly. Just add the keys and you're done.
