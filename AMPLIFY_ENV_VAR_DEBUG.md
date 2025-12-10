# Amplify Environment Variables Debug Guide 🔍

## ⚠️ Problem

Environment variables are set in Amplify Console but still not being read by the application.

---

## 🔍 Step 1: Check Debug Endpoint

I've created a debug endpoint to see what environment variables are actually available at runtime.

**Visit this URL in your browser:**
```
https://dev.d2p2uq8t9xysui.amplifyapp.com/api/debug/env
```

**What to look for:**
- `COGNITO_CLIENT_ID`: Should show "SET" and first 5 characters
- `COGNITO_USER_POOL_ID`: Should show "SET" and first 10 characters
- `allCognitoVars`: Should list all COGNITO-related env vars

**If they show "MISSING":**
- The variables are not being passed to the Lambda functions
- Continue to Step 2

---

## 🔧 Step 2: Verify Variable Names

**Common Issues:**

1. **Variable name mismatch:**
   - Must be exactly: `COGNITO_CLIENT_ID` (not `COGNITO_CLIENT_ID_DEV` or similar)
   - Must be exactly: `COGNITO_USER_POOL_ID` (not `COGNITO_USER_POOL` or similar)

2. **Case sensitivity:**
   - All uppercase: `COGNITO_CLIENT_ID`
   - Not: `cognito_client_id` or `Cognito_Client_Id`

3. **Spaces or special characters:**
   - No spaces before/after the variable name
   - No quotes around the value (Amplify adds them automatically if needed)

---

## 🔧 Step 3: Check Build Settings

1. **Go to Amplify Console**
   - App settings → Build settings

2. **Check buildspec.yml or build command:**
   - Make sure build command is: `npm run build`
   - Make sure there's no custom script that might filter env vars

3. **Check if variables are in build logs:**
   - Go to Build history → Latest build → View logs
   - Search for "COGNITO_CLIENT_ID" or "Environment variables"
   - Should see the variables listed at the start of the build

---

## 🔧 Step 4: Try Branch-Specific Variables

Instead of "All branches", try setting variables specifically for the `dev` branch:

1. **Amplify Console → Environment variables**
2. **Click "Manage variables"**
3. **For each variable:**
   - Click the variable
   - Under "Branches", select "dev" specifically
   - Save

---

## 🔧 Step 5: Check Amplify Build Image

Sometimes the build image version matters:

1. **Amplify Console → App settings → Build settings**
2. **Check "Build image settings"**
3. **Try updating to latest build image** (if available)

---

## 🔧 Step 6: Verify in CloudWatch Logs

Check what the Lambda function actually sees:

1. **Go to CloudWatch Console**
   - https://console.aws.amazon.com/cloudwatch/
   - Log groups → `/aws/amplify/your-app-name/dev`

2. **Look for recent log entries from `/api/auth/login`**
   - Should see: `🔍 Environment check:` with env var status
   - This shows what the Lambda actually sees

---

## 🔧 Step 7: Alternative - Use AWS Systems Manager Parameter Store

If environment variables still don't work, you can use AWS Systems Manager Parameter Store:

1. **Store variables in Parameter Store:**
   ```bash
   aws ssm put-parameter --name "/amplify/tprov10/COGNITO_CLIENT_ID" --value "20t43em6vuke645ka10s4slgl9" --type "String"
   aws ssm put-parameter --name "/amplify/tprov10/COGNITO_USER_POOL_ID" --value "us-east-1_oF5qfa2IX" --type "String"
   ```

2. **Update code to read from Parameter Store:**
   - This is more complex but more reliable

---

## ✅ Quick Test

After making changes:

1. **Redeploy the branch**
2. **Visit:** `https://dev.d2p2uq8t9xysui.amplifyapp.com/api/debug/env`
3. **Check if variables show "SET"**
4. **Try login again**

---

## 🚨 Most Likely Issue

Based on the error, the most likely issue is:

**The environment variables are set for "All branches" but Amplify might not be passing them correctly to the Lambda functions.**

**Try this:**
1. Delete the variables
2. Re-add them one by one
3. Make sure they're set for "All branches" (or specifically "dev")
4. Save
5. Redeploy

---

**The debug endpoint will show exactly what's available at runtime!** 🔍

