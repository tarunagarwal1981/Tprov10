# Twilio SMS Implementation Guide

## Quick Start: Replace AWS SNS with Twilio

**Time to implement**: 15-20 minutes
**Approval needed**: ❌ None - works immediately!

---

## Step 1: Sign Up for Twilio (5 minutes)

1. **Go to**: https://www.twilio.com/try-twilio
2. **Sign up** with your email
3. **Verify your email**
4. **Get your credentials**:
   - **Account SID**: Found in dashboard
   - **Auth Token**: Found in dashboard (click to reveal)
   - **Phone Number**: Twilio gives you a free trial number

**Free Trial**: $15.50 credit (enough for ~200 SMS to US)

---

## Step 2: Install Twilio SDK

```bash
npm install twilio
```

---

## Step 3: Update SMS Service Code

I'll create a new version of `smsService.ts` that uses Twilio instead of AWS SNS.

**Benefits:**
- ✅ No approval needed
- ✅ Works immediately
- ✅ Same function signature (easy to swap)
- ✅ Better error handling

---

## Step 4: Set Environment Variables in Amplify

Add these to Amplify environment variables:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number

# Keep AWS SNS as fallback (optional)
SMS_PROVIDER=twilio  # or 'aws' to switch back
```

---

## Step 5: Test

1. **Try phone signup flow**
2. **Check if SMS is received**
3. **Check CloudWatch logs** for success

---

## Implementation Code

✅ **Code has been created!** 

I've updated your SMS service to support both AWS SNS and Twilio. You can switch between them using an environment variable.

---

## Step 6: Install Twilio Package

Run this command in your project:

```bash
npm install twilio
```

---

## Step 7: Switch to Twilio

**In Amplify Environment Variables**, add:

```bash
# Switch to Twilio
SMS_PROVIDER=twilio

# Twilio Credentials (get from Twilio dashboard)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number

# Optional: Keep sender ID
SMS_SENDER_ID=TRAVCLAN
```

**Save** and **redeploy** your app.

---

## Step 8: Test

1. **Try phone signup flow**
2. **Enter phone number**: `+919027184519`
3. **Submit signup form**
4. **Check CloudWatch logs** - should see `✅ Twilio SMS sent successfully`
5. **Check phone** - should receive SMS with OTP

---

## How It Works

**The code automatically:**
- ✅ Checks `SMS_PROVIDER` environment variable
- ✅ If `twilio`, uses Twilio service
- ✅ If `aws` (or not set), uses AWS SNS
- ✅ Same function signature - no code changes needed!

**To switch back to AWS SNS:**
- Set `SMS_PROVIDER=aws` (or remove the variable)

---

## Files Created/Updated

1. ✅ `src/lib/services/smsServiceTwilio.ts` - New Twilio implementation
2. ✅ `src/lib/services/smsService.ts` - Updated to support both providers

**No changes needed to your API routes** - they'll work with either provider!

---

## Troubleshooting

### Error: "Twilio SMS service not available"
- **Fix**: Run `npm install twilio`

### Error: "Twilio credentials not configured"
- **Fix**: Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` in Amplify

### Error: "Unverified phone number (trial account restriction)"
- **Fix**: Verify the recipient phone number in Twilio Console (trial accounts only)
- **OR**: Upgrade to paid Twilio account (no verification needed)

---

## Cost Comparison

**For 1000 SMS to India:**
- **AWS SNS**: $2.30 (but requires approval)
- **Twilio**: $68.00 (works immediately)

**For 1000 SMS to US:**
- **AWS SNS**: $6.45
- **Twilio**: $7.90

**Recommendation**: Use Twilio for immediate production, switch to AWS SNS later if cost is critical.

---

**Install Twilio, set the environment variables, and you're ready to go!**
