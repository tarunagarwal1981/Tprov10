# OTP Authentication Setup Checklist

Complete setup guide for Phone OTP Authentication, reCAPTCHA, SMS, Email, and Document Storage.

---

## 📋 Prerequisites Checklist

### 1. NPM Packages Installation ✅
```bash
npm install @aws-sdk/client-sns @aws-sdk/client-ses uuid
npm install --save-dev @types/uuid
```

**Status**: Check if installed
```bash
npm list @aws-sdk/client-sns @aws-sdk/client-ses uuid
```

---

## 🔐 AWS Services Setup

### 2. AWS SNS (SMS Delivery) 📱

#### Step-by-Step Setup:

1. **Go to AWS SNS Console**
   - Navigate to: https://console.aws.amazon.com/sns/
   - Select your region (e.g., `us-east-1`)

2. **Configure SMS Preferences**
   - Go to **Text messaging (SMS)** → **Preferences**
   - Set **Default sender ID**: `TRAVCLAN` (max 11 characters)
   - Configure **Spending limits** (recommended: $10-50/month for testing)
   - Set **Delivery status logging** (optional but recommended)

3. **Request Production Access** (if in sandbox mode)
   - Go to **Text messaging (SMS)** → **Account preferences**
   - Click **Request production access**
   - Fill out the form:
     - Use case: "User authentication via OTP"
     - Website URL: Your production domain
     - Sample messages: "Your verification code is 123456. Valid for 10 minutes."
   - Wait for approval (usually 24-48 hours)

4. **Optional: Create SNS Topic** (for advanced routing)
   - Go to **Topics** → **Create topic**
   - Type: Standard
   - Name: `sms-otp-topic`
   - Copy the Topic ARN

5. **IAM Permissions** (for your application)
   - Ensure your AWS credentials/role have:
     ```json
     {
       "Effect": "Allow",
       "Action": [
         "sns:Publish",
         "sns:GetSMSAttributes",
         "sns:SetSMSAttributes"
       ],
       "Resource": "*"
     }
     ```

#### Environment Variables:
```bash
# Required
AWS_REGION=us-east-1
SMS_SENDER_ID=TRAVCLAN

# Optional (if using SNS Topic)
SNS_SMS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:sms-otp-topic
```

#### Testing:
- Test with your own phone number first
- Check CloudWatch logs: `/aws/sns/sms`
- Verify SMS delivery status in SNS console

---

### 3. AWS SES (Email Delivery) 📧

#### Step-by-Step Setup:

1. **Go to AWS SES Console**
   - Navigate to: https://console.aws.amazon.com/ses/
   - Select your region (must match SNS region)

2. **Verify Email Address or Domain**
   
   **Option A: Verify Single Email** (for testing)
   - Go to **Verified identities** → **Create identity**
   - Choose **Email address**
   - Enter: `noreply@yourdomain.com`
   - Click **Create identity**
   - Check your email and click verification link
   
   **Option B: Verify Domain** (for production)
   - Go to **Verified identities** → **Create identity**
   - Choose **Domain**
   - Enter your domain: `yourdomain.com`
   - Choose **Easy DKIM** (recommended)
   - Add DNS records to your domain:
     - CNAME records for DKIM (3 records)
     - TXT record for domain verification
   - Wait for verification (can take up to 72 hours)

3. **Request Production Access** (if in sandbox mode)
   - Go to **Account dashboard**
   - Click **Request production access**
   - Fill out the form:
     - Mail type: Transactional
     - Website URL: Your production domain
     - Use case: "User authentication OTP emails"
     - Expected volume: Your estimate
   - Wait for approval (usually 24-48 hours)

4. **Configure Email Sending**
   - Go to **Configuration** → **Sending statistics**
   - Monitor bounce and complaint rates
   - Set up **SNS notifications** for bounces/complaints (optional)

