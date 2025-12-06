# Final Setup Checklist - What's Left

## ✅ Completed

1. ✅ **Database Migration** - You mentioned it's already completed
2. ✅ **AWS SNS (SMS)** - Configured
   - Sender ID: TRAVCLAN
   - Delivery logging: Enabled
3. ✅ **AWS SES (Email)** - Configured
   - Sending: Enabled
   - Email verified: tarunag.in@gmail.com
4. ✅ **AWS S3 (Documents)** - Fully configured
   - Bucket: travclan-documents
   - Versioning: Enabled
   - CORS: Configured

---

## ⏳ Remaining Tasks

### 1. Google reCAPTCHA Setup 🛡️
**Status**: ✅ **COMPLETED** - Keys added to `.env.local`

**What to do**:
1. Go to: https://www.google.com/recaptcha/admin
2. Create a new site:
   - Label: "TravClan Auth"
   - Type: reCAPTCHA v2 ("I'm not a robot") or v3
   - Domains: 
     - `localhost` (for development)
     - `travelselbuy.com` (for production)
     - `*.amplifyapp.com` (if using Amplify)
     - `*.netlify.app` (if using Netlify)
3. Copy the **Site Key** and **Secret Key**
4. Add to environment variables (see below)

---

### 2. SES Domain Verification 📧
**Status**: Pending DNS records

**What to do**:
1. Go to: https://console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities
2. Click on `travelselbuy.com`
3. Add these DNS records to your domain:

   **Domain Verification (TXT record)**:
   - Name: `_amazonses.travelselbuy.com` (or just the domain)
   - Value: `z9FgYEeag9VFo5CPSqXmqezfTTFbiO/FuY8yV3Z2JwM=`

   **DKIM (3 CNAME records)**:
   - `zo3v2ihczrihh3r7vw6ta3lhkihgkewo._domainkey.travelselbuy.com` → CNAME value from console
   - `ze6wxupvd45qjotznnzia2j7hpsgfbls._domainkey.travelselbuy.com` → CNAME value from console
   - `c6oxbfldjwzxnbgtnbto2jho64jdmwaw._domainkey.travelselbuy.com` → CNAME value from console

4. Wait 5-30 minutes for DNS propagation
5. SES will automatically verify once DNS records are found

**Note**: You can use the verified email (`tarunag.in@gmail.com`) for now, but domain verification is recommended for production.

---

### 3. Environment Variables 📝
**Status**: ✅ **COMPLETED** - All variables added to `.env.local`

**Add these to your `.env.local` file**:

```bash
# ============================================================================
# AWS Configuration
# ============================================================================
AWS_REGION=us-east-1
DEPLOYMENT_REGION=us-east-1

# ============================================================================
# SNS (SMS) - Already Configured
# ============================================================================
SMS_SENDER_ID=TRAVCLAN

# ============================================================================
# SES (Email) - Use verified email for now
# ============================================================================
SES_FROM_EMAIL=tarunag.in@gmail.com
# Or after domain verification: noreply@travelselbuy.com
SES_FROM_NAME=TravClan

# ============================================================================
# reCAPTCHA - ✅ Configured
# ============================================================================
RECAPTCHA_SITE_KEY=6Ld33CIsAAAAALWHIk57tR-rPKOwdTQTVWJwGSMF
RECAPTCHA_SECRET_KEY=6Ld33CIsAAAAAAMtPMvXfPXZMdYdQ0dFGqHw7TfJ
RECAPTCHA_MIN_SCORE=0.5  # For v3 only
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Ld33CIsAAAAALWHIk57tR-rPKOwdTQTVWJwGSMF

# ============================================================================
# S3 (Documents) - Already Configured
# ============================================================================
S3_DOCUMENTS_BUCKET=travclan-documents

# ============================================================================
# Existing Configuration (from env.local.template)
# ============================================================================
COGNITO_USER_POOL_ID=us-east-1_oF5qfa2IX
COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9
NEXT_PUBLIC_COGNITO_DOMAIN=travel-app-auth-2285.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9
RDS_HOST=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DB=postgres
RDS_USER=postgres
RDS_PASSWORD=ju3vrLHJUW8PqDG4
S3_BUCKET_NAME=travel-app-storage-1769
```

---

### 4. Production Access Requests (Optional) 🚀

**SNS Production Access** (if in sandbox):
- Go to: https://console.aws.amazon.com/sns/v3/home?region=us-east-1#/text-messaging/account
- Click "Request production access"
- Fill out the form

**SES Production Access** (if in sandbox):
- Go to: https://console.aws.amazon.com/ses/home?region=us-east-1#/account
- Click "Request production access"
- Fill out the form

**Note**: In sandbox mode:
- SNS: Can only send to verified phone numbers
- SES: Can only send to verified email addresses

---

## 🧪 Testing Checklist

Once everything is set up, test:

1. **Phone Login Flow**:
   - Go to `/phone-login`
   - Enter phone number
   - Receive OTP via SMS/Email
   - Verify OTP
   - Should authenticate successfully

2. **Phone Signup Flow**:
   - Go to `/phone-login`
   - Enter new phone number
   - Fill signup form
   - Receive OTP
   - Verify OTP
   - Should create account and redirect to onboarding

3. **Profile Onboarding**:
   - Complete account details
   - Complete brand details
   - Complete business details
   - Upload documents
   - Should track completion percentage

4. **Document Upload**:
   - Test uploading documents
   - Verify presigned URLs work
   - Check files appear in S3 bucket

---

## 📋 Quick Summary

**What's Left**:
1. ⏳ **reCAPTCHA** - You'll handle this
2. ⏳ **SES Domain Verification** - Add DNS records
3. ⏳ **Environment Variables** - Add to `.env.local`
4. ⏳ **Production Access** - Request if needed (optional)
5. ⏳ **Testing** - Test the complete flow

**Estimated Time**:
- reCAPTCHA: 5-10 minutes
- Domain verification: 10-15 minutes (mostly waiting for DNS)
- Environment variables: 2-3 minutes
- Production access: 5 minutes (but approval takes 24-48 hours)

**Total**: ~30 minutes of active work (plus waiting for DNS/production access)

---

## 🎯 Priority Order

1. **Environment Variables** (Do this first - quickest)
2. **reCAPTCHA Setup** (You're handling this)
3. **SES Domain Verification** (Can do in parallel with reCAPTCHA)
4. **Production Access Requests** (Can do later if needed)
5. **Testing** (After everything is set up)

---

## 📚 Reference Documents

- **SNS Setup**: `SNS_CONSOLE_LOCATION.md`
- **SES Setup**: `SES_VERIFICATION_CHECKLIST.md`
- **Complete Setup Guide**: `OTP_AUTH_SETUP_CHECKLIST.md`
- **Quick Reference**: `SETUP_QUICK_REFERENCE.md`
- **AWS Services Complete**: `AWS_SERVICES_SETUP_COMPLETE.md`

---

**Last Updated**: Current date
**Status**: Almost there! Just a few more steps.

