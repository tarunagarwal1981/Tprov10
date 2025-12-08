# Move SNS and SES from Sandbox to Production

## Current Status

**SNS (SMS)**:
- ❌ In **Sandbox** mode
- ❌ Can only send to verified phone numbers
- ❌ 2 messages sent, 2 failed (0% delivery rate) - This confirms sandbox restrictions

**SES (Email)**:
- ❌ Likely in **Sandbox** mode (need to verify)
- ❌ Can only send to verified email addresses

---

## Quick Start: How to Request Production Access

### For SNS (SMS):
**If you don't see an "Exit SMS Sandbox" button:**

1. **Try direct link**: https://console.aws.amazon.com/sns/v3/home?region=us-east-1#/text-messaging/account
2. **If no button appears**: Go to **AWS Support Center** → Create case → "Service limit increase" → Select "SNS SMS production access"
3. **See detailed steps below** in Part 1

### For SES (Email):
1. **Verify sender email first** (required)
2. **Go to**: SES Console → Account dashboard → Click "Request production access" button
3. **See detailed steps below** in Part 2

---

## Part 1: Request SNS Production Access

### Step 1: Exit SMS Sandbox

**Option A: Through Console (If Button Available)**

1. **Go to AWS SNS Console**:
   - https://console.aws.amazon.com/sns/v3/home?region=us-east-1
   - Or search "SNS" in AWS Console

2. **Navigate to Account Preferences**:
   - Click **"Text messaging (SMS)"** in left sidebar
   - Click **"Account preferences"** tab
   - Look for **"Exit SMS Sandbox"** button or **"Request production access"** button

3. **If button is visible**: Click it and fill out the form

**Option B: Through AWS Support (If No Button Available)**

If you don't see a button, you need to request production access through AWS Support:

1. **Go to AWS Support Center**:
   - https://console.aws.amazon.com/support/home
   - Or search "Support" in AWS Console

2. **Create a Support Case**:
   - Click **"Create case"**
   - Choose **"Service limit increase"**
   - **Service**: Select **"Simple Notification Service (SNS)"**
   - **Limit type**: Select **"SMS messaging"** or **"SMS production access"**

3. **Fill out the Support Request**:

   **Required Information for Support Case**:
   
   **Subject**: 
   ```
   Request SNS SMS Production Access
   ```
   
   **Description**:
   ```
   I would like to request production access for AWS SNS SMS messaging to move my account out of sandbox mode.
   
   Use Case: User authentication via OTP (One-Time Password) for account verification and login
   
   Website URL: https://dev.travelselbuy.com
   
   Sample Message: "Your verification code is 123456. Valid for 10 minutes. Do not share this code with anyone. - TRAVCLAN"
   
   Monthly Spend Limit: $50
   
   Details:
   We use SMS to send OTP codes to users during phone number registration and login. 
   Users enter their phone number, receive an OTP via SMS, and enter the code to verify their identity.
   This is a transactional service for user authentication only.
   
   We have already tested SMS functionality in sandbox mode and are ready to move to production.
   ```

4. **Submit the Support Case**:
   - Choose **"Basic"** or **"Developer"** support plan (Basic is free)
   - Click **"Submit"**
   - You'll receive a confirmation email

5. **Wait for Approval**:
   - Usually takes **24-48 hours**
   - AWS Support will review your request
   - You'll receive an email when approved

**Option C: Direct Link (Try This First)**

Try this direct link to the SNS production access page:
- https://console.aws.amazon.com/sns/v3/home?region=us-east-1#/text-messaging/account

If this page shows sandbox status but no button, use Option B (AWS Support).

### Step 2: While Waiting (Optional - For Testing)

**If you need to test immediately**, you can verify phone numbers in sandbox:

1. **Go to**: **"Text messaging (SMS)"** → **"Sandbox destination phone numbers"**
2. **Click**: **"Add phone number"** (orange button)
3. **Enter**: `+919027184519` (your test number)
4. **Verify** via SMS code sent to that number
5. **Now you can send SMS** to this verified number even in sandbox

---

## Part 2: Request SES Production Access

### Step 1: Check SES Sandbox Status

1. **Go to AWS SES Console**:
   - https://console.aws.amazon.com/ses/home?region=us-east-1
   - Or search "SES" in AWS Console

2. **Check Account Status**:
   - Click **"Account dashboard"** in left sidebar
   - Look for **"Account status"** section
   - If it says **"Sandbox"**, you need production access

