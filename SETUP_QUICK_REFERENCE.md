# OTP Authentication Setup - Quick Reference

## ✅ What's Already Done

- ✅ NPM packages installed (`@aws-sdk/client-sns`, `@aws-sdk/client-ses`, `uuid`)
- ✅ Database migration script ready (`migrations/001_phone_auth_schema.sql`)
- ✅ Backend services implemented (OTP, SMS, Email, reCAPTCHA, S3)
- ✅ API endpoints created
- ✅ Frontend components created

## 🔧 What Needs Setup

### 1. AWS SNS (SMS) 📱
**Status**: ⏳ Needs Configuration

**Quick Steps**:
1. AWS Console → SNS → Text messaging (SMS)
2. Set sender ID: `TRAVCLAN`
3. Request production access (if in sandbox)
4. Set spending limits

**Env Vars**:
```bash
SMS_SENDER_ID=TRAVCLAN
AWS_REGION=us-east-1
```

---

### 2. AWS SES (Email) 📧
**Status**: ⏳ Needs Configuration

**Quick Steps**:
1. AWS Console → SES → Verified identities
2. Verify email: `noreply@yourdomain.com` OR verify domain
3. Request production access (if in sandbox)

**Env Vars**:
```bash
SES_FROM_EMAIL=noreply@yourdomain.com
SES_FROM_NAME=TravClan
AWS_REGION=us-east-1
```

---

### 3. Google reCAPTCHA 🛡️
**Status**: ⏳ Needs Configuration

**Quick Steps**:
1. Go to https://www.google.com/recaptcha/admin
2. Create site (v2 or v3)
3. Add domains: `localhost`, `yourdomain.com`
4. Copy Site Key & Secret Key

**Env Vars**:
```bash
RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RECAPTCHA_SECRET_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RECAPTCHA_MIN_SCORE=0.5  # v3 only
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  # Frontend
```

---

### 4. AWS S3 (Documents) 📁
**Status**: ⏳ Needs Configuration

**Quick Steps**:
1. AWS Console → S3 → Create bucket: `travclan-documents`
2. Configure CORS (see full guide)
3. Enable versioning (recommended)

**Env Vars**:
```bash
S3_DOCUMENTS_BUCKET=travclan-documents
AWS_REGION=us-east-1
```

---

### 5. Database Migration 🗄️
**Status**: ⏳ Needs Execution

**Quick Steps**:
1. Connect to RDS (via EC2 or DBeaver)
2. Run: `psql -h <RDS_HOST> -U <RDS_USER> -d <RDS_DATABASE> -f migrations/001_phone_auth_schema.sql`
3. Verify tables created

---

## 📋 Complete Environment Variables

```bash
# AWS
AWS_REGION=us-east-1
DEPLOYMENT_REGION=us-east-1

# Cognito (existing)
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# SNS (SMS)
SMS_SENDER_ID=TRAVCLAN

# SES (Email)
SES_FROM_EMAIL=noreply@yourdomain.com
SES_FROM_NAME=TravClan

# reCAPTCHA
RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RECAPTCHA_SECRET_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RECAPTCHA_MIN_SCORE=0.5
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# S3
S3_DOCUMENTS_BUCKET=travclan-documents

# Database (existing)
RDS_HOSTNAME=your-rds-endpoint.region.rds.amazonaws.com
RDS_PORT=5432
RDS_DATABASE=your_database_name
RDS_USERNAME=your_db_user
RDS_PASSWORD=your_db_password
```

---

## 🧪 Quick Test Commands

```bash
# Test AWS credentials
aws sts get-caller-identity

# Test SNS
aws sns get-sms-attributes --region us-east-1

# Test SES
aws ses get-account-sending-enabled --region us-east-1

# Test S3
aws s3 ls s3://travclan-documents --region us-east-1

# Test Database
psql -h <RDS_HOST> -U <RDS_USER> -d <RDS_DATABASE> -c "SELECT version();"
```

---

## 📚 Full Documentation

See `OTP_AUTH_SETUP_CHECKLIST.md` for detailed step-by-step instructions.

---

## ⚡ Priority Order

1. **Database Migration** (required for everything)
2. **reCAPTCHA** (required for auth endpoints)
3. **AWS SNS** (required for SMS OTP)
4. **AWS SES** (required for email OTP)
5. **AWS S3** (required for document uploads)

---

## 💰 Estimated Monthly Costs

- **SNS (SMS)**: $10-50 (testing), $100-500 (production)
- **SES (Email)**: $0-10 (mostly free)
- **S3 (Storage)**: $1-5 (document storage)
- **reCAPTCHA**: FREE

**Total**: ~$15-65/month for testing, $100-515/month for production

---

**Last Updated**: Based on current implementation

