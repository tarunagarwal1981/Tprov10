# SNS and SES Setup Guide

## Current Status

✅ **IAM Permissions**: Already attached (you showed the screenshot)
- `AmazonSNSFullAccess` - ✅ Attached
- `AmazonSESFullAccess` - ✅ Attached

Now we need to configure the services themselves.

---

## Part 1: AWS SNS Setup (SMS)

### Step 1: Check SNS Sandbox Status

1. **Go to AWS SNS Console**:
   - https://console.aws.amazon.com/sns/v3/home?region=us-east-1
   - Or search "SNS" in AWS Console

2. **Check Account Status**:
   - Click **"Text messaging (SMS)"** in left sidebar
   - Click **"Account preferences"**
   - Look for **"Account type"**:
     - **Sandbox**: Can only send to verified phone numbers
     - **Production**: Can send to any phone number

### Step 2: If in Sandbox Mode - Request Production Access

**If you see "Sandbox"**:

1. **Click**: **"Request production access"** button
2. **Fill out the form**:
   - **Use case**: "User authentication via OTP"
   - **Website URL**: `https://dev.travelselbuy.com` (or your production domain)
   - **Sample messages**: 
     ```
     Your verification code is 123456. Valid for 10 minutes. Do not share this code with anyone. - TRAVCLAN
     ```
   - **Monthly spend limit**: Set a reasonable limit (e.g., $50)
3. **Submit** and wait for approval (usually 24-48 hours)

**OR - Verify Phone Numbers for Testing** (if staying in sandbox):

1. Go to **"Text messaging (SMS)"** → **"Phone numbers"**
2. Click **"Add phone number"**
3. Enter your test phone numbers (e.g., `+919027184519`)
4. Verify them via SMS code

### Step 3: Configure SMS Preferences

1. **Go to**: **"Text messaging (SMS)"** → **"Preferences"**
2. **Set Default Sender ID**: `TRAVCLAN` (max 11 characters)
3. **Set Spending Limits** (recommended):
   - Monthly spend limit: $50 (or your preferred amount)
   - This prevents unexpected charges

### Step 4: Test SMS Sending

1. **Go to**: **"Text messaging (SMS)"** → **"Publish text message"**
2. **Enter**:
   - Phone number: `+919027184519` (your test number)
   - Message: `Test OTP: 123456`
3. **Click**: **"Publish message"**
4. **Check** if SMS is received

---

## Part 2: AWS SES Setup (Email)

### Step 1: Verify Email Address or Domain

**Option A: Verify Single Email (Quick for Testing)**

1. **Go to AWS SES Console**:
   - https://console.aws.amazon.com/ses/home?region=us-east-1
   - Or search "SES" in AWS Console

2. **Verify Email**:
   - Click **"Verified identities"** in left sidebar
   - Click **"Create identity"**
   - Choose **"Email address"**
   - Enter: `tarunag.in@gmail.com` (or your sender email)
   - Click **"Create identity"**
   - **Check your email** and click the verification link

3. **Update Environment Variable**:
   - Go to Amplify → Environment variables
   - Set: `SES_FROM_EMAIL=tarunag.in@gmail.com`
   - Set: `SES_FROM_NAME=TravClan` (optional)

**Option B: Verify Domain (Recommended for Production)**

1. **Go to**: **"Verified identities"** → **"Create identity"**
2. **Choose**: **"Domain"**
3. **Enter**: `travelselbuy.com` (your domain)
4. **Choose**: **"Easy DKIM"** (recommended)
5. **Add DNS Records**:
   - AWS will show you CNAME records to add
   - Go to your domain DNS settings
   - Add the 3 CNAME records for DKIM
   - Add the TXT record for domain verification
6. **Wait for verification** (can take up to 72 hours)

### Step 2: Check SES Sandbox Status

1. **Go to**: **"Account dashboard"**
2. **Look for**: **"Account status"**
   - **Sandbox**: Can only send to verified emails
   - **Production**: Can send to any email

### Step 3: Request Production Access (If in Sandbox)

**If you see "Sandbox"**:

1. **Click**: **"Request production access"** button
2. **Fill out the form**:
   - **Mail type**: Transactional
   - **Website URL**: `https://dev.travelselbuy.com`
   - **Use case**: "User authentication OTP emails"
   - **Expected volume**: Your estimate (e.g., 1000 emails/day)
   - **Bounce/complaint handling**: Describe your process
3. **Submit** and wait for approval (usually 24-48 hours)

**OR - Verify Recipient Emails for Testing** (if staying in sandbox):

