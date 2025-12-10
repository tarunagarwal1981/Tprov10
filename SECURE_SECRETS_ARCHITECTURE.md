# Secure Secrets Architecture

## Problem with Current Approach
- Environment variables in `next.config.ts` get inlined into build artifacts
- Secrets could be exposed in build logs or deployment artifacts
- Not following security best practices

## Secure Solution: AWS Secrets Manager

### Architecture
1. **Store secrets in AWS Secrets Manager** (encrypted at rest)
2. **Fetch secrets at runtime** (not at build time)
3. **Cache secrets in memory** (avoid repeated API calls)
4. **Use IAM roles** for authentication (no credentials in code)

### Benefits
- ✅ Secrets never in build artifacts
- ✅ Centralized secret management
- ✅ Automatic rotation support
- ✅ Audit trail via CloudTrail
- ✅ Fine-grained access control via IAM

## Implementation Plan

### Step 1: Store Secrets in AWS Secrets Manager
Create a secret with all sensitive values:
- `RDS_PASSWORD`
- `SUPABASE_SERVICE_ROLE_KEY`
- `COGNITO_CLIENT_ID` (less sensitive, but good practice)
- `COGNITO_USER_POOL_ID` (less sensitive, but good practice)

### Step 2: Create Secrets Fetching Utility
- Fetch from Secrets Manager at runtime
- Cache in memory with TTL
- Fallback to environment variables for local development

### Step 3: Update Code to Use Secrets
- Replace direct `process.env` access with secrets fetcher
- Initialize secrets on first API route call
- Use cached values for subsequent requests

### Step 4: Configure IAM Permissions
- Grant Amplify's execution role access to Secrets Manager
- Use least privilege principle

## Alternative: AWS Systems Manager Parameter Store
- Similar to Secrets Manager but free for standard parameters
- Good for non-sensitive config values
- Use Secrets Manager for actual secrets (passwords, keys)

## Recommendation
Use **AWS Secrets Manager** for:
- `RDS_PASSWORD`
- `SUPABASE_SERVICE_ROLE_KEY`

Use **Environment Variables** (safe) for:
- `COGNITO_CLIENT_ID` (not really a secret)
- `COGNITO_USER_POOL_ID` (public identifier)
- `RDS_HOST`, `RDS_PORT`, `RDS_USER`, `RDS_DB` (connection info, not secrets)
- `DEPLOYMENT_REGION` (public info)

This hybrid approach balances security and performance.

