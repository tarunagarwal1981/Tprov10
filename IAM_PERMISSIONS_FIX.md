# IAM Permissions Fix for SMS and Email OTP

## Problem Identified ✅

**From CloudWatch Logs:**
1. ✅ reCAPTCHA verification: **Working**
2. ✅ Database queries: **Working** (Lambda database service)
3. ❌ SMS OTP: **Permission denied** - `SNS:Publish` not allowed
4. ❌ Email OTP: **Permission denied** - `ses:SendEmail` not allowed

**Error Messages:**
```
AuthorizationErrorException: User: arn:aws:sts::815660521604:assumed-role/AmplifySSRLoggingRole-5b109d56-99a3-45c4-a40e-a24f4ca1094c/AmplifyHostingCompute-app=d2p2uq8t9xysui is not authorized to perform: SNS:Publish on resource: +919027184519
```

```
AccessDenied: User ... is not authorized to perform `ses:SendEmail' on resource `arn:aws:ses:us-east-1:815660521604:identity/tarunag.in@gmail.com'
```

---

## Solution: Add IAM Permissions to Amplify Service Role

The Amplify service role (`AmplifySSRLoggingRole-5b109d56-99a3-45c4-a40e-a24f4ca1094c`) needs permissions to:
1. **Publish to SNS** (for SMS OTP)
2. **Send emails via SES** (for Email OTP)

---

## Step-by-Step Fix

### Step 1: Find Your Amplify Service Role

1. **Go to AWS IAM Console**:
   - https://console.aws.amazon.com/iam
   - Or search "IAM" in AWS Console

2. **Click**: **"Roles"** in the left sidebar

3. **Search for**: `AmplifySSRLoggingRole` or your Amplify app name

4. **Find the role**: `AmplifySSRLoggingRole-5b109d56-99a3-45c4-a40e-a24f4ca1094c`
   - (The exact name is in your CloudWatch logs)

---

### Step 2: Add SNS Permission (SMS OTP)

1. **Click on the role** to open it

2. **Click**: **"Add permissions"** → **"Create inline policy"**

3. **Click**: **"JSON"** tab

4. **Paste this policy**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "sns:Publish"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

5. **Click**: **"Next"**

6. **Name the policy**: `AmplifySNSPublishPolicy`

7. **Click**: **"Create policy"**

---

### Step 3: Add SES Permission (Email OTP)

1. **Still in the same role**, click: **"Add permissions"** → **"Create inline policy"**

2. **Click**: **"JSON"** tab

3. **Paste this policy**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ses:SendEmail",
           "ses:SendRawEmail"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

4. **Click**: **"Next"**

5. **Name the policy**: `AmplifySESSendEmailPolicy`

6. **Click**: **"Create policy"**

---

## Alternative: Combined Policy (Recommended)

**Instead of two separate policies, create one combined policy:**

1. **Click**: **"Add permissions"** → **"Create inline policy"**

2. **Click**: **"JSON"** tab

3. **Paste this combined policy**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "sns:Publish"
         ],
         "Resource": "*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "ses:SendEmail",
           "ses:SendRawEmail"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

4. **Click**: **"Next"**

5. **Name the policy**: `AmplifySMSAndEmailPolicy`

6. **Click**: **"Create policy"**

---

## Verify Permissions

After adding the permissions:

1. **Go back to your Amplify app**
2. **Try the phone signup flow again**
3. **Check CloudWatch logs** - you should see:
   - ✅ SMS OTP sent successfully
   - ✅ Email OTP sent successfully

---

## Security Best Practices (Optional)

**For production, restrict resources instead of using `"Resource": "*"`:**

### SNS Policy (Restricted):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:us-east-1:815660521604:*"
    }
  ]
}
```

### SES Policy (Restricted):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "arn:aws:ses:us-east-1:815660521604:identity/*"
    }
  ]
}
```

---

## Summary

**What to do:**
1. ✅ Go to IAM → Roles
2. ✅ Find `AmplifySSRLoggingRole-5b109d56-99a3-45c4-a40e-a24f4ca1094c`
3. ✅ Add inline policy with SNS:Publish and SES:SendEmail permissions
4. ✅ Test phone signup flow again

**After fixing:**
- ✅ SMS OTP will be sent successfully
- ✅ Email OTP will be sent successfully
- ✅ Phone authentication flow will work end-to-end

---

**The phone auth flow is working perfectly - just needs IAM permissions!**
