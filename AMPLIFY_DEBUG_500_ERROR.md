# Debugging 500 Error in Amplify 🔍

## Problem
The API route `/api/auth/login` is returning a 500 error with HTML instead of JSON.

**Error:** `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

This means the API route is crashing and Next.js is returning an error page (HTML) instead of our JSON error response.

---

## 🔍 Step 1: Check Amplify Build Logs

The actual error should be in the Amplify build/deployment logs:

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click on your app
3. Click on the latest deployment
4. Check the **Build logs** tab
5. Look for error messages around the time of the login attempt

**Look for:**
- `COGNITO_CLIENT_ID` errors
- `COGNITO_USER_POOL_ID` errors
- AWS SDK errors
- Any stack traces

---

## 🧪 Step 2: Test Locally First

Before debugging Amplify, test locally to see the actual error:

### **1. Create `.env.local` file:**

Copy from `env.local.template`:
```bash
# Windows PowerShell
Copy-Item env.local.template .env.local

# Then edit .env.local and add your User Pool ID
```

Make sure `.env.local` has:
```bash
COGNITO_USER_POOL_ID=us-east-1_oF5qfa2IX
COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9
DEPLOYMENT_REGION=us-east-1
# ... other vars
```

### **2. Start dev server:**
```bash
npm run dev
```

### **3. Test the API route:**

**Option A: Use the test script**
```bash
# Edit test-login-api.js and add your password
node test-login-api.js
```

**Option B: Use browser console**
1. Open `http://localhost:3000/login`
2. Open browser DevTools → Console
3. Try to login
4. Check the terminal (where `npm run dev` is running) for the actual error

**Option C: Use curl/PowerShell**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"agent@gmail.com","password":"your-password"}'
```

### **4. Check terminal output:**

The terminal where `npm run dev` is running will show the actual error:
```
Login error: [ACTUAL ERROR HERE]
```

---

## 🐛 Common Causes of 500 Error

### **Cause 1: Missing Environment Variables**

**Check:**
- Are `COGNITO_CLIENT_ID` and `COGNITO_USER_POOL_ID` set in Amplify?
- Are they set for the correct branch (dev/main)?

**Fix:**
1. Go to Amplify Console → App settings → Environment variables
2. Verify both variables are set
3. Make sure they're for the `dev` branch (or whatever branch you're deploying)

### **Cause 2: Wrong User Pool ID**

**Check:**
- Is the User Pool ID correct?
- Does it match the one in your Cognito Console?

**Fix:**
1. Go to AWS Cognito Console
2. Verify the User Pool ID
3. Update in Amplify environment variables

### **Cause 3: AWS SDK Configuration Issue**

**Check:**
- Is `DEPLOYMENT_REGION` set?
- Is the region correct?

**Fix:**
- Make sure `DEPLOYMENT_REGION=us-east-1` is set in Amplify

### **Cause 4: User Doesn't Exist in Cognito**

**Check:**
- Does the user `agent@gmail.com` exist in your Cognito User Pool?
- Is the password correct?

**Fix:**
1. Go to AWS Cognito Console → User pools → Your pool → Users
2. Verify the user exists
3. Check if password is correct

---

## 🔧 Quick Fix: Add More Logging

Let's add better error logging to see what's happening:

The code already has error logging, but we can check Amplify CloudWatch logs:

1. Go to [AWS CloudWatch Console](https://console.aws.amazon.com/cloudwatch)
2. Click **Log groups** → Search for "amplify"
3. Find your app's log group
4. Check recent log streams for errors

---

## ✅ Verification Steps

1. **Test locally first:**
   - Set up `.env.local`
   - Run `npm run dev`
   - Test login
   - See actual error in terminal

2. **Check Amplify environment variables:**
   - Verify all required vars are set
   - Check they're for the correct branch

3. **Check Amplify build logs:**
   - Look for errors during build
   - Check runtime errors

4. **Check CloudWatch logs:**
   - Look for API route errors
   - Check for Cognito errors

---

## 🚀 Next Steps

1. **Test locally** - This will show you the exact error
2. **Fix the error** - Based on what you see locally
3. **Commit and push** - Deploy the fix
4. **Test in Amplify** - Should work after fix

---

**Most likely issue:** The environment variables aren't actually set in Amplify, or they're set for the wrong branch. Check Amplify Console → Environment variables → Make sure they're for the `dev` branch!

