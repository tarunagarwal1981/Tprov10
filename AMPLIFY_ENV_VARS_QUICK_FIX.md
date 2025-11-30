# Amplify Environment Variables - QUICK FIX 🚨

## ❌ Current Error
```
1 validation error detected: Value null at 'clientId' failed to satisfy constraint: Member must not be null
```

**This means `COGNITO_CLIENT_ID` is NOT set in Amplify!**

---

## ✅ IMMEDIATE FIX

### **Step 1: Go to Amplify Console**
1. Open [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click on your app
3. Click **App settings** → **Environment variables**

### **Step 2: Add These Variables NOW**

**Copy and paste these EXACTLY (replace placeholders with your actual values):**

```bash
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=[YOUR_COGNITO_CLIENT_ID]
NEXT_PUBLIC_COGNITO_CLIENT_ID=[YOUR_COGNITO_CLIENT_ID]
NEXT_PUBLIC_COGNITO_DOMAIN=[YOUR_COGNITO_DOMAIN].auth.us-east-1.amazoncognito.com
DEPLOYMENT_REGION=us-east-1
RDS_HOST=[YOUR_RDS_ENDPOINT].us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DB=postgres
RDS_USER=postgres
RDS_PASSWORD=[YOUR_RDS_PASSWORD]
S3_BUCKET_NAME=[YOUR_S3_BUCKET_NAME]
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
```

### **Step 3: Find Your User Pool ID**

If you don't know your User Pool ID:

1. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito)
2. Click **User pools** in the left sidebar
3. Click on your user pool (e.g., `travel-app-user-pool`)
4. Copy the **User Pool ID** (looks like: `us-east-1_AbCdEfGhI`)

### **Step 4: Save and Redeploy**

1. Click **Save** in Amplify Console
2. Amplify will automatically trigger a new deployment
3. **Wait 5-10 minutes** for deployment to complete
4. Try logging in again

---

## 🔍 Verify Variables Are Set

After saving, you should see all variables listed in the Environment variables page.

**Critical variables that MUST be set:**
- ✅ `COGNITO_USER_POOL_ID` 
- ✅ `COGNITO_CLIENT_ID`
- ✅ `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- ✅ `NEXT_PUBLIC_COGNITO_DOMAIN`

---

## ⚠️ Common Mistakes

1. **Typo in variable name** - Must be EXACT: `COGNITO_CLIENT_ID` (not `COGNITO_CLIENTID`)
2. **Missing quotes** - Don't add quotes around values
3. **Wrong branch** - Make sure you're setting variables for the correct branch (usually `main` or `dev`)
4. **Not waiting for deployment** - Changes take 5-10 minutes to deploy

---

## 🚀 After Deployment

Once deployment completes:
1. ✅ Login should work
2. ✅ No more "clientId is null" error
3. ✅ Authentication should function correctly

---

**DO THIS NOW:** Add the environment variables in Amplify! 🚀