- In sandbox mode, you can only send to verified email addresses
- Verify test recipient emails in **"Verified identities"**

### Step 4: Configure Email Settings

1. **Go to**: **"Configuration"** → **"Sending statistics"**
2. **Monitor**: Bounce and complaint rates
3. **Set up notifications** (optional):
   - Go to **"Configuration"** → **"Notifications"**
   - Set up SNS topics for bounces/complaints

---

## Part 3: Environment Variables

### Add to Amplify Environment Variables

1. **Go to**: AWS Amplify Console → Your App → **"Environment variables"**
2. **Add these variables**:

```bash
# AWS Region (should already be set)
AWS_REGION=us-east-1
DEPLOYMENT_REGION=us-east-1

# SES Configuration
SES_FROM_EMAIL=tarunag.in@gmail.com  # Your verified email
SES_FROM_NAME=TravClan  # Optional

# SNS Configuration (optional)
SMS_SENDER_ID=TRAVCLAN  # Max 11 characters
SNS_SMS_TOPIC_ARN=  # Leave empty if using direct SMS
```

3. **Save** and **redeploy** your app

---

## Part 4: Testing

### Test SMS

1. **Try phone signup flow**:
   - Enter phone number: `+919027184519`
   - Fill signup form
   - Submit

2. **Check CloudWatch logs**:
   - Should see: `✅ SMS OTP sent successfully`
   - No more `AuthorizationErrorException`

3. **Check phone**:
   - Should receive SMS with OTP code

### Test Email

1. **Try phone signup flow**:
   - Enter email: `tarunag.in@gmail.com`
   - Fill signup form
   - Submit

2. **Check CloudWatch logs**:
   - Should see: `✅ Email OTP sent successfully`
   - No more `AccessDenied` errors

3. **Check email inbox**:
   - Should receive email with OTP code
   - Check spam folder if not in inbox

---

## Troubleshooting

### SMS Not Sending

**Issue**: Still getting `AuthorizationErrorException`

**Solutions**:
1. ✅ IAM permissions are attached (you confirmed this)
2. ⚠️ Check if SNS is in sandbox mode:
   - If sandbox: Verify the phone number first
   - OR request production access
3. ⚠️ Check phone number format:
   - Must be E.164 format: `+919027184519`
   - No spaces or dashes

**Check SNS Console**:
- Go to SNS → Text messaging → Account preferences
- Check "Account type" (Sandbox vs Production)

---

### Email Not Sending

**Issue**: Still getting `AccessDenied`

**Solutions**:
1. ✅ IAM permissions are attached (you confirmed this)
2. ⚠️ Check if SES sender email is verified:
   - Go to SES → Verified identities
   - Make sure `tarunag.in@gmail.com` (or your FROM_EMAIL) is verified
3. ⚠️ Check if SES is in sandbox mode:
   - If sandbox: Verify recipient email addresses
   - OR request production access
4. ⚠️ Check environment variable:
   - Make sure `SES_FROM_EMAIL` is set correctly in Amplify

**Check SES Console**:
- Go to SES → Verified identities
- Make sure sender email is verified
- Go to Account dashboard → Check "Account status"

---

## Quick Checklist

### SNS (SMS):
- [ ] IAM permissions attached ✅ (you confirmed)
- [ ] SNS account type: Production OR phone numbers verified
- [ ] Default sender ID set: `TRAVCLAN`
- [ ] Spending limits configured
- [ ] Test SMS sent successfully

### SES (Email):
- [ ] IAM permissions attached ✅ (you confirmed)
- [ ] Sender email verified: `tarunag.in@gmail.com`
- [ ] SES account type: Production OR recipient emails verified
- [ ] Environment variable set: `SES_FROM_EMAIL`
- [ ] Test email sent successfully

---

## Next Steps

1. **Verify SNS status** (Sandbox vs Production)
2. **Verify SES sender email** (`tarunag.in@gmail.com`)
3. **Request production access** if in sandbox (for both)
4. **Set environment variables** in Amplify
5. **Test the signup flow** again
6. **Check CloudWatch logs** for success messages

---

## Summary

**What's Done**:
- ✅ IAM permissions attached
- ✅ Code is configured correctly

**What's Needed**:
- ⚠️ Verify SNS account status (Sandbox vs Production)
- ⚠️ Verify SES sender email address
- ⚠️ Request production access (if in sandbox)
- ⚠️ Set environment variables in Amplify

**After completing these steps, SMS and Email OTP should work!**
