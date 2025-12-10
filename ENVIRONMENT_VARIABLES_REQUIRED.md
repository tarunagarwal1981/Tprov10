# 🔧 Required Environment Variables for Services

## ✅ Current Status

Based on your logs, the following services are configured correctly:
- ✅ **reCAPTCHA (Google)** - Working correctly
- ❌ **Twilio (SMS)** - Missing environment variables
- ❌ **SendGrid (Email)** - Missing environment variables

---

## 📋 Required Environment Variables

### 1. Twilio SMS Service

Add these to your **AWS Amplify Environment Variables**:

```bash
# Twilio Configuration (REQUIRED for SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number (E.164 format)

# Optional
SMS_SENDER_ID=TRAVCLAN  # Max 11 characters (default: TRAVCLAN)
SMS_PROVIDER=twilio     # Default is already 'twilio', but you can set explicitly
```

**How to get Twilio credentials:**
1. Sign up at https://www.twilio.com/
2. Go to Console Dashboard
3. Copy **Account SID** and **Auth Token**
4. Get a phone number from Twilio (or use trial number)

---

### 2. SendGrid Email Service

Add these to your **AWS Amplify Environment Variables**:

```bash
# SendGrid Configuration (REQUIRED for Email)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email Configuration
SENDGRID_FROM_EMAIL=noreply@yourdomain.com  # Must be verified in SendGrid
SENDGRID_FROM_NAME=TravClan

# Optional (fallback if SendGrid vars not set)
EMAIL_PROVIDER=sendgrid  # Default is already 'sendgrid', but you can set explicitly
```

**How to get SendGrid API key:**
1. Sign up at https://sendgrid.com/
2. Go to Settings → API Keys
3. Click "Create API Key"
4. Name it (e.g., "TravClan Production")
5. Select "Full Access" or "Restricted Access" (with Mail Send permissions)
6. Copy the API key (starts with `SG.`)

**Important:** Verify your sender email in SendGrid:
1. Go to Settings → Sender Authentication
2. Verify Single Sender or Domain
3. Use verified email as `SENDGRID_FROM_EMAIL`

---

### 3. Google reCAPTCHA (Already Working ✅)

These should already be set:

```bash
RECAPTCHA_SITE_KEY=6Lfc9yMsAA...  # Your site key
RECAPTCHA_SECRET_KEY=6Lfc9yMsAA...  # Your secret key
RECAPTCHA_MIN_SCORE=0.5  # For v3 only (optional)
CAPTCHA_PROVIDER=recaptcha  # Default is 'recaptcha'
```

---

## 🚀 How to Add Variables in AWS Amplify

### Step 1: Go to Amplify Console
1. Navigate to: https://console.aws.amazon.com/amplify
2. Select your app
3. Click **App settings** → **Environment variables**

### Step 2: Add Variables
1. Click **Manage variables**
2. Make sure you're on the correct branch (e.g., `dev` or `main`)
3. Click **Add variable** for each variable above
4. Enter the **Name** and **Value**
5. Click **Save**

### Step 3: Redeploy
After adding variables:
1. Go to **Deploys** tab
2. Click **Redeploy this version** or wait for next commit to trigger deployment
3. Wait for deployment to complete (5-10 minutes)

---

## 🧪 Testing After Setup

### Test SMS Service
1. Try phone signup/login
2. Check CloudWatch logs for: `✅ Twilio SMS sent successfully`
3. Verify OTP is received on phone

### Test Email Service
1. Try email signup/login
2. Check CloudWatch logs for: `✅ SendGrid email sent successfully`
3. Verify OTP is received in email

### Check Logs
Look for these success messages:
```
✅ Twilio SMS sent successfully
✅ SendGrid email sent successfully
```

If you see errors, check:
- Environment variables are set correctly
- API keys are valid
- Phone number/email are verified in respective services

---

## 📝 Quick Checklist

- [ ] `TWILIO_ACCOUNT_SID` is set
- [ ] `TWILIO_AUTH_TOKEN` is set
- [ ] `TWILIO_PHONE_NUMBER` is set (E.164 format: +1234567890)
- [ ] `SENDGRID_API_KEY` is set
- [ ] `SENDGRID_FROM_EMAIL` is set (and verified in SendGrid)
- [ ] `SENDGRID_FROM_NAME` is set (optional, defaults to "TravClan")
- [ ] Variables are added to correct branch in Amplify
- [ ] App has been redeployed after adding variables

---

## 🔍 Current Errors (From Your Logs)

```
❌ Twilio SMS sending error: TWILIO_PHONE_NUMBER environment variable is not set
❌ SendGrid email sending error: SendGrid API key not configured. Set SENDGRID_API_KEY environment variable
```

**Fix:** Add the missing environment variables listed above in AWS Amplify Console.

---

## 💡 Tips

1. **Twilio Phone Number Format:** Must be in E.164 format (e.g., `+1234567890`)
2. **SendGrid Free Tier:** 100 emails/day forever - perfect for development
3. **Twilio Trial:** Free trial with limited credits - upgrade for production
4. **Environment Variables:** Make sure they're set for the correct branch in Amplify
5. **Redeploy:** Always redeploy after adding/changing environment variables

---

## 📚 Service Documentation

- **Twilio Setup:** https://www.twilio.com/docs/quickstart
- **SendGrid Setup:** https://docs.sendgrid.com/for-developers/sending-email/api-getting-started
- **Google reCAPTCHA:** https://www.google.com/recaptcha/admin

