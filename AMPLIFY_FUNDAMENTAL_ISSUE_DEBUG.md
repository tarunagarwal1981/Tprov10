# Amplify Environment Variables - Fundamental Issue Debug

## Problem
Environment variables are not being injected into the deployed Next.js API routes (which run as Lambda functions) even after:
1. Setting in Amplify Console for "All branches"
2. Deleting and redeploying the branch
3. Setting via AWS CLI

## Root Cause Analysis

### Possible Issues

1. **Next.js Environment Variable Prefix**
   - Next.js only exposes `NEXT_PUBLIC_*` variables to the browser
   - Server-side variables (like `COGNITO_CLIENT_ID`) should NOT have `NEXT_PUBLIC_` prefix
   - But they need to be available at build time AND runtime

2. **Amplify Build vs Runtime**
   - Amplify sets env vars during BUILD time
   - But Next.js API routes need them at RUNTIME (in Lambda)
   - There might be a mismatch

3. **Amplify Backend Environment**
   - Amplify has separate "Frontend" and "Backend" environments
   - Backend env vars might need to be set separately

4. **Build Cache**
   - Amplify might be using a cached build
   - Environment variables might not be refreshed

## Diagnostic Steps

### Step 1: Check Amplify Build Logs
Go to: https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/d2p2uq8t9xysui

1. Click on the `dev` branch
2. Look at the latest build
3. Check the "Build" phase logs for:
   ```
   # Environment variables:
   2024-XX-XX XX:XX:XX [INFO]: # Environment variables:
   2024-XX-XX XX:XX:XX [INFO]: COGNITO_CLIENT_ID=***
   ```

### Step 2: Check Lambda Environment Variables
After deployment, the API routes run as Lambda functions. We need to check if the Lambda has the env vars:

```powershell
# List all Lambda functions created by Amplify
aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'amplify-')].FunctionName" --output table

# Get environment variables for a specific function
aws lambda get-function-configuration --function-name <function-name> --query "Environment.Variables"
```

### Step 3: Clear All Caches
In Amplify Console:
1. Go to App settings → Build settings
2. Scroll to "Build image settings"
3. Click "Clear cache and deploy"

## Workaround Solutions

### Solution 1: Use AWS Systems Manager Parameter Store
Instead of Amplify environment variables, use AWS SSM Parameter Store:

1. Store secrets in Parameter Store:
```powershell
aws ssm put-parameter --name "/travel-app/dev/COGNITO_CLIENT_ID" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/travel-app/dev/COGNITO_USER_POOL_ID" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/travel-app/dev/RDS_PASSWORD" --value "YOUR_VALUE" --type "SecureString"
```

2. Update code to read from SSM:
```typescript
// src/lib/aws/ssm.ts
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const client = new SSMClient({ region: process.env.DEPLOYMENT_REGION || 'us-east-1' });

export async function getParameter(name: string): Promise<string> {
  const command = new GetParameterCommand({
    Name: `/travel-app/${process.env.ENV || 'dev'}/${name}`,
    WithDecryption: true
  });
  const response = await client.send(command);
  return response.Parameter?.Value || '';
}
```

3. Update API routes to use SSM

### Solution 2: Use .env.production file in repo
This is NOT recommended for secrets, but can work for debugging:

1. Create `.env.production` in repo root (add to .gitignore if it has secrets)
2. Amplify will automatically use it during build

### Solution 3: Hardcode temporarily for debugging
To isolate if it's an env var issue or a code issue:

1. Temporarily hardcode values in `src/lib/aws/cognito.ts`
2. Deploy
3. If it works, we know it's an env var injection issue
4. If it doesn't work, it's a code/logic issue

## Next Steps

**What to do RIGHT NOW:**

1. Check the latest build logs for environment variables
2. Run the Lambda list command to see if Lambda functions have the env vars
3. Try "Clear cache and deploy"

**If none of that works:**
- We'll switch to SSM Parameter Store (more reliable for Lambda functions)
- Or temporarily hardcode for debugging

## Status
- [ ] Checked build logs
- [ ] Checked Lambda env vars
- [ ] Cleared cache and redeployed
- [ ] Verified debug endpoint after cache clear

