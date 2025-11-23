# Local Testing with Cognito Auth 🧪

## ✅ Yes, Cognito Auth Works Locally!

You can test Cognito authentication locally without deploying. Here's how:

---

## 📋 Step 1: Set Up `.env.local`

Create or update `.env.local` in your project root with these variables:

```bash
# Cognito Configuration (REQUIRED for local testing)
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9
DEPLOYMENT_REGION=us-east-1

# Client-side Cognito (for OAuth)
NEXT_PUBLIC_COGNITO_DOMAIN=travel-app-auth-2285.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9

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

### **Get Your User Pool ID:**

1. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito)
2. Click **User pools** → Your user pool
3. Copy the **User Pool ID** (format: `us-east-1_AbCdEfGhI`)

---

## 🚀 Step 2: Start Local Dev Server

```bash
# Make sure .env.local is set up first!
npm run dev
```

The server will start at `http://localhost:3000`

---

## 🧪 Step 3: Test Login Locally

1. **Open browser:** `http://localhost:3000/login`
2. **Login with test credentials:**
   - Email: `agent@gmail.com` (or any user in your Cognito User Pool)
   - Password: (the password you set for this user)

3. **Check browser console** for:
   ```
   🔐 Starting login process for: agent@gmail.com
   ✅ Login successful, redirecting to: /agent
   ```

4. **Check terminal** (where `npm run dev` is running) for:
   ```
   Login error: (if any errors occur)
   ```

---

## 🔍 Step 4: Test API Routes Directly

You can test the login API route directly:

### **Using curl:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@gmail.com","password":"your-password"}'
```

### **Using PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"agent@gmail.com","password":"your-password"}'
```

### **Expected Success Response:**
```json
{
  "accessToken": "eyJraWQiOiJ...",
  "idToken": "eyJraWQiOiJ...",
  "refreshToken": "eyJjdHkiOiJ...",
  "expiresIn": 3600
}
```

### **Expected Error Response:**
```json
{
  "error": "NotAuthorizedException",
  "message": "Incorrect username or password.",
  "details": "NotAuthorizedException: Incorrect username or password."
}
```

---

## 🐛 Debugging Local Issues

### **Issue 1: "COGNITO_CLIENT_ID is not configured"**

**Check:**
1. Is `.env.local` in the project root? (same level as `package.json`)
2. Does it have `COGNITO_CLIENT_ID=...`?
3. Did you restart the dev server after adding env vars?

**Fix:**
```bash
# Stop server (Ctrl+C)
# Restart
npm run dev
```

### **Issue 2: "Cannot find module" or Import Errors**

**Fix:**
```bash
# Clean install
rm -rf node_modules .next
npm install
npm run dev
```

### **Issue 3: API Route Returns HTML Instead of JSON**

This means there's an unhandled error. Check the terminal for error messages.

**Fix:** The error handling has been improved, but if you still see HTML:
1. Check terminal for the actual error
2. Make sure all env variables are set
3. Verify the Cognito User Pool ID and Client ID are correct

---

## ✅ Verification Checklist

Before testing, verify:

- [ ] `.env.local` exists in project root
- [ ] `COGNITO_USER_POOL_ID` is set
- [ ] `COGNITO_CLIENT_ID` is set
- [ ] `DEPLOYMENT_REGION` is set
- [ ] Dev server restarted after adding env vars
- [ ] Test user exists in Cognito User Pool
- [ ] You know the test user's password

---

## 🎯 Quick Test Commands

### **Test 1: Check if env vars are loaded**
```bash
# In your terminal (where npm run dev is running)
# Look for any error messages about missing env vars
```

### **Test 2: Test login API directly**
```bash
# Use the curl or PowerShell command above
```

### **Test 3: Test in browser**
1. Go to `http://localhost:3000/login`
2. Try to login
3. Check browser console and terminal for errors

---

## 📝 Notes

- **Local testing uses the SAME Cognito User Pool as production** - so you're testing with real AWS Cognito
- **No need to deploy** - everything works locally
- **Faster iteration** - make changes, test immediately
- **Better debugging** - see errors in terminal and browser console

---

## 🚀 After Local Testing Works

Once login works locally:
1. ✅ Commit your changes
2. ✅ Push to `dev` branch
3. ✅ Amplify will deploy automatically
4. ✅ Production should work the same way

---

**Happy Testing!** 🎉

