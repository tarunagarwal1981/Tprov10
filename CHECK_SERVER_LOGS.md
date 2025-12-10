# How to Check Server Logs for 500 Error

## Current Status

✅ **reCAPTCHA is working!** (No more "RECAPTCHA_SECRET_KEY missing" error)
❌ **500 Internal Server Error** - Something else is failing

The error details aren't shown in the browser console for security reasons. We need to check the **server-side logs** to see what's actually failing.

---

## Step 1: Check Amplify Build Logs

### Option A: Via Amplify Console (Easiest)

1. **Go to**: AWS Amplify Console
   - https://console.aws.amazon.com/amplify

2. **Select**: Your App

3. **Navigate to**: **Your App** → **dev** branch → **Build history**

4. **Click on**: The latest build (should be the one that just deployed)

5. **Look for**: The "Deploy" phase logs (not Build phase)

6. **Search for**: Error messages starting with:
   - `❌ Phone init error:`
   - `❌ Database query error:`
   - `❌ reCAPTCHA verification failed:`
   - Any error messages

---

### Option B: Check Real-Time Logs

1. **In Amplify Console** → Your App → **dev** branch

2. **Click**: **"View logs"** or **"Real-time logs"** (if available)

3. **Trigger the error again**:
   - Go to `/login` page
   - Enter phone number
   - Complete reCAPTCHA
   - Click "NEXT"

4. **Watch the logs** in real-time for error messages

---

## Step 2: Check CloudWatch Logs

### If Amplify Logs Don't Show Enough Detail:

**See detailed guide**: `HOW_TO_VIEW_CLOUDWATCH_LOGS.md`

**Quick steps:**
1. **Go to**: AWS CloudWatch Console
   - https://console.aws.amazon.com/cloudwatch
   - Make sure you're in the correct region (us-east-1)

2. **Navigate to**: **Logs** → **Log groups**

3. **Look for**: Log groups starting with:
   - `/aws/amplify/your-app-name`
   - `/aws/amplify/d2p2uq8t9xysui` (your app ID)
   - `/aws/lambda/amplify-*`

4. **Click on**: The most recent log group (check "Last event time")

5. **Click on**: The latest log stream

6. **Search for**: Error messages (Ctrl+F → search "error" or "❌")

---

## Step 3: What to Look For

### Common Error Patterns:

#### 1. Database Connection Error:
```
❌ Database query error: connect ECONNREFUSED
   Error code: ECONNREFUSED
```
**Meaning**: Can't connect to database
**Fix**: Check RDS credentials, network settings

---

#### 2. Database Authentication Error:
```
❌ Database query error: password authentication failed
   Error code: 28P01
```
**Meaning**: Wrong database password
**Fix**: Check RDS password in Secrets Manager or env vars

---

#### 3. Table/Column Not Found:
```
❌ Database query error: relation "users" does not exist
   Error code: 42P01
```
**Meaning**: Table doesn't exist
**Fix**: Run database migrations

---

#### 4. reCAPTCHA Verification Error:
```
❌ reCAPTCHA verification failed
   Error: invalid-input-secret
```
**Meaning**: Secret key is wrong
**Fix**: Verify RECAPTCHA_SECRET_KEY matches Site Key

---

#### 5. Secrets Manager Error:
```
❌ Failed to initialize database pool
   Error: Secrets Manager access denied
```
**Meaning**: Can't access Secrets Manager
**Fix**: Check IAM permissions

---

## Step 4: Share the Error Details

Once you find the error in the logs, share:

1. **Error message**: The full error text
2. **Error code**: If there's an error code
3. **Stack trace**: The first few lines (if available)
4. **Context**: What was happening when it failed

This will help identify the exact issue and fix it.

---

## Quick Checklist

- [ ] Checked Amplify build logs (Deploy phase)
- [ ] Checked real-time logs (if available)
- [ ] Checked CloudWatch logs
- [ ] Found error message
- [ ] Noted error code (if any)
- [ ] Ready to share error details

---

## Alternative: Add Debug Endpoint

If you can't access logs easily, we can add a debug endpoint that shows environment status. Let me know if you want me to create that.

---

## Summary

**The Issue:**
- reCAPTCHA is working ✅
- Getting 500 error ❌
- Need server logs to see what's failing

**Next Step:**
1. Check Amplify/CloudWatch logs
2. Find the error message
3. Share the error details
4. We'll fix it based on the error

---

**The logs will tell us exactly what's failing - database connection, query error, or something else.**