5. **IAM Permissions** (for your application)
   - Ensure your AWS credentials/role have:
     ```json
     {
       "Effect": "Allow",
       "Action": [
         "ses:SendEmail",
         "ses:SendRawEmail"
       ],
       "Resource": "*"
     }
     ```

#### Environment Variables:
```bash
# Required
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@yourdomain.com
SES_FROM_NAME=TravClan

# Alternative (if using different variable name)
FROM_EMAIL=noreply@yourdomain.com
```

#### Testing:
- Send test email to verified addresses
- Check CloudWatch logs: `/aws/ses`
- Monitor bounce/complaint rates

---

### 4. Google reCAPTCHA 🛡️

#### Step-by-Step Setup:

1. **Go to Google reCAPTCHA Admin Console**
   - Navigate to: https://www.google.com/recaptcha/admin
   - Sign in with your Google account

2. **Create a New Site**
   - Click **+** (Create) button
   - Fill out the form:
     - **Label**: `TravClan Auth` (or your app name)
     - **reCAPTCHA type**: 
       - **v2** → "I'm not a robot" Checkbox (recommended for login)
       - **v3** → Invisible reCAPTCHA (better UX, score-based)
     - **Domains**: 
       - Add `localhost` (for development)
       - Add your production domain: `yourdomain.com`
       - Add `*.yourdomain.com` (for subdomains)
     - Accept terms and conditions
   - Click **Submit**

3. **Copy Keys**
   - **Site Key** (public, used in frontend)
   - **Secret Key** (private, used in backend)
   - ⚠️ Keep Secret Key secure!

4. **Configure reCAPTCHA v3 Score** (if using v3)
   - Default threshold: 0.5
   - Lower = more strict (0.3-0.4)
   - Higher = more lenient (0.6-0.7)
   - Recommended: 0.5 for authentication

#### Environment Variables:
```bash
# Required
RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RECAPTCHA_SECRET_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Optional (for v3 only)
RECAPTCHA_MIN_SCORE=0.5
```

#### Frontend Integration:
Add to your frontend (e.g., in `phone-login/page.tsx`):
```tsx
import { ReCAPTCHA } from 'react-google-recaptcha';

<ReCAPTCHA
  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
  onChange={handleRecaptchaChange}
/>
```

**Note**: Frontend needs `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (public key)

#### Testing:
- Test in development (localhost)
- Verify token generation in browser console
- Check backend verification logs

---

### 5. AWS S3 (Document Storage) 📁

#### Step-by-Step Setup:

1. **Create S3 Bucket**
   - Go to AWS S3 Console: https://console.aws.amazon.com/s3/
   - Click **Create bucket**
   - **Bucket name**: `travclan-documents` (must be globally unique)
   - **Region**: Same as your other services (e.g., `us-east-1`)
   - **Block Public Access**: Keep enabled (we'll use presigned URLs)
   - **Versioning**: Enable (recommended for document tracking)
   - **Encryption**: Enable (SSE-S3 or SSE-KMS)
   - Click **Create bucket**

2. **Configure CORS**
   - Go to your bucket → **Permissions** → **CORS**
   - Add CORS configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedOrigins": [
         "http://localhost:3000",
         "https://yourdomain.com",
         "https://*.yourdomain.com"
       ],
       "ExposeHeaders": ["ETag", "x-amz-server-side-encryption"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

3. **Set Up Bucket Policy** (for presigned URLs)
   - Go to **Permissions** → **Bucket policy**
   - Add policy (optional, presigned URLs work without this):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowPresignedURLUploads",
         "Effect": "Allow",
         "Principal": "*",
         "Action": ["s3:PutObject", "s3:GetObject"],
         "Resource": "arn:aws:s3:::travclan-documents/*",
         "Condition": {
           "StringEquals": {
             "s3:x-amz-server-side-encryption": "AES256"
           }
         }
       }
     ]
   }
   ```

