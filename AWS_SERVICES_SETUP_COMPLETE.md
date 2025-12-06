# AWS Services Setup - Complete ✅

## Setup Summary

All AWS services for OTP authentication have been configured via AWS CLI.

---

## ✅ Completed Setup

### 1. AWS SNS (SMS) 📱
- **Status**: ✅ Configured
- **Sender ID**: `TRAVCLAN` (set successfully)
- **Monthly Spending Limit**: Currently set to $1 (can be adjusted)
- **Production Access**: Check if you need to request production access

**Verification**:
```bash
aws sns get-sms-attributes --region us-east-1
```

**Next Steps**:
- If in sandbox mode, request production access at:
  https://console.aws.amazon.com/sns/v3/home?region=us-east-1#/text-messaging/account

---

### 2. AWS SES (Email) 📧
- **Status**: ✅ Enabled
- **Sending Enabled**: Yes
- **Verified Identities**: None (needs setup)

**Verification**:
```bash
aws ses get-account-sending-enabled --region us-east-1
aws ses list-identities --region us-east-1
```

**Next Steps**:
1. **Verify an email address** (for testing):
   ```bash
   aws ses verify-email-identity --email-address noreply@yourdomain.com --region us-east-1
   ```
   Then check the email and click the verification link.

2. **OR verify a domain** (for production):
   - Go to: https://console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities
   - Click "Create identity" → "Domain"
   - Follow the DNS configuration steps

3. **Request production access** (if in sandbox mode):
   - Go to: https://console.aws.amazon.com/ses/home?region=us-east-1#/account
   - Click "Request production access"

---

### 3. AWS S3 (Document Storage) 📁
- **Status**: ✅ Fully Configured
- **Bucket Name**: `travclan-documents`
- **Region**: `us-east-1`
- **Versioning**: ✅ Enabled
- **CORS**: ✅ Configured
- **Public Access**: ✅ Blocked (secure)

**Verification**:
```bash
aws s3 ls s3://travclan-documents --region us-east-1
aws s3api get-bucket-versioning --bucket travclan-documents --region us-east-1
aws s3api get-bucket-cors --bucket travclan-documents --region us-east-1
```

**CORS Configuration**:
- Allowed Origins: `localhost:3000`, `*.amplifyapp.com`, `*.netlify.app`
- Allowed Methods: GET, PUT, POST, DELETE, HEAD
- Allowed Headers: All

**No further action needed** - S3 is ready to use!

---

## 📋 Environment Variables to Add

Add these to your `.env.local` file:

```bash
# AWS Configuration
AWS_REGION=us-east-1
DEPLOYMENT_REGION=us-east-1

# SNS (SMS)
SMS_SENDER_ID=TRAVCLAN

# SES (Email) - Update after verifying email/domain
SES_FROM_EMAIL=noreply@yourdomain.com
SES_FROM_NAME=TravClan

# S3 (Documents)
S3_DOCUMENTS_BUCKET=travclan-documents
```

---

## 🧪 Testing

### Test SNS (SMS)
```bash
# Send a test SMS (replace with your phone number)
aws sns publish \
  --phone-number "+1234567890" \
  --message "Test message from TravClan" \
  --region us-east-1
```

### Test SES (Email)
```bash
# Send a test email (after verifying sender email)
aws ses send-email \
  --from noreply@yourdomain.com \
  --to recipient@example.com \
  --subject "Test Email" \
  --text "This is a test email" \
  --region us-east-1
```

### Test S3
```bash
# Upload a test file
echo "Test content" > test.txt
aws s3 cp test.txt s3://travclan-documents/test.txt --region us-east-1

# List files
aws s3 ls s3://travclan-documents --region us-east-1

# Delete test file
aws s3 rm s3://travclan-documents/test.txt --region us-east-1
rm test.txt
```

---

## ⚠️ Important Notes

### SNS (SMS)
- **Sandbox Mode**: In sandbox mode, you can only send SMS to verified phone numbers
- **Production Access**: Request production access to send to any phone number
- **Costs**: ~$0.00645 per SMS in US/Canada, varies by country
- **Spending Limit**: Currently set to $1/month (adjust as needed)

### SES (Email)
- **Sandbox Mode**: In sandbox mode, you can only send to verified email addresses
- **Production Access**: Request production access to send to any email
- **Domain Verification**: Recommended for production (better deliverability)
- **DKIM**: Enable Easy DKIM for better email authentication

### S3 (Documents)
- **Security**: Public access is blocked - all access via presigned URLs
- **Versioning**: Enabled for document history tracking
- **CORS**: Configured for frontend uploads
- **Costs**: Very low (~$0.023/GB/month storage)

---

## 🎯 Next Steps

1. ✅ **SNS**: Already configured (just request production access if needed)
2. ⏳ **SES**: Verify email address or domain
3. ✅ **S3**: Fully configured and ready
4. ⏳ **reCAPTCHA**: You mentioned you'll handle this
5. ⏳ **Environment Variables**: Add the variables listed above to `.env.local`

---

## 📚 Quick Reference Commands

```bash
# Check SNS SMS attributes
aws sns get-sms-attributes --region us-east-1

# Check SES status
aws ses get-account-sending-enabled --region us-east-1
aws ses list-identities --region us-east-1

# Verify email address
aws ses verify-email-identity --email-address noreply@yourdomain.com --region us-east-1

# Check S3 bucket
aws s3 ls s3://travclan-documents --region us-east-1
aws s3api get-bucket-versioning --bucket travclan-documents --region us-east-1
```

---

**Setup Date**: $(Get-Date -Format "yyyy-MM-dd")
**Region**: us-east-1
**Status**: Ready for testing (after SES email/domain verification)

