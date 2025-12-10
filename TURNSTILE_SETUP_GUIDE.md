# Cloudflare Turnstile Setup Guide

## Why Switch to Turnstile?

**Advantages over Google reCAPTCHA:**
- ✅ **100% FREE** - Unlimited assessments (vs reCAPTCHA's 10K/month)
- ✅ **Invisible** - No user interaction needed (better UX)
- ✅ **Privacy-first** - No tracking, GDPR compliant
- ✅ **More reliable** - Better uptime than reCAPTCHA
- ✅ **Easier setup** - Simpler than reCAPTCHA
- ✅ **You already have the code!** - `TurnstileWidget.tsx` exists

---

## Step 1: Get Turnstile Site Key (5 minutes)

1. **Go to Cloudflare Dashboard**:
   - https://dash.cloudflare.com
   - Sign up or log in (free account works)

2. **Navigate to Turnstile**:
   - Go to: **"Security"** → **"Turnstile"** in left sidebar
   - Or direct link: https://dash.cloudflare.com/?to=/:account/turnstile

3. **Create a Site**:
   - Click **"Add Site"** or **"Create"**
   - Fill in:
     - **Site name**: `TravClan Auth` (or your app name)
     - **Domain**: `travelselbuy.com` (or your domain)
     - **Widget mode**: Choose **"Managed"** (invisible, best UX)
       - Options:
         - **Managed** - Invisible, automatic challenge when needed
         - **Non-interactive** - Shows widget but no user action
         - **Invisible** - Completely invisible, always passes

4. **Copy Keys**:
   - **Site Key** (public) - Use in frontend
   - **Secret Key** (private) - Use in backend

---

## Step 2: Set Environment Variables in Amplify

**In AWS Amplify Console** → Environment variables, add:

```bash
# Turnstile Configuration
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here

# Optional: Keep reCAPTCHA as fallback
CAPTCHA_PROVIDER=turnstile  # or 'recaptcha' to switch back
```

---

## Step 3: Create Turnstile Verification Service

I'll create a service similar to `recaptchaService.ts` but for Turnstile.

**File**: `src/lib/services/turnstileService.ts`

---

## Step 4: Update Your Components

**Option A: Use Existing TurnstileWidget**
- You already have `src/components/auth/TurnstileWidget.tsx`
- Just need to use it instead of reCAPTCHA

**Option B: Create Hybrid Component**
- Support both Turnstile and reCAPTCHA
- Switch via environment variable

---

## Step 5: Test

1. **Try phone signup flow**
2. **Check if Turnstile widget appears** (or is invisible)
3. **Submit form**
4. **Check CloudWatch logs** - should see Turnstile verification

---

## Cost Comparison

**For 100,000 assessments per month:**
- **Cloudflare Turnstile**: **FREE** ✅
- **Google reCAPTCHA**: **$8/month** ❌

**For 1,000,000 assessments per month:**
- **Cloudflare Turnstile**: **FREE** ✅
- **Google reCAPTCHA**: **$908/month** ❌

**Savings**: Turnstile saves you **$8-$908/month** depending on volume!

---

## Benefits Summary

| Feature | Turnstile | reCAPTCHA |
|---------|-----------|-----------|
| **Free Tier** | Unlimited | 10K/month |
| **Cost (100K)** | FREE | $8/month |
| **Cost (1M)** | FREE | $908/month |
| **Invisible** | ✅ Yes | ⚠️ v3 only |
| **Privacy** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Setup** | 5-10 min | 10-15 min |
| **Reliability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## Next Steps

**Would you like me to:**
1. ✅ Create `turnstileService.ts` (verification service)?
2. ✅ Update your components to use Turnstile?
3. ✅ Create a hybrid solution (support both)?

**Recommendation**: Switch to Turnstile - it's free, invisible, and you already have the widget code!

---

**Get your Turnstile keys from Cloudflare, and I'll help you implement it!**
