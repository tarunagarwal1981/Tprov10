# Secure Secrets Setup Guide

## Overview
This guide walks you through setting up AWS Secrets Manager to securely store sensitive credentials instead of embedding them in environment variables or build artifacts.

## Why This Approach?

✅ **Security**: Secrets never appear in build logs or deployment artifacts  
✅ **Centralized**: All secrets in one place (AWS Secrets Manager)  
✅ **Auditable**: CloudTrail logs all secret access  
✅ **Rotatable**: Easy to rotate secrets without code changes  
✅ **IAM Controlled**: Fine-grained access control

## Prerequisites

- AWS CLI installed and configured
- Amplify app deployed
- Environment variables currently set in Amplify

## Step-by-Step Setup

### Step 1: Store Secrets in AWS Secrets Manager

Run the setup script:

```powershell
cd aws-migration-scripts
.\setup-secrets-manager.ps1
```

Or manually create the secret:

```powershell
# Create JSON with secrets
$secrets = @{
  RDS_PASSWORD = "ju3vrLHJUW8PqDG4"
  SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  COGNITO_CLIENT_ID = "3uok7ddaj63n79cgk7rrpncukc"
  COGNITO_USER_POOL_ID = "us-east-1_oF5qfa2IX"
} | ConvertTo-Json -Compress

# Create secret
& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" secretsmanager create-secret `
  --name travel-app/dev/secrets `
  --description "Travel App secrets for dev environment" `
  --secret-string $secrets `
  --region us-east-1
```

### Step 2: Grant Amplify Access to Secrets Manager

Follow the guide: `AMPLIFY_SECRETS_MANAGER_IAM.md`

**Quick version:**
1. Find Amplify's execution role ARN
2. Create IAM policy allowing `secretsmanager:GetSecretValue`
3. Attach policy to the role

### Step 3: Update Environment Variables in Amplify

Remove sensitive secrets, keep only non-sensitive config:

**Remove from Amplify:**
- ❌ `RDS_PASSWORD` (now in Secrets Manager)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` (now in Secrets Manager)

**Keep in Amplify:**
- ✅ `RDS_HOST`
- ✅ `RDS_PORT`
- ✅ `RDS_USER`
- ✅ `RDS_DB`
- ✅ `COGNITO_CLIENT_ID` (not really a secret)
- ✅ `COGNITO_USER_POOL_ID` (public identifier)
- ✅ `DEPLOYMENT_REGION`
- ✅ `S3_BUCKET_NAME`
- ✅ All `NEXT_PUBLIC_*` variables

**Add to Amplify:**
- ✅ `SECRETS_MANAGER_SECRET_NAME=travel-app/dev/secrets` (optional, has default)

### Step 4: Deploy Updated Code

The code has been updated to:
- Fetch `RDS_PASSWORD` from Secrets Manager
- Fetch `SUPABASE_SERVICE_ROLE_KEY` from Secrets Manager (when needed)
- Fall back to environment variables for local development

```powershell
git add .
git commit -m "feat: Use AWS Secrets Manager for secure secret storage"
git push origin dev
```

### Step 5: Verify

1. **Wait for deployment** (5-10 minutes)

2. **Check CloudWatch logs** for any Secrets Manager errors:
   - Go to CloudWatch → Log groups
   - Find Amplify log group
   - Look for `[Secrets]` log entries

3. **Test the application:**
   - Login: https://dev.d2p2uq8t9xysui.amplifyapp.com/login
   - Database operations should work
   - No errors in browser console

## How It Works

### Runtime Secret Fetching

1. **First API call**: Code fetches secrets from Secrets Manager
2. **Caching**: Secrets are cached in memory for 5 minutes
3. **Subsequent calls**: Use cached values (no API calls)
4. **Local dev**: Falls back to environment variables

### Code Flow

```
API Route → getSecret('travel-app/dev/secrets', 'RDS_PASSWORD')
  → Check cache
  → If not cached: Call Secrets Manager
  → Cache result (5 min TTL)
  → Return password
  → Initialize database pool
```

## Local Development

For local development, the code automatically falls back to environment variables:

```bash
# .env.local
RDS_PASSWORD=your-local-password
RDS_HOST=localhost
# ... etc
```

No need to set up Secrets Manager locally!

## Secret Rotation

To rotate a secret:

1. **Update in Secrets Manager:**
   ```powershell
   $secrets = @{
     RDS_PASSWORD = "new-password"
     # ... other secrets
   } | ConvertTo-Json -Compress
   
   & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" secretsmanager update-secret `
     --secret-id travel-app/dev/secrets `
     --secret-string $secrets
   ```

2. **Clear cache** (or wait 5 minutes for TTL)
   - The code will automatically fetch the new value on next request

3. **No code changes needed!**

## Troubleshooting

### "AccessDenied" Error

**Problem**: Amplify role doesn't have permission to read secrets.

**Solution**: Follow `AMPLIFY_SECRETS_MANAGER_IAM.md` to grant permissions.

### "Secret not found" Error

**Problem**: Secret name doesn't match.

**Solution**: 
- Check secret name: `travel-app/dev/secrets`
- Or set `SECRETS_MANAGER_SECRET_NAME` environment variable

### Secrets Still Using Environment Variables

**Problem**: Code is falling back to env vars.

**Possible causes:**
1. Local development (expected behavior)
2. Secrets Manager access denied (check IAM)
3. Secret doesn't exist (create it)

### Performance Concerns

**Question**: Won't fetching secrets slow down requests?

**Answer**: 
- Secrets are cached for 5 minutes
- First request: ~100ms (one-time cost)
- Subsequent requests: 0ms (from cache)
- Negligible impact on performance

## Security Best Practices

1. ✅ **Never commit secrets** to git
2. ✅ **Use least privilege** IAM policies
3. ✅ **Enable CloudTrail** for audit logging
4. ✅ **Rotate secrets regularly**
5. ✅ **Use different secrets** for dev/staging/prod
6. ✅ **Monitor secret access** via CloudWatch

## Cost

AWS Secrets Manager pricing:
- **$0.40 per secret per month**
- **$0.05 per 10,000 API calls**

For this app:
- 1 secret: $0.40/month
- ~100 API calls/day (cached): ~$0.015/month
- **Total: ~$0.42/month** (negligible)

## Next Steps

1. ✅ Create secret in Secrets Manager
2. ✅ Grant IAM permissions
3. ✅ Update Amplify environment variables
4. ✅ Deploy code
5. ✅ Test and verify

---

**Status**: Ready to implement. Follow steps 1-5 above.