### Step 2: Verify Sender Email (Required First)

**Before requesting production access, verify your sender email:**

1. **Go to**: **"Verified identities"** in left sidebar
2. **Click**: **"Create identity"**
3. **Choose**: **"Email address"**
4. **Enter**: `tarunag.in@gmail.com` (or your sender email)
5. **Click**: **"Create identity"**
6. **Check your email** and click the verification link
7. **Wait for verification** (usually instant)

### Step 3: Request Production Access

1. **Go to**: **"Account dashboard"**
2. **Click**: **"Request production access"** button
3. **Fill out the Production Access Request Form**:

   **Required Information**:
   - **Mail type**: 
     ```
     Transactional
     ```
   
   - **Website URL**: 
     ```
     https://dev.travelselbuy.com
     ```
   
   - **Use case**: 
     ```
     User authentication OTP emails. We send one-time password codes via email to users during registration and login for account verification.
     ```
   
   - **Expected sending volume**: 
     ```
     1000 emails per day
     ```
     (Adjust based on your needs)
   
   - **Bounce and complaint handling**: 
     ```
     We monitor bounce and complaint rates. We remove invalid email addresses from our database and handle complaints according to AWS SES best practices.
     ```
   
   - **Additional details** (if asked):
     ```
     We use SES exclusively for transactional emails (OTP codes) for user authentication. 
     We do not send marketing emails. All emails are user-initiated (registration/login).
     ```

4. **Submit the Request**:
   - Click **"Submit"**
   - You'll receive a confirmation email

5. **Wait for Approval**:
   - Usually takes **24-48 hours**
   - AWS will review your request
   - You'll receive an email when approved

---

## Part 3: Set Environment Variables

### While Waiting for Approval

**Add these to Amplify Environment Variables**:

1. **Go to**: AWS Amplify Console → Your App → **"Environment variables"**

2. **Add/Update**:
   ```bash
   # SES Configuration (REQUIRED)
   SES_FROM_EMAIL=tarunag.in@gmail.com
   SES_FROM_NAME=TravClan
   
   # SNS Configuration (Optional - already has default)
   SMS_SENDER_ID=TRAVCLAN
   ```

3. **Save** and **redeploy** your app

---

## Part 4: Verify Production Access

### After Approval (24-48 hours)

### Check SNS Production Access:

1. **Go to**: SNS Console → **"Text messaging (SMS)"** → **"Account preferences"**
2. **Check**: **"Account type"** should now say **"Production"**
3. **Test**: Send SMS to any phone number (not just verified ones)

### Check SES Production Access:

1. **Go to**: SES Console → **"Account dashboard"**
2. **Check**: **"Account status"** should now say **"Production"**
3. **Test**: Send email to any email address (not just verified ones)

---

## What Happens After Approval

### SNS (SMS):
- ✅ Can send SMS to **any phone number** (not just verified ones)
- ✅ No need to verify recipient phone numbers
- ✅ Can send to international numbers
- ✅ Full production capabilities

### SES (Email):
- ✅ Can send emails to **any email address** (not just verified ones)
- ✅ No need to verify recipient emails
- ✅ Can send to any domain
- ✅ Full production capabilities

---

## Temporary Workaround (While Waiting)

**If you need to test immediately while waiting for approval:**

### For SNS:
1. **Verify test phone numbers** in sandbox
2. **Add phone numbers** in "Sandbox destination phone numbers"
3. **Test SMS** to verified numbers only

### For SES:
1. **Verify sender email**: `tarunag.in@gmail.com`
2. **Verify recipient emails** (test email addresses)
3. **Test email** to verified recipients only

---

## Summary

**What to Do Now**:

1. ✅ **SNS**: Click "Exit SMS Sandbox" → Fill form → Submit
2. ✅ **SES**: Verify sender email → Request production access → Fill form → Submit
3. ✅ **Amplify**: Set `SES_FROM_EMAIL` environment variable
4. ⏳ **Wait**: 24-48 hours for AWS approval
5. ✅ **Test**: After approval, test with any phone/email

**Expected Timeline**:
- **Request submission**: 5 minutes
- **AWS review**: 24-48 hours
- **Total**: ~1-2 days

**After Approval**:
- ✅ SMS will work to any phone number
- ✅ Email will work to any email address
- ✅ Full production capabilities

---

**Submit both requests now, and you'll be in production within 24-48 hours!**
