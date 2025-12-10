# Amplify Environment Variables - Final Fix

## Root Cause Identified
Amplify Hosting Gen 2 doesn't create separate Lambda functions for Next.js API routes — it uses a monolithic SSR function. Environment variables must be set correctly in the Amplify console AND the build must properly inline them.

## The Real Problem
Next.js 13+ with App Router requires environment variables to be available at **build time** to be inlined into the server bundle. Simply setting them in Amplify Console might not be enough if the build cache isn't cleared.

## Solution: Delete ALL Env Vars and Re-add Them via Console

### Step 1: Delete All Existing Environment Variables
```powershell
# Clear all environment variables for the dev branch
& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" amplify update-branch `
  --app-id d2p2uq8t9xysui `
  --branch-name dev `
  --environment-variables '{}'
```

### Step 2: Go to Amplify Console and Add Variables Manually
**IMPORTANT:** Use the Console UI, not CLI, for better reliability.

1. Go to: https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/d2p2uq8t9xysui/settings/variables

2. Click "Manage variables"

3. Add these variables **one by one**:

**Backend/Server Variables (no NEXT_PUBLIC prefix):**
```
COGNITO_CLIENT_ID = 3uok7ddaj63n79cgk7rrpncukc
COGNITO_USER_POOL_ID = us-east-1_oF5qfa2IX
DEPLOYMENT_REGION = us-east-1
RDS_HOST = travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com
RDS_PORT = 5432
RDS_USER = postgres
RDS_PASSWORD = ju3vrLHJUW8PqDG4
RDS_DB = postgres
S3_BUCKET_NAME = travel-app-storage-1769
```

**Frontend Variables (NEXT_PUBLIC prefix for browser access):**
```
NEXT_PUBLIC_COGNITO_CLIENT_ID = 3uok7ddaj63n79cgk7rrpncukc
NEXT_PUBLIC_COGNITO_DOMAIN = travel-app-auth-1769.auth.us-east-1.amazoncognito.com
```

**Legacy Supabase Variables (for backward compatibility - replace with your actual values):**
```
NEXT_PUBLIC_SUPABASE_URL = https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY = [YOUR_SUPABASE_SERVICE_ROLE_KEY]
```

4. **CRITICAL:** Select "Apply to all branches" or specifically "dev" branch

5. Click "Save"

### Step 3: Clear Build Cache and Redeploy
After saving environment variables:

1. Go to: https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/d2p2uq8t9xysui/dev

2. Click "Redeploy this version"

3. In the deployment options, look for **"Clear cache"** option and enable it

4. Start deployment

### Step 4: Verify After Deployment
Once deployment completes (5-10 minutes):

1. Visit debug endpoint:
   ```
   https://dev.d2p2uq8t9xysui.amplifyapp.com/api/debug/env
   ```

2. You should see:
   ```json
   {
     "COGNITO_CLIENT_ID": "SET",
     "COGNITO_USER_POOL_ID": "SET",
     "DEPLOYMENT_REGION": "SET",
     ...
   }
   ```

3. Try login page:
   ```
   https://dev.d2p2uq8t9xysui.amplifyapp.com/login
   ```

## Alternative: Add to next.config.js (if console doesn't work)

If the Amplify Console method still doesn't work, we can force Next.js to read env vars by updating `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
    DEPLOYMENT_REGION: process.env.DEPLOYMENT_REGION,
    RDS_HOST: process.env.RDS_HOST,
    RDS_PORT: process.env.RDS_PORT,
    RDS_USER: process.env.RDS_USER,
    RDS_PASSWORD: process.env.RDS_PASSWORD,
    RDS_DB: process.env.RDS_DB,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  },
  // ... rest of config
}
```

This will force Next.js to inline these values at build time.

## Last Resort: AWS Secrets Manager

If NOTHING works, we'll use AWS Secrets Manager and fetch secrets at runtime:

1. Store secrets in Secrets Manager
2. Update API routes to fetch secrets on each request (with caching)
3. This is slower but 100% reliable

## Status
- [ ] Step 1: Clear all env vars via CLI
- [ ] Step 2: Add env vars via Amplify Console UI
- [ ] Step 3: Clear cache and redeploy
- [ ] Step 4: Verify via debug endpoint
- [ ] Step 5: Test login

---

**NEXT ACTION:** Run Step 1 command to clear env vars, then manually add them via Console UI.

