# Assign Compute Role to Amplify - Step by Step

## The Issue

❌ **Compute Role**: Not assigned to Amplify app
- This is what actually executes your API routes
- Without it, API routes have NO credentials
- This is why you're getting `CredentialsProviderError`

## Solution: Assign Compute Role

### Step 1: Go to Amplify Console

1. Go to: https://console.aws.amazon.com/amplify/home?region=us-east-1#/d2p2uq8t9xysui
2. Click on your app: **Tprov10**

### Step 2: Navigate to App Settings

1. Click **App settings** (left sidebar)
2. Click **General** (under App settings)

### Step 3: Find Compute Role Section

Look for one of these sections:
- **"Compute role"**
- **"Execution role"** 
- **"Service role"** (might be the same)

### Step 4: Assign the Role

**Option A: Use Existing Role**

If you see a dropdown or field for compute role:
1. Click **Edit** or the role field
2. Select or enter: `AmplifySSRLoggingRole-5b109d56-99a3-45c4-a40e-a24f4ca1094c`
   - Or use the full ARN: `arn:aws:iam::815660521604:role/service-role/AmplifySSRLoggingRole-5b109d56-99a3-45c4-a40e-a24f4ca1094c`
3. **Save**

**Option B: Create New Dedicated Compute Role (Recommended)**

If you want a cleaner setup:

1. **IAM Console** → **Roles** → **Create role**
2. **Trusted entity**: **AWS service** → **Lambda**
3. **Attach policies**: `AWSLambda_FullAccess`
4. **Role name**: `amplify-tprov10-compute-role`
5. **Create role**
6. **Go back to Amplify** → **App settings** → **General**
7. **Assign this new role** as compute role

### Step 5: Save and Wait

1. **Save** the changes in Amplify
2. **Wait 2-3 minutes** for Amplify to restart
3. Amplify will redeploy with the new compute role

### Step 6: Test

1. **Test login** again
2. **Check logs** - should see:
   - `[Lambda Client] Lambda invocation successful...`
   - No more credentials errors!

## Why This Fixes It

- **Before**: No compute role → API routes have no AWS credentials → `CredentialsProviderError`
- **After**: Compute role assigned → API routes use role credentials → Can invoke Lambda ✅

## Verification

After assigning, the API routes will:
1. Use the compute role's credentials automatically
2. Have permission to invoke Lambda (via `AWSLambda_FullAccess` policy)
3. Successfully call the database Lambda

## Summary

**The compute role is what executes your API routes and provides AWS credentials. Assign it and the credentials error will be fixed!**

