# Fix: SES Email Not Verified Error

## Problem

**Error from CloudWatch logs:**
```
Email sending error: MessageRejected: Email address is not verified. 
The following identities failed the check in region US-EAST-1: TravClan <noreply@travclan.com>
```

**Root Cause:**
- Your code is trying to send emails from `noreply@travclan.com`
- This email address is **NOT verified** in AWS SES
- You verified `travelselbuy.com` domain, but the code is using a different domain (`travclan.com`)

---

## Solution: Set SES_FROM_EMAIL Environment Variable

### Step 1: Choose a Verified Email Address

You have two options:

**Option A: Use Verified Email Address**
- `tarunag.in@gmail.com` (if you verified this email in SES)

**Option B: Use Verified Domain Email**
- `noreply@travelselbuy.com` (since you verified `travelselbuy.com` domain)
- `support@travelselbuy.com` (any address on your verified domain works)

### Step 2: Set Environment Variable in Amplify

1. **Go to AWS Amplify Console**:
   - https://console.aws.amazon.com/amplify
   - Or search "Amplify" in AWS Console

2. **Select your app**: `travel-app` (or your app name)

3. **Go to**: **"Environment variables"** in left sidebar

4. **Add/Update** the following variable:
   ```bash
   SES_FROM_EMAIL=noreply@travelselbuy.com
   ```
   OR
   ```bash
   SES_FROM_EMAIL=tarunag.in@gmail.com
   ```

5. **Also set** (optional but recommended):
   ```bash
   SES_FROM_NAME=TravClan
   ```

6. **Click**: **"Save"**

7. **Redeploy your app**:
   - Go to **"Deployments"** tab
   - Click **"Redeploy this version"** or wait for automatic redeploy

---

## How the Code Works

The email service uses this logic:
```typescript
const FROM_EMAIL = process.env.SES_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@travclan.com';
```

**Priority:**
1. ✅ `SES_FROM_EMAIL` environment variable (if set)
2. ✅ `FROM_EMAIL` environment variable (if set)
3. ❌ `noreply@travclan.com` (default fallback - NOT verified)

**By setting `SES_FROM_EMAIL` in Amplify, you override the default.**

---

## Verify Your SES Identities

### Check What's Verified:

1. **Go to AWS SES Console**:
   - https://console.aws.amazon.com/ses/home?region=us-east-1

2. **Click**: **"Verified identities"** in left sidebar

3. **Check what's verified**:
   - ✅ `travelselbuy.com` (domain - verified)
   - ✅ `tarunag.in@gmail.com` (if you verified this email)

4. **Use one of these** for `SES_FROM_EMAIL`:
   - If domain verified: `noreply@travelselbuy.com` (recommended)
   - If email verified: `tarunag.in@gmail.com`

---

## Quick Fix Steps

1. ✅ **Go to Amplify** → Environment variables
2. ✅ **Add**: `SES_FROM_EMAIL=noreply@travelselbuy.com`
3. ✅ **Add**: `SES_FROM_NAME=TravClan`
4. ✅ **Save** and **redeploy**
5. ✅ **Test** the signup flow again

---

## After Setting Environment Variable

**Expected behavior:**
- ✅ Emails will be sent from `noreply@travelselbuy.com` (or your chosen verified email)
- ✅ No more "Email address is not verified" errors
- ✅ OTP emails will be delivered successfully

**Test:**
1. Try the phone signup flow again
2. Enter email address
3. Submit signup form
4. Check CloudWatch logs - should see `✅ Email OTP sent successfully`
5. Check your email inbox for the OTP code

---

## Summary

**The Issue:**
- Code defaults to `noreply@travclan.com` (not verified)
- You verified `travelselbuy.com` domain instead

**The Fix:**
- Set `SES_FROM_EMAIL=noreply@travelselbuy.com` in Amplify environment variables
- Redeploy your app
- Emails will now use the verified domain

---

**Set the environment variable now, and emails will work!**

