# Migration Guide: Google reCAPTCHA → Cloudflare Turnstile

## Why Migrate?

- ✅ **Simpler**: 2 steps vs 5 steps
- ✅ **Free**: Unlimited usage
- ✅ **Privacy**: No tracking
- ✅ **Better UX**: Invisible challenges
- ✅ **Modern**: Built for 2024+

---

## Migration Steps

### Step 1: Get Turnstile Keys (2 minutes)

1. Go to: https://dash.cloudflare.com/
2. Sign up/login (free account)
3. Navigate to **Turnstile** (left sidebar)
4. Click **"Add Site"**
5. Fill in:
   - **Site name**: `TravClan Auth`
   - **Domain**: `travelselbuy.com`
   - **Widget mode**: **Managed** (invisible, best UX)
6. Click **Create**
7. Copy **Site Key** and **Secret Key**

**Note**: Works on `localhost` automatically!

---

### Step 2: Update Environment Variables

Replace in `.env.local`:
```bash
# Remove old reCAPTCHA keys
# NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
# RECAPTCHA_SECRET_KEY=...

# Add Turnstile keys
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAABkMYinukE1nzBx
TURNSTILE_SECRET_KEY=0x4AAAAAAABkMYinukE1nzBx_SECRET_KEY_HERE
```

---

### Step 3: Update PhoneLoginTab Component

Replace reCAPTCHA with Turnstile:

```tsx
// In src/components/auth/PhoneLoginTab.tsx
import { TurnstileWidget } from './TurnstileWidget';

// Replace reCAPTCHA section with:
<TurnstileWidget
  onSuccess={(token) => setRecaptchaToken(token)}
  onError={() => setError('Security verification failed')}
  theme="auto"
  size="normal"
/>
```

---

### Step 4: Update API Routes

Replace `verifyRecaptcha` with `verifyTurnstile`:

```tsx
// In API routes (init, signup, request-otp, etc.)
import { verifyTurnstile } from '@/lib/services/turnstileService';

// Replace:
const recaptchaResult = await verifyRecaptcha(recaptchaToken, clientIp);

// With:
const turnstileResult = await verifyTurnstile(recaptchaToken, clientIp);
```

---

### Step 5: Update SignupForm Component

Same as Step 3 - replace reCAPTCHA widget with Turnstile.

---

### Step 6: Test

1. Restart dev server
2. Go to `/login` page
3. Test phone login flow
4. Verify Turnstile widget appears (or is invisible)
5. Complete authentication

---

## Files to Update

1. ✅ `src/components/auth/PhoneLoginTab.tsx`
2. ✅ `src/components/auth/SignupForm.tsx`
3. ✅ `src/app/api/auth/phone/init/route.ts`
4. ✅ `src/app/api/auth/phone/signup/route.ts`
5. ✅ `src/app/api/auth/phone/request-otp/route.ts`
6. ✅ `src/app/api/auth/phone/resend-otp/route.ts` (if exists)

---

## Benefits After Migration

- ✅ Simpler code (less complexity)
- ✅ Better user experience (invisible challenges)
- ✅ Privacy-focused (no tracking)
- ✅ Free forever (no limits)
- ✅ Modern API (easier to maintain)

---

## Rollback Plan

If you need to rollback:
1. Keep old reCAPTCHA keys in `.env.local`
2. Revert code changes
3. Restart server

---

## Need Help?

I can implement the full migration for you. Just let me know!
