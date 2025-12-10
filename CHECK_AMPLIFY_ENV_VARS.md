# Check Amplify Environment Variables 🔍

## ⚠️ IMPORTANT: Verify Environment Variables Are Actually Set

The 500 error suggests the environment variables might not be set correctly in Amplify.

---

## ✅ Step 1: Verify in Amplify Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click on your app
3. Click **App settings** → **Environment variables**
4. **IMPORTANT:** Check which branch the variables are set for!

### **Check Branch-Specific Variables:**

Amplify has two types of environment variables:
- **App-level** (applies to all branches)
- **Branch-specific** (only for that branch)

**Make sure the variables are set for the `dev` branch!**

---

## 📋 Step 2: Verify These Variables Are Set

Check that ALL of these are set for the `dev` branch:

```bash
✅ COGNITO_USER_POOL_ID=us-east-1_oF5qfa2IX
✅ COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9
✅ DEPLOYMENT_REGION=us-east-1
✅ NEXT_PUBLIC_COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9
✅ NEXT_PUBLIC_COGNITO_DOMAIN=travel-app-auth-2285.auth.us-east-1.amazoncognito.com
✅ RDS_HOST=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com
✅ RDS_PORT=5432
✅ RDS_DB=postgres
✅ RDS_USER=postgres
✅ RDS_PASSWORD=ju3vrLHJUW8PqDG4
✅ S3_BUCKET_NAME=travel-app-storage-1769
```

---

## 🔧 Step 3: If Variables Are Missing

### **Option A: Add Branch-Specific Variables**

1. In Amplify Console → Environment variables
2. Click **Manage variables**
3. Make sure you're viewing variables for the **`dev` branch**
4. Click **Add variable** for each missing one
5. Click **Save**

### **Option B: Add App-Level Variables**

1. In Amplify Console → Environment variables
2. Click **Manage variables**
3. Switch to **App-level** (if not already)
4. Add variables
5. Click **Save**

**Note:** App-level variables apply to all branches, which is usually what you want.

---

## 🧪 Step 4: Test Locally First

Before debugging Amplify, test locally to see if it works:

1. **Create `.env.local`** (copy from `env.local.template`)
2. **Add your User Pool ID:** `COGNITO_USER_POOL_ID=us-east-1_oF5qfa2IX`
3. **Start dev server:** `npm run dev`
4. **Test login:** `http://localhost:3000/login`

If it works locally but not in Amplify, the issue is definitely the environment variables in Amplify.

---

## 🔍 Step 5: Check Amplify Build Logs

After adding variables and redeploying:

1. Go to Amplify Console → Your app → Latest deployment
2. Click **Build logs**
3. Look for:
   - Environment variable loading messages
   - Any errors about missing variables
   - Cognito-related errors

---

## 🚨 Common Issues

### **Issue 1: Variables Set for Wrong Branch**

**Symptom:** Variables are set for `main` but you're deploying `dev`

**Fix:** Set variables for the `dev` branch specifically, or set them at app-level

### **Issue 2: Variables Not Saved**

**Symptom:** You added variables but they don't appear in the list

**Fix:** Make sure you clicked **Save** after adding variables

### **Issue 3: Typo in Variable Name**

**Symptom:** Variable exists but code can't find it

**Fix:** Check for typos:
- `COGNITO_CLIENT_ID` (not `COGNITO_CLIENTID`)
- `COGNITO_USER_POOL_ID` (not `COGNITO_USERPOOL_ID`)

### **Issue 4: Deployment Didn't Pick Up Changes**

**Symptom:** Variables are set but still getting errors

**Fix:** 
1. Trigger a new deployment (push a commit or click "Redeploy this version")
2. Wait for deployment to complete (5-10 minutes)

---

## ✅ Quick Verification

After setting variables, you can verify they're loaded by checking the build logs for:
```
Environment variables loaded: COGNITO_CLIENT_ID, COGNITO_USER_POOL_ID, ...
```

Or check the API response - the enhanced error logging will show which variables are missing.

---

**Most likely issue:** The environment variables are set for the wrong branch, or they weren't saved properly. Double-check in Amplify Console! 🔍