4. **Create Folder Structure** (optional, for organization)
   - `documents/aadhar/`
   - `documents/pan/`
   - `documents/incorporation/`
   - `documents/owner-pan/`

5. **IAM Permissions** (for your application)
   - Ensure your AWS credentials/role have:
   ```json
   {
     "Effect": "Allow",
     "Action": [
       "s3:PutObject",
       "s3:GetObject",
       "s3:DeleteObject",
       "s3:PutObjectAcl"
     ],
     "Resource": "arn:aws:s3:::travclan-documents/*"
   }
   ```

#### Environment Variables:
```bash
# Required
AWS_REGION=us-east-1
S3_DOCUMENTS_BUCKET=travclan-documents
```

#### Testing:
- Generate presigned URL via API
- Test file upload using presigned URL
- Verify file appears in S3 bucket

---

## 🗄️ Database Setup

### 6. Database Migration ✅

**Status**: Migration script ready at `migrations/001_phone_auth_schema.sql`

#### Run Migration:
```bash
# Via EC2 (recommended if direct connection blocked)
ssh -i dbeaver-ec2-key.pem ec2-user@<EC2_IP>
cd /path/to/migration
psql -h <RDS_HOST> -U <RDS_USER> -d <RDS_DATABASE> -f 001_phone_auth_schema.sql

# Or via DBeaver (if connection works)
# Open SQL Editor → Execute script
```

#### Verify Migration:
```bash
# Check tables exist
psql -h <RDS_HOST> -U <RDS_USER> -d <RDS_DATABASE> -c "\dt"

# Should see:
# - otp_codes
# - account_details
# - brand_details
# - business_details
# - documents
```

---

## 🔑 Environment Variables

### 7. Complete Environment Variables List

Create `.env.local` (development) and set production environment variables:

```bash
# ============================================
# AWS Configuration
# ============================================
AWS_REGION=us-east-1
DEPLOYMENT_REGION=us-east-1

# AWS Credentials (if not using IAM roles)
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key

# ============================================
# Cognito (Existing)
# ============================================
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# SNS (SMS)
# ============================================
SMS_SENDER_ID=TRAVCLAN
# Optional: SNS_SMS_TOPIC_ARN=arn:aws:sns:us-east-1:xxxxx:sms-topic

# ============================================
# SES (Email)
# ============================================
SES_FROM_EMAIL=noreply@yourdomain.com
SES_FROM_NAME=TravClan
# Alternative: FROM_EMAIL=noreply@yourdomain.com

# ============================================
# reCAPTCHA
# ============================================
RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RECAPTCHA_SECRET_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RECAPTCHA_MIN_SCORE=0.5

# Frontend (public key)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ============================================
# S3 (Document Storage)
# ============================================
S3_DOCUMENTS_BUCKET=travclan-documents

# ============================================
# Database (Existing)
# ============================================
RDS_HOSTNAME=your-rds-endpoint.region.rds.amazonaws.com
RDS_PORT=5432
RDS_DATABASE=your_database_name
RDS_USERNAME=your_db_user
RDS_PASSWORD=your_db_password

# ============================================
# Application
# ============================================
NODE_ENV=development  # or production
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or https://yourdomain.com
```

---

## ✅ Setup Verification Checklist

### Quick Test Commands:

1. **Test AWS Credentials**
   ```bash
   aws sts get-caller-identity
   ```

2. **Test SNS Access**
   ```bash
   aws sns get-sms-attributes --region us-east-1
   ```

3. **Test SES Access**
   ```bash
   aws ses get-account-sending-enabled --region us-east-1
   ```

4. **Test S3 Access**
   ```bash
   aws s3 ls s3://travclan-documents --region us-east-1
   ```

5. **Test Database Connection**
   ```bash
   psql -h <RDS_HOST> -U <RDS_USER> -d <RDS_DATABASE> -c "SELECT version();"
   ```

