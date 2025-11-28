# Fix Credentials Error - Lambda Invocation

## Error
```
CredentialsProviderError: Could not load credentials from any providers
```

## Root Cause
The Amplify execution role doesn't have permission to invoke the Lambda function, OR the role isn't being used properly.

## Solution

### Option 1: Grant Lambda Invoke Permission to Amplify (Recommended)

The Amplify execution role needs permission to invoke the database Lambda.

**Step 1: Get Amplify Service Role ARN**

1. Go to Amplify Console → Your App → **General** → **Service role**
2. Copy the role ARN (looks like: `arn:aws:iam::ACCOUNT:role/amplify-APP-ROLE`)

**Step 2: Add Lambda Permission**

Run this command (replace ROLE_ARN with your Amplify service role ARN):

```powershell
aws lambda add-permission `
  --function-name travel-app-database-service `
  --statement-id amplify-invoke-permission `
  --action lambda:InvokeFunction `
  --principal ROLE_ARN `
  --region us-east-1
```

Or use the script:
```powershell
powershell -ExecutionPolicy Bypass -File aws-migration-scripts/grant-lambda-invoke-permission.ps1
```

**Step 3: Verify Permission**

Go to Lambda Console → `travel-app-database-service` → **Configuration** → **Permissions**

You should see a resource-based policy allowing the Amplify role to invoke.

### Option 2: Attach Lambda Invoke Policy to Amplify Role

1. Go to IAM Console → Roles
2. Find your Amplify service role (name like `amplify-APP-ROLE`)
3. Click **Add permissions** → **Attach policies**
4. Search for: `AWSLambda_FullAccess` (or create a custom policy for just invoke)
5. Attach the policy

### Option 3: Use Custom IAM Policy (More Secure)

Create a custom policy that only allows invoking this specific Lambda:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:us-east-1:ACCOUNT_ID:function:travel-app-database-service"
    }
  ]
}
```

Attach this to the Amplify service role.

## Verify Fix

After granting permission:

1. **Redeploy** the app (or wait a few minutes for IAM propagation)
2. **Test login** again
3. **Check logs** - should see:
   - `[Lambda Client] Invoking travel-app-database-service...`
   - `[Lambda Client] Lambda invocation successful...`
4. **Check Lambda CloudWatch logs** - should see invocations

## Quick Test

You can test if the permission works by running this in Lambda Console test:

```json
{
  "action": "test"
}
```

If that works, the issue is just the Amplify role permission.

## Summary

The error happens because:
1. ✅ Lambda function exists and works
2. ✅ Code is trying to invoke Lambda
3. ❌ Amplify execution role can't invoke Lambda (missing permission)

**Fix**: Grant `lambda:InvokeFunction` permission to Amplify service role for `travel-app-database-service`

