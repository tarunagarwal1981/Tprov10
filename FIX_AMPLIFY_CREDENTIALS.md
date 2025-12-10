# Fix Amplify Credentials - Final Solution

## Current Status

✅ **Lambda Permissions**: Already configured (2 resource-based policies exist)
- `LambdaAmplify` with principal `amplify.amazonaws.com`
- `Amplify_service_role` with IAM role ARN

❌ **Still Getting**: `CredentialsProviderError: Could not load credentials from any providers`

## Root Cause

The resource-based policies on the Lambda allow invocation, BUT the **Amplify execution role** itself needs an **IAM policy** that grants `lambda:InvokeFunction` permission.

Resource-based policies on Lambda = "Who can call me"
IAM policies on role = "What can this role do"

## Solution: Add IAM Policy to Amplify Execution Role

### Step 1: Find Amplify Execution Role

1. Go to **Amplify Console** → Your App → **General**
2. Find **Service role** (shows the role ARN)
3. Copy the role name (e.g., `amplify-tprov10-dev-123456`)

### Step 2: Add Lambda Invoke Policy to Role

**Option A: Via IAM Console (Easier)**

1. Go to **IAM Console** → **Roles**
2. Search for your Amplify role name
3. Click on the role
4. **Add permissions** → **Attach policies**
5. Search for: `AWSLambda_FullAccess` (or create custom policy)
6. **Attach policy**

**Option B: Create Custom Policy (More Secure)**

1. IAM Console → **Policies** → **Create policy**
2. **JSON** tab, paste:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:us-east-1:815660521604:function:travel-app-database-service"
    }
  ]
}
```
3. Name: `AmplifyLambdaInvokePolicy`
4. **Create policy**
5. Go back to **Roles** → Your Amplify role → **Add permissions** → **Attach policies**
6. Find and attach `AmplifyLambdaInvokePolicy`

**Option C: Via AWS CLI**

```powershell
# Get Amplify role name
$roleName = "amplify-tprov10-dev-123456"  # Replace with your role name

# Create custom policy
$policyDoc = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Action = "lambda:InvokeFunction"
            Resource = "arn:aws:lambda:us-east-1:815660521604:function:travel-app-database-service"
        }
    )
} | ConvertTo-Json -Depth 10

$policyDoc | Out-File -FilePath "lambda-invoke-policy.json" -Encoding utf8

# Create policy
aws iam create-policy `
  --policy-name AmplifyLambdaInvokePolicy `
  --policy-document file://lambda-invoke-policy.json `
  --region us-east-1

# Get policy ARN (from output)
$policyArn = "arn:aws:iam::815660521604:policy/AmplifyLambdaInvokePolicy"

# Attach to role
aws iam attach-role-policy `
  --role-name $roleName `
  --policy-arn $policyArn `
  --region us-east-1
```

### Step 3: Wait and Test

1. **Wait 1-2 minutes** for IAM propagation
2. **Test login** again
3. **Check logs** - should see:
   - `[Lambda Client] Lambda invocation successful...`
   - No more credentials errors

## Why This Is Needed

- **Resource-based policy on Lambda**: Allows the Lambda to be invoked by the Amplify service
- **IAM policy on Amplify role**: Allows the Amplify execution role to actually invoke the Lambda

Both are required! The resource-based policy is already there (from your screenshot), but the IAM policy on the role is missing.

## Verification

After adding the IAM policy, check:

1. **IAM Console** → **Roles** → Your Amplify role → **Permissions**
2. Should see a policy with `lambda:InvokeFunction` permission
3. Test login - should work!

## Summary

✅ Lambda has resource-based policies (already done)
⏳ Amplify execution role needs IAM policy with `lambda:InvokeFunction`
⏳ Add the policy and test again

