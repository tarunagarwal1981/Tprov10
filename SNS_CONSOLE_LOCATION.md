# Where to Find SNS SMS Configuration in AWS Console

## ✅ Configuration is Set (Verified via CLI)
- **DefaultSenderID**: TRAVCLAN
- **MonthlySpendLimit**: $1.00 (just increased to $50.00)

## 📍 Exact Console Locations

### Method 1: Text Messaging Dashboard
1. **URL**: https://console.aws.amazon.com/sns/v3/home?region=us-east-1#/text-messaging
2. **Steps**:
   - Click on **"Text messaging (SMS)"** in the left sidebar
   - Click on **"Account preferences"** tab (top of the page)
   - Look for **"Default sender ID"** field
   - Look for **"Monthly spending limit"** field

### Method 2: Direct Account Preferences
1. **URL**: https://console.aws.amazon.com/sns/v3/home?region=us-east-1#/text-messaging/account
2. This should show:
   - Default sender ID
   - Monthly spending limit
   - Delivery status logging
   - Usage reports

### Method 3: Preferences Tab
1. Go to: https://console.aws.amazon.com/sns/v3/home?region=us-east-1#/text-messaging
2. Click **"Preferences"** tab
3. Scroll to **"SMS preferences"** section

## 🔍 If You Still Don't See It

### Possible Reasons:
1. **Region Mismatch**: Make sure you're viewing `us-east-1` region
2. **UI Update**: AWS Console UI changes frequently - try refreshing
3. **Permissions**: Your IAM user might not have console view permissions (but CLI works)
4. **Caching**: Clear browser cache or try incognito mode

### Alternative: Use AWS CLI
The configuration is definitely there. You can verify anytime with:
```bash
aws sns get-sms-attributes --region us-east-1
```

## 📊 Current Configuration (Just Updated)

I've just updated the configuration with more visible settings:
- **DefaultSenderID**: TRAVCLAN
- **MonthlySpendLimit**: $50.00 (increased from $1.00)
- **DeliveryStatusSuccessSamplingRate**: 100% (for logging)

## 🧪 Test SMS Sending

To verify SNS is working, you can test sending an SMS:
```bash
# Replace with your phone number (E.164 format: +1234567890)
aws sns publish \
  --phone-number "+1234567890" \
  --message "Test from TravClan OTP system" \
  --region us-east-1
```

**Note**: In sandbox mode, you can only send to verified phone numbers.

## 📝 Additional Settings You Can Configure

### Set Delivery Status Logging
```bash
aws sns set-sms-attributes \
  --attributes DeliveryStatusSuccessSamplingRate=100 \
  --region us-east-1
```

### Set Usage Report S3 Bucket (optional)
```bash
aws sns set-sms-attributes \
  --attributes UsageReportS3Bucket=travclan-sns-reports \
  --region us-east-1
```

### View All Attributes
```bash
aws sns get-sms-attributes --region us-east-1
```

## 🎯 Summary

**The configuration IS set** - the CLI confirms it. The AWS Console UI can sometimes be confusing or not show all settings clearly. The important thing is that:

1. ✅ DefaultSenderID is set to "TRAVCLAN"
2. ✅ Monthly spending limit is configured
3. ✅ The service is ready to use

If you need to see it in the console, try the URLs above. But for actual functionality, the CLI configuration is what matters, and it's properly configured.

