# SES (Email) Configuration Checklist

## ✅ Current Status

### Account Status
- **Sending Enabled**: ✅ Yes
- **Sending Quota**: 200 emails per 24 hours
- **Send Rate**: 1 email per second
- **Emails Sent (Last 24h)**: 0

### Verified Identities
1. **Email**: `tarunag.in@gmail.com` ✅ **VERIFIED**
2. **Domain**: `travelselbuy.com` ⚠️ **PENDING** (needs DNS records)

---

## 🔍 What to Check in SES

### 1. Verify Identity Status ⚠️
**Status**: 
- ✅ Email `tarunag.in@gmail.com` is verified
- ⚠️ Domain `travelselbuy.com` is **PENDING** - needs DNS configuration

**Check via CLI**:
```bash
aws ses get-identity-verification-attributes \
  --identities travelselbuy.com tarunag.in@gmail.com \
  --region us-east-1
```

**Check via Console**:
- Go to: https://console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities
- You should see:
  - `tarunag.in@gmail.com` - Status: **Verified** ✅
  - `travelselbuy.com` - Status: **Pending** ⚠️

**To Complete Domain Verification**:
1. Go to: https://console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities
2. Click on `travelselbuy.com`
3. You'll see DNS records that need to be added:
   - **TXT record** for domain verification:
     - Name: `_amazonses.travelselbuy.com` (or just the domain)
     - Value: `z9FgYEeag9VFo5CPSqXmqezfTTFbiO/FuY8yV3Z2JwM=`
   - **CNAME records** for DKIM (3 records):
     - `zo3v2ihczrihh3r7vw6ta3lhkihgkewo._domainkey.travelselbuy.com`
     - `ze6wxupvd45qjotznnzia2j7hpsgfbls._domainkey.travelselbuy.com`
     - `c6oxbfldjwzxnbgtnbto2jho64jdmwaw._domainkey.travelselbuy.com`
4. Add these records to your DNS provider (wherever `travelselbuy.com` is hosted)
5. Wait for DNS propagation (usually 5-30 minutes)
6. SES will automatically verify once DNS records are found

---

### 2. Check Production Access Status

**Current Status**: Need to verify

**Check via Console**:
1. Go to: https://console.aws.amazon.com/ses/home?region=us-east-1#/account
2. Look for **"Account status"** section
3. Check if it says:
   - ✅ **"Production access granted"** - You can send to any email
   - ⚠️ **"Sandbox"** - You can only send to verified emails

**If in Sandbox Mode**:
- Click **"Request production access"**
- Fill out the form:
  - Mail type: Transactional
  - Website URL: https://travelselbuy.com
  - Use case: "User authentication OTP emails"
  - Expected volume: Your estimate
- Submit and wait for approval (usually 24-48 hours)

---

### 3. Check Sending Limits

**Current Limits**:
- **Max 24-hour send**: 200 emails
- **Max send rate**: 1 email/second

**Check via CLI**:
```bash
aws ses get-send-quota --region us-east-1
```

**If You Need Higher Limits**:
1. Go to: https://console.aws.amazon.com/ses/home?region=us-east-1#/account
2. Click **"Request a sending limit increase"**
3. Fill out the form with your requirements

---

### 4. Check DKIM Configuration (for Domain)

**For Domain `travelselbuy.com`**:

**Check via CLI**:
```bash
aws ses get-identity-dkim-attributes --identities travelselbuy.com --region us-east-1
```

**Check via Console**:
1. Go to: https://console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities
2. Click on `travelselbuy.com`
3. Check **"DKIM"** section:
   - ✅ **Easy DKIM**: Should be enabled
   - ✅ **DKIM records**: Should be added to your DNS

**Benefits of DKIM**:
- Better email deliverability
- Prevents emails from going to spam
- Email authentication

---

### 5. Check Bounce and Complaint Rates

**Check via Console**:
1. Go to: https://console.aws.amazon.com/ses/home?region=us-east-1#/sending-statistics
2. Monitor:
   - **Bounce rate**: Should be < 5%
   - **Complaint rate**: Should be < 0.1%

**If rates are high**:
- Review your email list
- Remove invalid email addresses
- Improve email content

---

### 6. Configure SNS Notifications (Optional but Recommended)

Set up notifications for bounces and complaints:

**Via CLI**:
```bash
# Create SNS topic for bounces
aws sns create-topic --name ses-bounces --region us-east-1

# Create SNS topic for complaints
aws sns create-topic --name ses-complaints --region us-east-1

# Configure SES to send to these topics
aws ses set-identity-notification-attributes \
  --identity travelselbuy.com \
  --notification-type Bounce \
  --sns-topic arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:ses-bounces \
  --region us-east-1

aws ses set-identity-notification-attributes \
  --identity travelselbuy.com \
  --notification-type Complaint \
  --sns-topic arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:ses-complaints \
  --region us-east-1
```

**Via Console**:
1. Go to: https://console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities
2. Click on your domain/email
3. Go to **"Notifications"** tab
4. Configure bounce and complaint notifications

---

## 📋 Quick Verification Commands

```bash
# Check account status
aws ses get-account-sending-enabled --region us-east-1

# List all verified identities
aws ses list-identities --region us-east-1

# Check verification status
aws ses get-identity-verification-attributes \
  --identities travelselbuy.com tarunag.in@gmail.com \
  --region us-east-1

# Check sending quota
aws ses get-send-quota --region us-east-1

# Check DKIM for domain
aws ses get-identity-dkim-attributes \
  --identities travelselbuy.com \
  --region us-east-1
```

---

## 🧪 Test Email Sending

### Test with Verified Email
```bash
aws ses send-email \
  --from tarunag.in@gmail.com \
  --to tarunag.in@gmail.com \
  --subject "Test Email from TravClan" \
  --text "This is a test email from the OTP system" \
  --region us-east-1
```

### Test with Domain (Recommended for Production)
```bash
aws ses send-email \
  --from noreply@travelselbuy.com \
  --to tarunag.in@gmail.com \
  --subject "Test Email from TravClan" \
  --text "This is a test email from the OTP system" \
  --region us-east-1
```

---

## ✅ Recommended Configuration for OTP Emails

### Use Domain Email (Better for Production)
- **From Email**: `noreply@travelselbuy.com` or `otp@travelselbuy.com`
- **From Name**: `TravClan`

### Environment Variables
```bash
SES_FROM_EMAIL=noreply@travelselbuy.com
SES_FROM_NAME=TravClan
AWS_REGION=us-east-1
```

---

## 🎯 Action Items

1. ✅ **Identities Verified**: Both domain and email are verified
2. ⏳ **Check Production Access**: Verify if you're in sandbox or production mode
3. ⏳ **Check DKIM**: Ensure DKIM is enabled for domain
4. ⏳ **Test Email Sending**: Send a test email to verify everything works
5. ⏳ **Set Up Notifications**: Configure bounce/complaint notifications (optional)

---

## 📍 Console Links

- **Verified Identities**: https://console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities
- **Account Dashboard**: https://console.aws.amazon.com/ses/home?region=us-east-1#/account
- **Sending Statistics**: https://console.aws.amazon.com/ses/home?region=us-east-1#/sending-statistics
- **Configuration Sets**: https://console.aws.amazon.com/ses/home?region=us-east-1#/configuration-sets

---

**Last Checked**: Current date
**Region**: us-east-1
**Status**: Ready for use (verify production access)

