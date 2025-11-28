# Debug Lambda Invocation Issue

## Problem
The API route `/api/user/profile` is returning 500, and there are no CloudWatch logs from the Lambda, suggesting the Lambda isn't being invoked.

## Possible Causes

1. **Environment Variable Not Set**: `DATABASE_LAMBDA_NAME` might not be set in Amplify
2. **Lambda Invoke Permission Missing**: Amplify service role can't invoke the Lambda
3. **Code Error Before Lambda Invocation**: Error happening before Lambda is called

## Debug Steps

### 1. Check Amplify Logs

Go to Amplify Console → Your App → **Monitoring** → **Logs**

Look for:
- `[SERVER] Fetching user profile for: ...`
- `[SERVER] DATABASE_LAMBDA_NAME: ...`
- `[SERVER] Importing Lambda database client...`
- Any error messages

### 2. Check Environment Variable

In Amplify Console → **Environment variables**, verify:
- `DATABASE_LAMBDA_NAME` = `travel-app-database-service`

### 3. Check Lambda Permissions

Go to Lambda Console → `travel-app-database-service` → **Configuration** → **Permissions**

Check if there's a resource-based policy allowing Amplify to invoke.

### 4. Test Lambda Directly

In Lambda Console → **Test** tab:
```json
{
  "action": "queryOne",
  "query": "SELECT * FROM users WHERE email = $1 LIMIT 1",
  "params": ["agent@gmail.com"]
}
```

Should return the user profile.

### 5. Check CloudWatch Logs

If Lambda is being invoked, check:
- CloudWatch → Log groups → `/aws/lambda/travel-app-database-service`
- Look for recent invocations

## Quick Fixes

### Fix 1: Add Environment Variable

1. Amplify Console → Environment variables
2. Add: `DATABASE_LAMBDA_NAME` = `travel-app-database-service`
3. Save and redeploy

### Fix 2: Grant Lambda Permission

Run the script:
```powershell
powershell -ExecutionPolicy Bypass -File aws-migration-scripts/grant-lambda-invoke-permission.ps1
```

Or manually:
1. Lambda Console → Permissions
2. Add resource-based policy
3. Principal: Amplify service role ARN
4. Action: `lambda:InvokeFunction`

### Fix 3: Check Code

The updated code now:
- Always tries to use Lambda if server-side
- Logs more details
- Provides better error messages

Make sure the latest code is deployed.

## Expected Log Flow

When working correctly, you should see in Amplify logs:

```
[SERVER] Fetching user profile for: agent@gmail.com
[SERVER] DATABASE_LAMBDA_NAME: travel-app-database-service
[SERVER] Importing Lambda database client...
[Lambda Client] Invoking travel-app-database-service with action: queryOne
[Lambda Client] Lambda invocation successful for action: queryOne
[SERVER] Profile fetched successfully: agent@gmail.com
```

And in Lambda CloudWatch logs:

```
[Database] Event: {"action":"queryOne","query":"SELECT * FROM users WHERE id = $1 OR email = $2 LIMIT 1","params":["","agent@gmail.com"]}
[Database] Connection pool initialized
```

## Next Steps

1. Check Amplify logs for the detailed error
2. Verify environment variable is set
3. Grant Lambda invoke permission
4. Redeploy and test again

