# How to View CloudWatch Logs for Amplify App

## Quick Access Methods

### Method 1: Direct from Amplify Console (Easiest) ⭐

1. **Go to**: AWS Amplify Console
   - https://console.aws.amazon.com/amplify
   - Or search "Amplify" in AWS Console

2. **Select**: Your App

3. **Click on**: **"dev"** branch (or the branch you're testing)

4. **Look for**: **"View logs"** or **"Monitoring"** tab
   - Some Amplify setups have a direct link to CloudWatch logs here

5. **If available**: Click **"View logs"** → It will take you directly to CloudWatch

---

### Method 2: Via CloudWatch Console (Full Access)

#### Step 1: Open CloudWatch

1. **Go to**: AWS CloudWatch Console
   - https://console.aws.amazon.com/cloudwatch
   - Or search "CloudWatch" in AWS Console

2. **Make sure you're in the correct region**:
   - Check top-right corner
   - Should be: **us-east-1** (or your deployment region)
   - If wrong, click region dropdown and select correct one

---

#### Step 2: Navigate to Logs

1. **In CloudWatch Console**, click: **"Logs"** in the left sidebar
   - Under "Logs" section

2. **Click**: **"Log groups"**

---

#### Step 3: Find Your Amplify Log Group

**Look for log groups with these patterns:**

1. **Amplify App Logs**:
   ```
   /aws/amplify/your-app-name
   /aws/amplify/d2p2uq8t9xysui  (your app ID)
   ```

2. **Lambda Function Logs** (if using Lambda):
   ```
   /aws/lambda/amplify-your-app-name-dev-*
   /aws/lambda/amplify-d2p2uq8t9xysui-dev-*
   ```

3. **Next.js API Routes** (if using SSR):
   ```
   /aws/amplify/your-app-name/dev
   /aws/amplify/d2p2uq8t9xysui/dev
   ```

4. **Generic Amplify Logs**:
   ```
   /aws/amplify/*
   ```

**If you see many log groups:**
- Look for ones with recent activity (check "Last event time" column)
- Look for ones with "amplify" in the name
- Look for ones with "dev" in the name (if testing dev branch)

---

#### Step 4: Open the Log Group

1. **Click on**: The log group that matches your app

2. **You'll see**: A list of **"Log streams"**
   - Each stream is a separate execution/request

3. **Click on**: The most recent log stream
   - Check the "Last event time" column
   - Click the one with the latest timestamp

---

#### Step 5: View the Logs

1. **You'll see**: All log messages in that stream

2. **Look for**: Error messages:
   - `❌ Phone init error:`
   - `❌ Database query error:`
   - `❌ reCAPTCHA verification failed:`
   - Any red error messages

3. **Use search**: Press `Ctrl+F` (or `Cmd+F` on Mac) to search for:
   - `error`
   - `Error`
   - `❌`
   - `Failed`

---

## Method 3: Search All Logs (If You Can't Find the Group)

### Step 1: Use CloudWatch Insights

1. **In CloudWatch Console**, click: **"Logs"** → **"Logs Insights"**

2. **Select log groups**: 
   - Click **"Select log group(s)"**
   - Select all log groups that might be related:
     - `/aws/amplify/*`
     - `/aws/lambda/amplify-*`

3. **Enter query**:
   ```sql
   fields @timestamp, @message
   | filter @message like /error|Error|❌|Failed/
   | sort @timestamp desc
   | limit 100
   ```

4. **Click**: **"Run query"**

5. **Results**: Will show all error messages from the last hour

---

## Method 4: Via Amplify Build History (Simpler)

### If CloudWatch is too complex, try this first:

1. **Go to**: AWS Amplify Console
   - https://console.aws.amazon.com/amplify

2. **Select**: Your App → **"dev"** branch

3. **Click**: **"Build history"** tab

4. **Click on**: The **latest build** (the one that just deployed)

5. **Look at**: The **"Deploy"** phase (not Build phase)

6. **Scroll through**: The logs looking for error messages

7. **Search**: Press `Ctrl+F` and search for:
   - `error`
   - `Error`
   - `❌`
   - `Phone init`

---

## What to Look For

### Error Messages You Should See:

1. **Database Connection Error**:
   ```
   ❌ Database query error: connect ECONNREFUSED
   Error code: ECONNREFUSED
   ```

2. **Database Authentication Error**:
   ```
   ❌ Database query error: password authentication failed
   Error code: 28P01
   ```

3. **Table Not Found**:
   ```
   ❌ Database query error: relation "users" does not exist
   Error code: 42P01
   ```

4. **reCAPTCHA Error**:
   ```
   ❌ reCAPTCHA verification failed
   Error: invalid-input-secret
   ```

5. **Secrets Manager Error**:
   ```
   ❌ Failed to initialize database pool
   Error: Secrets Manager access denied
   ```

---

## Quick Reference: CloudWatch URL

**Direct link to CloudWatch Logs:**
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups
```

**Replace `us-east-1` with your region if different**

---

## Troubleshooting: Can't Find Logs?

### Issue 1: No Log Groups Found

**Possible reasons:**
- Logs might not be enabled for your Amplify app
- You might be in the wrong AWS region
- Logs might be in a different AWS account

**Fix:**
1. Check you're in the correct AWS account
2. Check you're in the correct region (us-east-1)
3. Try searching for `/aws/amplify` in the search box

---

### Issue 2: Logs Are Empty

**Possible reasons:**
- No requests have been made yet
- Logs are in a different time range
- Logs haven't been created yet

**Fix:**
1. Make a test request (try the login flow)
2. Wait 1-2 minutes for logs to appear
3. Check different time ranges in CloudWatch

---

### Issue 3: Too Many Log Groups

**Fix:**
1. Use the search box in CloudWatch
2. Search for: `amplify` or your app name
3. Filter by recent activity

---

## Alternative: Check Amplify Build Logs First

**Before diving into CloudWatch, try this simpler method:**

1. **Amplify Console** → Your App → **dev** branch
2. **Build history** → Latest build
3. **Deploy phase** → Scroll through logs
4. **Search for**: `error` or `❌`

This is often easier and shows the same errors!

---

## Summary

**Easiest Method:**
1. ✅ Amplify Console → Build history → Latest build → Deploy logs

**If that doesn't work:**
2. ✅ CloudWatch Console → Logs → Log groups → Find `/aws/amplify/*`

**If still can't find:**
3. ✅ CloudWatch Insights → Search all logs for errors

---

**Start with Method 4 (Amplify Build Logs) - it's the simplest!**
