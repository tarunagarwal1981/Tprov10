# Next.js Config Environment Variables Fix

## Problem
Environment variables were set in Amplify but not available at runtime in Next.js API routes. This is because Next.js needs environment variables to be explicitly exposed in `next.config.ts` to be available in the server-side code.

## Solution
Updated `next.config.ts` to explicitly expose all environment variables using the `env` configuration option. This ensures they're available at both build time and runtime.

## Changes Made
- Added `env` section to `next.config.ts` with all required variables:
  - `COGNITO_CLIENT_ID`
  - `COGNITO_USER_POOL_ID`
  - `DEPLOYMENT_REGION`
  - `RDS_HOST`, `RDS_PORT`, `RDS_USER`, `RDS_PASSWORD`, `RDS_DB`
  - `S3_BUCKET_NAME`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - All `NEXT_PUBLIC_*` variables

## Next Steps

1. **Commit and push this change:**
   ```bash
   git add next.config.ts
   git commit -m "Fix: Explicitly expose environment variables in next.config.ts for Amplify"
   git push origin dev
   ```

2. **Wait for Amplify to redeploy** (5-10 minutes)

3. **Test the debug endpoint:**
   ```
   https://dev.d2p2uq8t9xysui.amplifyapp.com/api/debug/env
   ```

4. **Expected result:**
   ```json
   {
     "COGNITO_CLIENT_ID": "SET",
     "COGNITO_USER_POOL_ID": "SET",
     ...
   }
   ```

## How It Works

The `env` option in `next.config.ts` tells Next.js to:
1. Read the environment variables from `process.env` at build time
2. Inline them into the server bundle
3. Make them available at runtime in API routes and server components

This works even if Amplify doesn't properly inject them during the build process, because Next.js will read them from the environment during the build step.

## Fallback Plan

If this still doesn't work (variables are still undefined), we'll need to:
1. Use AWS Systems Manager Parameter Store to fetch secrets at runtime
2. Or use AWS Secrets Manager
3. Implement caching to avoid fetching on every request

But this `next.config.ts` approach should work since Amplify does set the environment variables - they just weren't being picked up by Next.js.

---

**Status**: ✅ `next.config.ts` updated. Ready to commit and deploy.

