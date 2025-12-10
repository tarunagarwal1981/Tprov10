# Verify IAM Policy is Attached - Critical Check

## The Issue

Even though Lambda has resource-based policies, the **Amplify execution role** itself needs an **IAM policy** attached that grants `lambda:InvokeFunction` permission.

## Critical Verification Steps

### Step 1: Find Your Amplify Execution Role

1. **Amplify Console** → Your App → **General**
2. Find **Service role** ARN (e.g., `arn:aws:iam::815660521604:role/amplify-...`)
3. Copy the **role name** (the part after `/role/`, e.g., `amplify-tprov10-dev-123456`)

### Step 2: Verify IAM Policy is Attached

1. Go to **IAM Console** → **Roles**
2. **Search** for your Amplify role name
3. **Click** on the role
4. Go to **Permissions** tab
5. **Check** if you see a policy with `lambda:InvokeFunction` permission

**What to look for:**
- Policy name like `AWSLambda_FullAccess` OR
- Custom policy with `lambda:InvokeFunction` action
- The policy should allow: `lambda:InvokeFunction` on `travel-app-database-service`

### Step 3: If Policy is Missing - Add It

**Quick Fix - Attach AWSLambda_FullAccess:**

1. IAM Console → **Roles** → Your Amplify role
2. **Add permissions** → **Attach policies**
3. **Search**: `AWSLambda_FullAccess`
4. **Check** the box
5. **Attach policy**

**OR Create Custom Policy (More Secure):**

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
3. **Name**: `AmplifyLambdaInvokePolicy`
4. **Create policy**
5. Go back to **Roles** → Your Amplify role → **Add permissions** → **Attach policies**
6. **Search** for `AmplifyLambdaInvokePolicy`
7. **Attach**

### Step 4: Wait for IAM Propagation

After attaching the policy:
- **Wait 2-3 minutes** for IAM changes to propagate
- IAM changes can take a few minutes to take effect

### Step 5: Test Again

1. **Test login** again
2. **Check logs** - should see:
   - `[Lambda Client] Lambda invocation successful...`
   - No more credentials errors

## Why This Is Critical

- **Resource-based policy on Lambda**: Says "This role CAN invoke me" ✅ (Already done)
- **IAM policy on Amplify role**: Says "This role HAS PERMISSION to invoke Lambda" ❌ (Might be missing)

**Both are required!** The resource-based policy allows it, but the IAM policy grants the actual permission.

## Quick Check Command

You can verify the role has the policy using AWS CLI:

```powershell
# Replace ROLE_NAME with your Amplify role name
$roleName = "amplify-tprov10-dev-123456"

# List attached policies
aws iam list-attached-role-policies --role-name $roleName --region us-east-1

# List inline policies
aws iam list-role-policies --role-name $roleName --region us-east-1
```

Look for policies that contain `lambda:InvokeFunction` permission.

## Summary

The credentials error happens because:
1. ✅ Lambda has resource-based policies (allows invocation)
2. ❌ Amplify role might not have IAM policy (grants permission)

**Fix**: Attach IAM policy with `lambda:InvokeFunction` to the Amplify execution role.

