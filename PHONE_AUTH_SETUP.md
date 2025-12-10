# Phone OTP Authentication Setup Guide

## Prerequisites

### 1. Install Required NPM Packages

```bash
npm install @aws-sdk/client-sns @aws-sdk/client-ses uuid
npm install --save-dev @types/uuid
```

### 2. Database Migration

Run the migration script to set up the database schema:

```bash
# Connect to your RDS PostgreSQL database and run:
psql -h <RDS_HOST> -U <RDS_USER> -d <RDS_DATABASE> -f migrations/001_phone_auth_schema.sql
```

Or execute the SQL file through your database management tool.

### 3. AWS Services Configuration

#### A. AWS SNS (SMS)
1. Go to AWS SNS Console
2. Create a new SNS Topic (optional) or use direct SMS
3. Set up SMS preferences:
   - Go to SNS → Text messaging (SMS)
   - Set default sender ID: `TRAVCLAN` (max 11 characters)
   - Configure spending limits
4. **Important**: Request production access for SMS if in sandbox mode
5. Add environment variable (optional):
   ```
   SNS_SMS_TOPIC_ARN=arn:aws:sns:us-east-1:xxxxx:sms-topic
   SMS_SENDER_ID=TRAVCLAN
   ```

#### B. AWS SES (Email)
1. Go to AWS SES Console
2. Verify your sender email domain or email address
3. Request production access (if in sandbox mode)
4. Add environment variables:
   ```
   SES_FROM_EMAIL=noreply@yourdomain.com
   SES_FROM_NAME=TravClan
   ```

#### C. AWS Cognito Custom Auth Flow
1. Go to AWS Cognito Console → User Pools
2. Select your existing User Pool
3. Go to "Sign-in experience" → "Authentication"
4. Enable "Custom authentication challenge"
5. Configure Lambda triggers:
   - **Define Auth Challenge**: Determines next challenge
   - **Create Auth Challenge**: Generates OTP
   - **Verify Auth Challenge**: Verifies OTP
6. Or use the simpler approach: Create users with temporary passwords and use custom auth

#### D. Google reCAPTCHA
1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Create a new site:
   - Label: "TravClan Auth"
   - Type: reCAPTCHA v2 ("I'm not a robot" checkbox) or v3
   - Domains: Add your domain(s)
3. Copy the **Site Key** and **Secret Key**
4. Add environment variables:
   ```
   RECAPTCHA_SITE_KEY=your_site_key_here
   RECAPTCHA_SECRET_KEY=your_secret_key_here
   RECAPTCHA_MIN_SCORE=0.5  # For v3 only
   ```

#### E. AWS S3 (Document Storage)
1. Create S3 bucket: `travclan-documents` (or your preferred name)
2. Configure CORS:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://yourdomain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
3. Set up bucket policy for presigned URLs
4. Add environment variables:
   ```
   S3_DOCUMENTS_BUCKET=travclan-documents
   AWS_REGION=us-east-1
   ```

### 4. Environment Variables

Add to your `.env.local` (development) and production environment:

```bash
# AWS Configuration
AWS_REGION=us-east-1
DEPLOYMENT_REGION=us-east-1

# Cognito (existing)
COGNITO_USER_POOL_ID=your_user_pool_id
COGNITO_CLIENT_ID=your_client_id

# SNS (SMS)
SNS_SMS_TOPIC_ARN=arn:aws:sns:us-east-1:xxxxx:sms-topic  # Optional
SMS_SENDER_ID=TRAVCLAN

# SES (Email)
SES_FROM_EMAIL=noreply@yourdomain.com
SES_FROM_NAME=TravClan

# reCAPTCHA
RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key
RECAPTCHA_MIN_SCORE=0.5

# S3
S3_DOCUMENTS_BUCKET=travclan-documents

# Database (existing)
RDS_HOSTNAME=your_rds_host
RDS_PORT=5432
RDS_DATABASE=your_database
RDS_USERNAME=your_user
RDS_PASSWORD=your_password
```

### 5. Testing

#### Development Mode
- OTP codes are returned in API responses for testing
- reCAPTCHA verification is optional in development
- SMS/Email sending can be mocked

#### Production Mode
- OTP codes are NOT returned in responses
- reCAPTCHA is required
- Real SMS/Email delivery

## API Endpoints

### 1. Initialize Phone Auth
```
POST /api/auth/phone/init
Body: { countryCode, phoneNumber, recaptchaToken }
Response: { mode: 'login' | 'signup', userExists: boolean }
```

### 2. Signup (New User)
```
POST /api/auth/phone/signup
Body: { countryCode, phoneNumber, email, name, companyName?, recaptchaToken }
Response: { success: true, message: 'OTP sent', expiresAt }
```

### 3. Request OTP (Login)
```
POST /api/auth/phone/request-otp
Body: { countryCode, phoneNumber, recaptchaToken }
Response: { success: true, message: 'OTP sent', expiresAt }
```

### 4. Verify OTP
```
POST /api/auth/phone/verify-otp
Body: { countryCode, phoneNumber, code, purpose, email?, name?, companyName? }
Response: { success: true, authenticated: true, user: {...} }
```

## Next Steps

1. Run database migration
2. Install NPM packages
3. Configure AWS services (SNS, SES, S3)
4. Set up reCAPTCHA
5. Add environment variables
6. Test the API endpoints
7. Implement frontend components (next phase)

## Troubleshooting

### SMS Not Sending
- Check SNS SMS spending limits
- Verify phone number format (E.164 format: +1234567890)
- Check AWS CloudWatch logs for SNS errors
- Ensure production access is granted (not in sandbox)

### Email Not Sending
- Verify sender email/domain in SES
- Check SES sending limits
- Verify email addresses are verified (in sandbox mode)
- Check CloudWatch logs for SES errors

### OTP Verification Failing
- Check database connection
- Verify OTP hasn't expired (10 minutes)
- Check rate limiting (max 3 requests per 15 minutes)
- Verify reCAPTCHA token is valid

### Database Errors
- Ensure migration script ran successfully
- Check RDS connection settings
- Verify table permissions
- Check CloudWatch logs for database errors

