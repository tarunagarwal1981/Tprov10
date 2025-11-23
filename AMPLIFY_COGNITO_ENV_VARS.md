# Amplify Cognito Environment Variables 🔧

## Problem
Login is failing with:
```
InvalidParameterException: 1 validation error detected: Value null at 'clientId' failed to satisfy constraint: Member must not be null
```

**Root Cause:** Cognito environment variables are not set in Amplify.

---

## ✅ Solution: Add Environment Variables to Amplify

### **Step 1: Go to Amplify Console**

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click on your app
3. Go to **App settings** → **Environment variables**

### **Step 2: Add Cognito Environment Variables**

Add these **required** environment variables:

```bash
# Cognito Configuration (REQUIRED)
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9

# Client-side Cognito (for OAuth)
NEXT_PUBLIC_COGNITO_DOMAIN=travel-app-auth-2285.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9

# AWS Region (Note: Cannot use AWS_REGION - Amplify restriction)
DEPLOYMENT_REGION=us-east-1

# Database Configuration
RDS_HOST=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DB=postgres
RDS_USER=postgres
RDS_PASSWORD=ju3vrLHJUW8PqDG4

# S3 Configuration
S3_BUCKET_NAME=travel-app-storage-1769

# Temporary Supabase (for migration)
NEXT_PUBLIC_SUPABASE_URL=https://megmjzszmqnmzdxwzigt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### **Step 3: Get Your Cognito User Pool ID**

If you don't know your User Pool ID:

1. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito)
2. Click on your User Pool (e.g., `travel-app-user-pool`)
3. Copy the **User Pool ID** (format: `us-east-1_XXXXXXXXX`)

### **Step 4: Save and Redeploy**

1. Click **Save** in Amplify Console
2. Amplify will automatically trigger a new deployment
3. Wait for deployment to complete (5-10 minutes)

---

## 🔍 Verify Environment Variables

After deployment, check the build logs to ensure:
- ✅ No errors about missing environment variables
- ✅ Build completes successfully
- ✅ Login works without "clientId is null" error

---

## 📝 Notes

- **Server-side variables** (`COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`) are used by API routes
- **Client-side variables** (`NEXT_PUBLIC_COGNITO_*`) are used by OAuth redirects
- Both are required for full authentication functionality

---

## 🚀 After Adding Variables

Once the environment variables are set:
1. ✅ Login should work
2. ✅ Registration should work
3. ✅ OAuth (Google) should work
4. ✅ All authentication flows should function correctly

---

**Quick Action:** Add the environment variables in Amplify now! 🚀

