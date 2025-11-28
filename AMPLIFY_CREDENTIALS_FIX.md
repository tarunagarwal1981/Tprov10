# Fix Amplify Credentials Issue

## Problem
```
CredentialsProviderError: Could not load credentials from any providers
```

## Root Cause
In Amplify, API routes run in a Lambda environment, but the execution role needs:
1. **IAM permissions** to invoke the Lambda
2. **Proper credential chain** configuration

## Solution

### Step 1: Grant Lambda Invoke Permission (CRITICAL)

The Amplify execution role MUST have permission to invoke the Lambda. This is the most common cause.

**Get Amplify Service Role:**
1. Amplify Console → Your App → **General** → **Service role**
2. Copy the role ARN (e.g., `arn:aws:iam::ACCOUNT:role/amplify-APP-ROLE`)

**Grant Permission via AWS CLI:**
```powershell
# Replace ROLE_ARN with your Amplify service role ARN
aws lambda add-permission `
  --function-name travel-app-database-service `
  --statement-id amplify-invoke-permission `
  --action lambda:InvokeFunction `
  --principal ROLE_ARN `
  --region us-east-1
```

**Or via Console:**
1. Lambda Console → `travel-app-database-service` → **Configuration** → **Permissions**
2. **Add permissions** → **Create resource-based policy**
3. **Principal**: Your Amplify service role ARN
4. **Action**: `lambda:InvokeFunction`
5. **Save**

### Step 2: Verify IAM Role Has Lambda Invoke Policy

The Amplify execution role should have a policy that allows Lambda invocation:

1. IAM Console → **Roles** → Find your Amplify role
2. Check **Permissions** tab
3. Should have policy with `lambda:InvokeFunction` permission
4. If not, attach `AWSLambda_FullAccess` or create custom policy

### Step 3: Wait for IAM Propagation

After granting permissions, wait 1-2 minutes for IAM changes to propagate.

### Step 4: Test Again

After granting permission:
1. Test login again
2. Check logs - should see:
   - `[Lambda Client] Lambda client created...`
   - `[Lambda Client] Invoking travel-app-database-service...`
   - `[Lambda Client] Lambda invocation successful...`

## Why This Happens

In Amplify:
- API routes run in Lambda environment
- They use the **Amplify execution role** for AWS SDK calls
- The SDK automatically gets credentials from the execution role
- BUT the role needs **permission** to invoke other Lambdas

The `CredentialsProviderError` happens when:
1. The execution role doesn't have Lambda invoke permission
2. The SDK can't find credentials (rare in Amplify)

## Verification

After fixing, you should see in Amplify logs:
```
[Lambda Client] Lambda client created for region: us-east-1
[Lambda Client] Invoking travel-app-database-service with action: queryOne
[Lambda Client] Lambda invocation successful for action: queryOne
```

And in Lambda CloudWatch logs:
```
[Database] Event: {"action":"queryOne","query":"SELECT * FROM users WHERE id = $1 OR email = $2 LIMIT 1","params":["...","..."]}
[Database] Connection pool initialized
```

## Quick Fix Script

Run this to grant permission automatically:
```powershell
powershell -ExecutionPolicy Bypass -File aws-migration-scripts/grant-lambda-invoke-permission.ps1
```

This will:
1. Get your Amplify app ID
2. Find the service role
3. Grant Lambda invoke permission

## Summary

The code is correct - it uses the default credential provider chain which works in Amplify. The issue is **missing IAM permissions**. Grant the Amplify execution role permission to invoke the Lambda, and it will work!