6. **Test reCAPTCHA** (via API endpoint)
   - Make a test request to `/api/auth/phone/init` with a reCAPTCHA token

---

## 🧪 Testing Flow

### 1. Test Phone Signup Flow:
```
1. POST /api/auth/phone/init
   → Should return { mode: 'signup', userExists: false }

2. POST /api/auth/phone/signup
   → Should send OTP via SMS/Email
   → Check phone/email for OTP code

3. POST /api/auth/phone/verify-otp
   → Should authenticate and return user tokens
```

### 2. Test Phone Login Flow:
```
1. POST /api/auth/phone/init
   → Should return { mode: 'login', userExists: true }

2. POST /api/auth/phone/request-otp
   → Should send OTP via SMS/Email

3. POST /api/auth/phone/verify-otp
   → Should authenticate and return user tokens
```

### 3. Test Profile Onboarding:
```
1. GET /api/profile/account
   → Should return empty/null profile

2. POST /api/profile/account
   → Should create account details

3. Repeat for brand, business, documents
```

---

## 🚨 Common Issues & Solutions

### Issue: SMS Not Sending
- ✅ Check SNS SMS spending limits
- ✅ Verify phone number format (E.164: +1234567890)
- ✅ Check CloudWatch logs: `/aws/sns/sms`
- ✅ Ensure production access granted (not in sandbox)
- ✅ Verify IAM permissions for SNS

### Issue: Email Not Sending
- ✅ Verify sender email/domain in SES
- ✅ Check SES sending limits
- ✅ Verify email addresses (in sandbox mode, must be verified)
- ✅ Check CloudWatch logs: `/aws/ses`
- ✅ Verify IAM permissions for SES

### Issue: reCAPTCHA Verification Failing
- ✅ Verify domain is added to reCAPTCHA site
- ✅ Check Site Key matches Secret Key
- ✅ Verify token is being sent from frontend
- ✅ Check backend logs for reCAPTCHA API errors
- ✅ For v3: Adjust `RECAPTCHA_MIN_SCORE` if too strict

### Issue: S3 Upload Failing
- ✅ Verify bucket name and region
- ✅ Check CORS configuration
- ✅ Verify IAM permissions for S3
- ✅ Check presigned URL expiration (default: 1 hour)
- ✅ Verify file size limits

### Issue: Database Connection Issues
- ✅ Check RDS security group allows connections
- ✅ Verify RDS endpoint and credentials
- ✅ Check VPC/subnet configuration
- ✅ Use EC2 as bridge if local network blocks port 5432

---

## 📊 Cost Estimates

### AWS SNS (SMS)
- **US/Canada**: ~$0.00645 per SMS
- **India**: ~$0.00225 per SMS
- **Other countries**: Varies
- **Monthly estimate**: $10-50 for testing, $100-500 for production

### AWS SES (Email)
- **First 62,000 emails/month**: FREE (if from EC2)
- **After**: $0.10 per 1,000 emails
- **Monthly estimate**: $0-10 for most use cases

### AWS S3 (Storage)
- **Storage**: $0.023 per GB/month
- **PUT requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests
- **Monthly estimate**: $1-5 for document storage

### Google reCAPTCHA
- **FREE** for reasonable usage
- No cost for authentication use cases

---

## 🎯 Next Steps After Setup

1. ✅ Run database migration
2. ✅ Install NPM packages
3. ✅ Configure all AWS services
4. ✅ Set up reCAPTCHA
5. ✅ Add all environment variables
6. ✅ Test each service individually
7. ✅ Test complete authentication flow
8. ✅ Deploy to production
9. ✅ Monitor CloudWatch logs
10. ✅ Set up alerts for failures

---

## 📚 Additional Resources

- [AWS SNS SMS Documentation](https://docs.aws.amazon.com/sns/latest/dg/sns-sms.html)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**Last Updated**: Based on current implementation
**Status**: Ready for setup and testing

