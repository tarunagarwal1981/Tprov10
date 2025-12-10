# Complete Migration Guide: AWS → Twilio + SendGrid + Cloudflare Turnstile

## Overview

This guide will help you migrate from:
- ❌ **AWS SNS** → ✅ **Twilio** (SMS)
- ❌ **AWS SES** → ✅ **SendGrid** (Email)
- ❌ **Google reCAPTCHA** → ✅ **Cloudflare Turnstile** (CAPTCHA)

**Email/Password login remains unchanged** (uses AWS Cognito, not affected)

---

## Part 1: Twilio SMS Setup

### Step 1: Sign Up for Twilio (5 minutes)

1. **Go to**: https://www.twilio.com/try-twilio
2. **Sign up** with your email
3. **Verify your email**
4. **Get your credentials** from dashboard:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: `your_auth_token_here` (click to reveal)
   - **Phone Number**: Twilio provides a free trial number (e.g., `+1234567890`)

**Free Trial**: $15.50 credit (enough for ~200 SMS to US)

---

### Step 2: Verify Phone Number (Trial Accounts)

**If you're on a trial account**, verify your test phone number:

1. **Go to**: Twilio Console → Phone Numbers → Verified Caller IDs
2. **Click**: "Add a new Caller ID"
3. **Enter**: `+919027184519` (your test number)
4. **Verify** via SMS code sent to that number

**Note**: Paid accounts don't need verification.

---

### Step 3: Set Environment Variables in Amplify

**In AWS Amplify Console** → Environment variables, add:

```bash
# SMS Provider (Switch to Twilio)
SMS_PROVIDER=twilio

# Twilio Credentials
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number

# Optional: Sender ID
SMS_SENDER_ID=TRAVCLAN
```

**Save** and **redeploy** your app.

---

## Part 2: SendGrid Email Setup

### Step 1: Sign Up for SendGrid (5 minutes)

1. **Go to**: https://signup.sendgrid.com
2. **Sign up** with your email
3. **Verify your email**
4. **Complete setup wizard**:
   - Choose "I'm a Developer"
   - Select "Transactional Email"
   - Skip marketing features (optional)

**Free Tier**: 100 emails/day forever

---

### Step 2: Create API Key

1. **Go to**: SendGrid Dashboard → Settings → API Keys
2. **Click**: "Create API Key"
3. **Name**: `TravClan Production`
4. **Permissions**: Select **"Full Access"** (or "Restricted Access" → Mail Send)
5. **Click**: "Create & View"
6. **Copy the API key** (shown only once!)

**Important**: Save this key immediately - you won't see it again!

---

### Step 3: Verify Sender Email (Required)

1. **Go to**: SendGrid Dashboard → Settings → Sender Authentication
2. **Click**: "Verify a Single Sender"
3. **Fill out the form**:
   - **From Email**: `noreply@travelselbuy.com` (or your verified domain email)
   - **From Name**: `TravClan`
   - **Reply To**: `support@travelselbuy.com` (optional)
   - **Company Address**: Your business address
   - **Website**: `https://dev.travelselbuy.com`
4. **Click**: "Create"
5. **Check your email** and click the verification link

**OR - Verify Domain** (Recommended for Production):

1. **Go to**: Settings → Sender Authentication → Domain Authentication
2. **Click**: "Authenticate Your Domain"
3. **Enter**: `travelselbuy.com`
4. **Add DNS records** in Route 53 (same as SES):
   - CNAME records for domain verification
   - SPF, DKIM records
5. **Wait for verification** (usually 5-15 minutes)

---

### Step 4: Set Environment Variables in Amplify

**In AWS Amplify Console** → Environment variables, add:

```bash
# Email Provider (Switch to SendGrid)
EMAIL_PROVIDER=sendgrid

# SendGrid Credentials
SENDGRID_API_KEY=your_api_key_here

# SendGrid Sender (must be verified)
SENDGRID_FROM_EMAIL=noreply@travelselbuy.com
SENDGRID_FROM_NAME=TravClan
```

**Save** and **redeploy** your app.

---

## Part 3: Cloudflare Turnstile Setup

### Step 1: Sign Up for Cloudflare (5 minutes)

1. **Go to**: https://dash.cloudflare.com/sign-up
2. **Sign up** with your email (free account works)
3. **Verify your email**

