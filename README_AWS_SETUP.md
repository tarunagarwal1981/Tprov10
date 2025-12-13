# AWS Setup Complete Guide

## 📋 What You Need

Before we start, please provide:

1. **AWS Access Key ID** - From AWS Console → IAM → Users → Your User → Security credentials
2. **AWS Secret Access Key** - Same location
3. **AWS Region** - Where your resources are (e.g., `us-east-1`, `us-west-2`)
4. **Lambda Function Name** - Your database service Lambda (default: `travel-app-database-service`)

---

## 🚀 Installation Steps

### Step 1: Install AWS CLI

**Choose one method:**

#### Method A: Official Installer (Recommended)
```bash
# The installer is already downloaded at /tmp/AWSCLIV2.pkg
# Install it:
sudo installer -pkg /tmp/AWSCLIV2.pkg -target /

# Or open in Finder:
open /tmp/AWSCLIV2.pkg
```

#### Method B: Using pip (No sudo needed)
```bash
python3 -m pip install --user awscli
export PATH="$HOME/Library/Python/3.9/bin:$PATH"
```

#### Method C: Use the script
```bash
./scripts/install-aws-cli.sh
```

**Verify installation:**
```bash
aws --version
```

---

### Step 2: Configure AWS Credentials

**Interactive setup (easiest):**
```bash
./scripts/setup-aws-credentials.sh
```

**Or manually:**
```bash
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

**Or set environment variables:**
```bash
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_REGION=us-east-1
```

---

### Step 3: Set Lambda Function Name

```bash
export DATABASE_LAMBDA_NAME=travel-app-database-service
export AWS_REGION=us-east-1
```

---

### Step 4: Test Setup

```bash
# Test AWS credentials
aws sts get-caller-identity

# Should return:
# {
#   "UserId": "...",
#   "Account": "...",
#   "Arn": "..."
# }
```

---

### Step 5: Verify Tables

```bash
./scripts/verify-tables-aws.sh
```

This will:
- ✅ Check all 16 required tables
- ✅ Verify time_slots column
- ✅ Report missing tables
- ✅ Provide recommendations

---

## 📝 Scripts Available

### Setup Scripts
- `./scripts/install-aws-cli.sh` - Install AWS CLI
- `./scripts/setup-aws-credentials.sh` - Configure credentials

### Verification Scripts
- `./scripts/verify-tables-aws.sh` - Verify tables using AWS CLI ⭐
- `./scripts/verify-itinerary-tables-aws.js` - Verify using Node.js

### Migration Scripts (Coming Soon)
- `./scripts/migrate-tables-aws.sh` - Run migrations via AWS

---

## 🔍 What Gets Verified

The verification script checks:

### Itinerary Tables (3)
- `itineraries`
- `itinerary_days` (with optional `time_slots` column)
- `itinerary_items`

### Multi-City Package Tables (13)
- `multi_city_packages`
- `multi_city_hotel_packages`
- `multi_city_pricing_packages`
- `multi_city_hotel_pricing_packages`
- `multi_city_pricing_rows`
- `multi_city_hotel_pricing_rows`
- `multi_city_private_package_rows`
- `multi_city_hotel_private_package_rows`
- `multi_city_package_day_plans`
- `multi_city_hotel_package_day_plans`
- `multi_city_package_cities`
- `multi_city_hotel_package_cities`
- `multi_city_hotel_package_city_hotels`
- `multi_city_package_images`
- `multi_city_hotel_package_images`

**Total: 16 tables**

---

## ✅ Expected Output

### Success
```
🔍 Verifying itinerary tables in AWS RDS...
✅ Lambda connection successful
✅ itineraries - EXISTS
✅ itinerary_days - EXISTS
   ✅ time_slots column exists
...

📊 Summary:
✅ Tables found: 16/16
❌ Tables missing: 0
✅ time_slots column: EXISTS

✅ All required tables exist!
```

### Missing Tables
```
📊 Summary:
✅ Tables found: 14/16
❌ Tables missing: 2

⚠️  Missing tables:
   - table1
   - table2

💡 Run migrations to create missing tables
```

---

## 🆘 Troubleshooting

### "AWS CLI not found"
- Install: `./scripts/install-aws-cli.sh`
- Or: `python3 -m pip install --user awscli`

### "Credentials not configured"
- Run: `./scripts/setup-aws-credentials.sh`
- Or: `aws configure`

### "Lambda function not found"
- Check function name: `export DATABASE_LAMBDA_NAME=your-function-name`
- List functions: `aws lambda list-functions --region us-east-1`

### "Permission denied"
- Ensure IAM user has `lambda:InvokeFunction` permission
- Check IAM policies

---

## 📚 Documentation

- `AWS_CREDENTIALS_SETUP.md` - Detailed credentials guide
- `QUICK_START_AWS_SETUP.md` - Quick reference
- `INSTALL_AWS_CLI.md` - Installation options
- `ITINERARY_VERIFICATION_GUIDE.md` - Verification methods

---

## 🎯 Next Steps

Once verification is complete:
1. ✅ All tables exist → Proceed with frontend migration
2. ❌ Missing tables → Run migrations (scripts coming soon)
3. 🔄 Need time_slots → Run migration 017

---

**Ready to start?** Run: `./scripts/setup-aws-credentials.sh`

