# Amplify Login 500 Error Fix 🔧

## ⚠️ Problem

**Error:** `POST /api/auth/login 500 (Internal Server Error)`
**Response:** HTML instead of JSON (`Unexpected token '<', "<!DOCTYPE "...`)

**Cause:** Server-side error in the login API route, likely missing environment variables.

---

## ✅ Solution Applied

I've improved error handling in the login route to:
1. ✅ Always return JSON (never HTML)
2. ✅ Better error logging
3. ✅ Proper Content-Type headers
4. ✅ More detailed error messages

---

## 🔍 Most Likely Cause: Missing Environment Variables

The 500 error is most likely because **Cognito environment variables are not set in Amplify**.

### **Check Amplify Environment Variables:**

1. **Go to Amplify Console**
   - https://console.aws.amazon.com/amplify/
   - Click on your app
   - Click **App settings** → **Environment variables**

2. **Verify These Are Set for `dev` Branch:**

```bash
✅ COGNITO_USER_POOL_ID=us-east-1_oF5qfa2IX
✅ COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9
✅ DEPLOYMENT_REGION=us-east-1
```

3. **If Missing, Add Them:**
   - Click **Manage variables**
   - Make sure you're viewing **`dev` branch** variables
   - Add each missing variable
   - Click **Save**

4. **Redeploy:**
   - Amplify will automatically trigger a new deployment
   - Wait 5-10 minutes
   - Try logging in again

---

## 🔧 Alternative: Check CloudWatch Logs

If environment variables are set, check CloudWatch logs:

1. **Go to CloudWatch Console**
   - https://console.aws.amazon.com/cloudwatch/
   - Click **Log groups**
   - Find `/aws/amplify/your-app-name/dev`

2. **Look for Error Messages:**
   - Search for "Cognito not configured"
   - Search for "Login error"
   - Check the exact error message

---

## 📋 Quick Checklist

- [ ] `COGNITO_USER_POOL_ID` is set in Amplify
- [ ] `COGNITO_CLIENT_ID` is set in Amplify
- [ ] `DEPLOYMENT_REGION` is set in Amplify
- [ ] Variables are set for the **`dev` branch** (not just app-level)
- [ ] Latest code is deployed to Amplify
- [ ] Checked CloudWatch logs for specific error

---

## 🚀 After Fixing

Once environment variables are set and redeployed:

1. **Try logging in again**
2. **Check browser console** for any errors
3. **Check Network tab** - the `/api/auth/login` response should be JSON, not HTML

---

**The improved error handling will now always return JSON with helpful error messages!** ✅