**Note**: You don't need to add your domain to Cloudflare - just need an account for Turnstile.

---

### Step 2: Create Turnstile Site

1. **Go to**: Cloudflare Dashboard → Security → Turnstile
   - Direct link: https://dash.cloudflare.com/?to=/:account/turnstile

2. **Click**: "Add Site" or "Create"

3. **Fill out the form**:
   - **Site name**: `TravClan Auth`
   - **Domain**: `travelselbuy.com`
   - **Widget mode**: Select **"Managed"** (invisible, best UX)
     - **Managed**: Invisible, automatic challenge when needed (recommended)
     - **Non-interactive**: Shows widget but no user action needed
     - **Invisible**: Completely invisible, always passes

4. **Click**: "Create"

5. **Copy Keys**:
   - **Site Key** (public) - Use in frontend: `0x4AAAAAA...`
   - **Secret Key** (private) - Use in backend: `0x4AAAAAA...`

---

### Step 3: Set Environment Variables in Amplify

**In AWS Amplify Console** → Environment variables, add:

```bash
# CAPTCHA Provider (Switch to Turnstile)
CAPTCHA_PROVIDER=turnstile

# Turnstile Credentials
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

**Save** and **redeploy** your app.

---

## Part 4: Install Required Packages

Run this command in your project:

```bash
npm install twilio @sendgrid/mail
```

**Note**: Cloudflare Turnstile doesn't need a package - it uses a script tag (already in your code).

---

## Part 5: Code Implementation

I'll create/update these files:

1. ✅ `src/lib/services/smsServiceTwilio.ts` - Already created
2. ✅ `src/lib/services/smsService.ts` - Already updated (supports both)
3. ⏳ `src/lib/services/emailServiceSendGrid.ts` - New SendGrid service
4. ⏳ `src/lib/services/emailService.ts` - Update to support both
5. ⏳ `src/lib/services/turnstileService.ts` - New Turnstile verification
6. ⏳ Update components to use Turnstile instead of reCAPTCHA

---

## Part 6: Testing

### Test SMS (Twilio):
1. Try phone signup flow
2. Enter phone: `+919027184519`
3. Submit form
4. Check CloudWatch logs: `✅ Twilio SMS sent successfully`
5. Check phone: Should receive SMS

### Test Email (SendGrid):
1. Try phone signup flow
2. Enter email: `your-email@gmail.com`
3. Submit form
4. Check CloudWatch logs: `✅ SendGrid email sent successfully`
5. Check email inbox: Should receive OTP email

### Test CAPTCHA (Turnstile):
1. Try phone signup flow
2. Turnstile should be invisible (no widget visible)
3. Submit form
4. Check CloudWatch logs: `✅ Turnstile verification successful`

---

## Environment Variables Summary

**Add all these to Amplify** → Environment variables:

```bash
# SMS Provider
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
SMS_SENDER_ID=TRAVCLAN

# Email Provider
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@travelselbuy.com
SENDGRID_FROM_NAME=TravClan

# CAPTCHA Provider
CAPTCHA_PROVIDER=turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key
```

---

## Cost Comparison

### Before (AWS):
- **SNS**: $2.30 per 1K SMS to India (but requires approval)
- **SES**: $0.10 per 1K emails (but requires approval)
- **reCAPTCHA**: $8/month for 100K assessments

### After (Third-Party):
- **Twilio**: $68 per 1K SMS to India (works immediately)
- **SendGrid**: FREE (100/day) or $6 per 10K emails
- **Turnstile**: FREE (unlimited)

**Trade-off**: Slightly more expensive, but:
- ✅ No approval needed
- ✅ Works immediately
- ✅ Better developer experience
- ✅ More reliable

---

## Timeline

- **Sign up for services**: 15 minutes (5 min each)
- **Get credentials**: 5 minutes
- **Set environment variables**: 5 minutes
- **Code implementation**: 20 minutes
- **Testing**: 10 minutes
- **Total**: ~1 hour

---

## Next Steps

1. ✅ Sign up for all three services (15 minutes)
2. ✅ Get all credentials (5 minutes)
3. ✅ Set environment variables in Amplify (5 minutes)
4. ✅ I'll create/update the code files
5. ✅ Test all three services

**Ready to start? Let me know when you have the credentials, and I'll implement the code!**
