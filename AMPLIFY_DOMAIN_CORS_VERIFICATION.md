# AWS Amplify Domain & CORS Verification Report

## 🔍 Amplify App Information

**App ID:** `d2p2uq8t9xysui`  
**Region:** `us-east-1`

### Domains Found:

1. **Default Amplify Domain:**
   - `https://dev.d2p2uq8t9xysui.amplifyapp.com`

2. **Custom Domain (if configured):**
   - `https://dev.travelselbuy.com`

---

## ✅ CORS Configuration Check

### Current CORS Allowed Origins (from codebase):

From `cors-config.json` and other CORS files:
- ✅ `http://localhost:3000`
- ✅ `http://localhost:3001`
- ✅ `https://dev.travelselbuy.com`
- ✅ `https://travelselbuy.com`
- ✅ `https://www.travelselbuy.com`
- ❌ **MISSING:** `https://dev.d2p2uq8t9xysui.amplifyapp.com` (Default Amplify domain)
- ❌ **MISSING:** `https://*.amplifyapp.com` (Wildcard for all Amplify domains)

### ⚠️ Issue Identified:

The CORS configuration does NOT include the default Amplify domain. This is likely causing the CORS errors!

**Error shows:** `https://dev.travelselbuy.com/api/...` being blocked

**Possible causes:**
1. Frontend is deployed on `dev.d2p2uq8t9xysui.amplifyapp.com` but CORS doesn't allow it
2. Custom domain `dev.travelselbuy.com` is not properly configured in Amplify
3. API routes need CORS headers (as discussed in previous analysis)

---

## 🔐 AWS Credentials Check (.env.local lines 45-47)

### What Should Be in .env.local (lines 45-47):

Based on the codebase patterns, these lines likely contain:

```env
AWS_ACCESS_KEY_ID=AKIA332JH3CCLBV6UL5E  # Replace with your actual key
AWS_SECRET_ACCESS_KEY=...  # Your secret key
AWS_REGION=us-east-1  # or DEPLOYMENT_REGION
```

### ⚠️ Security Warning:

**NEVER commit `.env.local` to Git!** It contains sensitive credentials.

### What to Verify in AWS:

1. **IAM User/Role Permissions:**
   - Check if the AWS credentials have necessary permissions
   - Required permissions for Amplify deployment:
     - `amplify:*` (for Amplify operations)
     - `s3:*` (for S3 bucket access)
     - `rds:*` (if accessing RDS directly)
     - `lambda:InvokeFunction` (for database Lambda)
     - `secretsmanager:GetSecretValue` (if using Secrets Manager)

2. **AWS Credentials Validity:**
   - Verify the access key is active
   - Check if credentials are not expired
   - Ensure the IAM user/role exists

3. **Region Configuration:**
   - Verify `AWS_REGION` or `DEPLOYMENT_REGION` matches Amplify region (`us-east-1`)

---

## 📋 Verification Commands (if AWS CLI is available):

### Check Amplify App:
```bash
aws amplify get-app --app-id d2p2uq8t9xysui --region us-east-1
```

### Check Amplify Branches:
```bash
aws amplify list-branches --app-id d2p2uq8t9xysui --region us-east-1
```

### Check Amplify Domain:
```bash
aws amplify get-domain-association --app-id d2p2uq8t9xysui --domain-name dev.travelselbuy.com --region us-east-1
```

### Check IAM User Permissions:
```bash
aws iam get-user --user-name tarunagarwal
aws iam list-attached-user-policies --user-name tarunagarwal
```

---

## 🎯 Recommended Actions:

### 1. Fix CORS Configuration:

**Option A: Add Amplify Domain to CORS (if using middleware/API routes):**
```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://dev.d2p2uq8t9xysui.amplifyapp.com',  // ✅ ADD THIS
  'https://dev.travelselbuy.com',
  'https://travelselbuy.com',
  'https://www.travelselbuy.com',
];
```

**Option B: Use Wildcard (less secure, but works for all Amplify domains):**
```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://*.amplifyapp.com',  // ✅ WILDCARD
  'https://dev.travelselbuy.com',
  'https://travelselbuy.com',
  'https://www.travelselbuy.com',
];
```

### 2. Verify Custom Domain Setup:

1. Go to AWS Amplify Console:
   - https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/d2p2uq8t9xysui
2. Navigate to: **App settings** → **Domain management**
3. Verify `dev.travelselbuy.com` is configured and verified
4. Check DNS records are properly set up

### 3. Check .env.local Credentials:

1. **Verify AWS Access Key:**
   - Go to: https://console.aws.amazon.com/iam/
   - Navigate to: **Users** → Find user with access key `AKIA332JH3CCLBV6UL5E`
   - Check if user is active and has necessary permissions

2. **Check Credentials Format:**
   - Ensure no extra spaces or quotes
   - Verify region matches (`us-east-1`)

3. **Security Best Practice:**
   - Consider using IAM roles instead of access keys
   - If using access keys, rotate them regularly
   - Never commit credentials to Git

---

## 🔗 Quick Links:

- **Amplify Console:** https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/d2p2uq8t9xysui
- **Amplify Environment Variables:** https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/d2p2uq8t9xysui/settings/variables
- **Amplify Domain Management:** https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/d2p2uq8t9xysui/settings/domain
- **IAM Console:** https://console.aws.amazon.com/iam/

---

## 📝 Summary:

1. ✅ **Amplify App ID:** `d2p2uq8t9xysui`
2. ✅ **Default Domain:** `dev.d2p2uq8t9xysui.amplifyapp.com`
3. ⚠️ **CORS Issue:** Default Amplify domain not in allowed origins
4. ⚠️ **Custom Domain:** `dev.travelselbuy.com` needs verification
5. ⚠️ **AWS Credentials:** Need to verify IAM permissions and validity

**Next Steps:**
1. Add Amplify default domain to CORS allowed origins
2. Verify custom domain configuration in Amplify
3. Check AWS credentials permissions in IAM console
4. Implement CORS middleware (as discussed in previous solution)

