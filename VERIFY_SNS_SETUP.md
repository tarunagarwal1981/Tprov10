# Verifying SNS SMS Configuration

## Current Configuration (via CLI)

The SNS SMS configuration shows:
- **DefaultSenderID**: `TRAVCLAN` ✅
- **MonthlySpendLimit**: `1` (currently $1/month)

## Where to See SNS Configuration in AWS Console

### Option 1: SMS Preferences (Account Level)
1. Go to: https://console.aws.amazon.com/sns/v3/home?region=us-east-1#/text-messaging/account
2. Look for **"Account preferences"** section
3. You should see:
   - **Default sender ID**: TRAVCLAN
   - **Monthly spending limit**: $1.00

### Option 2: Text Messaging Preferences
1. Go to: https://console.aws.amazon.com/sns/v3/home?region=us-east-1#/text-messaging
2. Click on **"Preferences"** tab
3. Look for **"Default sender ID"** field

### Option 3: Account Dashboard
1. Go to: https://console.aws.amazon.com/sns/v3/home?region=us-east-1
2. Click on **"Text messaging (SMS)"** in the left sidebar
3. Click on **"Account preferences"** or **"Preferences"**

## If You Don't See the Configuration

The configuration might be region-specific. Try:

1. **Check the correct region**: Make sure you're in `us-east-1`
2. **Refresh the page**: Sometimes the console needs a refresh
3. **Check IAM permissions**: Ensure your user has `sns:GetSMSAttributes` permission

## Verify via CLI

Run this command to see all SMS attributes:
```bash
aws sns get-sms-attributes --region us-east-1
```

Expected output:
```json
{
    "attributes": {
        "MonthlySpendLimit": "1",
        "DefaultSenderID": "TRAVCLAN"
    }
}
```

## Additional SNS SMS Setup

If you want to configure more settings:

### Set Monthly Spending Limit
```bash
aws sns set-sms-attributes --attributes MonthlySpendLimit=50 --region us-east-1
```

### Set Delivery Status Logging
```bash
aws sns set-sms-attributes --attributes DeliveryStatusSuccessSamplingRate=100 --region us-east-1
```

### Set Usage Report S3 Bucket (optional)
```bash
aws sns set-sms-attributes --attributes UsageReportS3Bucket=your-bucket-name --region us-east-1
```

## Request Production Access

If you're in sandbox mode:
1. Go to: https://console.aws.amazon.com/sns/v3/home?region=us-east-1#/text-messaging/account
2. Click **"Request production access"**
3. Fill out the form:
   - Use case: "User authentication via OTP"
   - Website URL: Your production domain
   - Sample messages: "Your verification code is 123456. Valid for 10 minutes."
4. Submit and wait for approval (usually 24-48 hours)

## Troubleshooting

### If DefaultSenderID is not showing:
1. The sender ID might be region-specific - check all regions
2. Some countries/regions have restrictions on sender IDs
3. The sender ID might need to be registered in some countries

### If you want to see it in a different way:
Try the AWS CLI with different output formats:
```bash
# Table format
aws sns get-sms-attributes --region us-east-1 --output table

# YAML format
aws sns get-sms-attributes --region us-east-1 --output yaml
```

