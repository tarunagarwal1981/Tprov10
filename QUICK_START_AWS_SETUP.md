# Quick Start: AWS Setup for Database Operations

## 🚀 Quick Setup (5 minutes)

### Step 1: Install AWS CLI

```bash
# Run the installer script
./scripts/install-aws-cli.sh

# Or manually:
# Download from: https://awscli.amazonaws.com/AWSCLIV2.pkg
# Then install: sudo installer -pkg AWSCLIV2.pkg -target /
```

### Step 2: Configure AWS Credentials

```bash
# Interactive setup (recommended)
./scripts/setup-aws-credentials.sh

# Or manually:
aws configure
```

**You'll need:**
- AWS Access Key ID
- AWS Secret Access Key  
- Default region (e.g., `us-east-1`)
- Default output format: `json`

### Step 3: Set Lambda Function Name (Optional)

```bash
export DATABASE_LAMBDA_NAME=travel-app-database-service
export AWS_REGION=us-east-1
```

### Step 4: Verify Setup

```bash
# Test AWS credentials
aws sts get-caller-identity

# Should return your AWS account info
```

### Step 5: Run Table Verification

```bash
./scripts/verify-tables-aws.sh
```

---

## 📋 Required Information

Before running setup, gather:

### 1. AWS Access Credentials
- **AWS Access Key ID** - From IAM → Users → Security credentials
- **AWS Secret Access Key** - Same location
- **AWS Region** - Where your resources are (e.g., `us-east-1`)

### 2. Lambda Function Name
- **Function Name** - Your database service Lambda
- Find in: AWS Console → Lambda → Functions
- Default: `travel-app-database-service`

### 3. Optional: RDS Direct Access
If you want direct database access (not required):
- **RDS Endpoint** - From RDS → Databases → Connectivity
- **RDS Username** - Master username
- **RDS Password** - Master password

---

## 🔧 Available Scripts

### Installation & Setup
- `./scripts/install-aws-cli.sh` - Install AWS CLI v2
- `./scripts/setup-aws-credentials.sh` - Interactive credential setup

### Verification
- `./scripts/verify-tables-aws.sh` - Verify tables using AWS CLI
- `./scripts/verify-itinerary-tables-aws.js` - Verify using Node.js/AWS SDK

### Migration (Coming Soon)
- `./scripts/migrate-tables-aws.sh` - Run database migrations via AWS

---

## ✅ Verification Checklist

After setup, verify:

- [ ] AWS CLI installed: `aws --version`
- [ ] Credentials configured: `aws sts get-caller-identity`
- [ ] Lambda accessible: `aws lambda list-functions --region us-east-1`
- [ ] Tables verified: `./scripts/verify-tables-aws.sh`

---

## 🆘 Troubleshooting

### "AWS CLI not found"
```bash
./scripts/install-aws-cli.sh
```

### "Credentials not configured"
```bash
./scripts/setup-aws-credentials.sh
# Or: aws configure
```

### "Lambda function not found"
- Check function name: `export DATABASE_LAMBDA_NAME=your-function-name`
- Check region: `export AWS_REGION=us-east-1`
- Verify function exists: `aws lambda list-functions --region us-east-1`

### "Permission denied"
- Ensure your AWS user has `lambda:InvokeFunction` permission
- Check IAM policies for your user

---

## 📚 Next Steps

Once setup is complete:
1. ✅ Verify tables: `./scripts/verify-tables-aws.sh`
2. 🔄 Run migrations if needed (scripts coming soon)
3. 🧪 Test database operations
4. 🚀 Proceed with frontend migration

---

**Need Help?** See `AWS_CREDENTIALS_SETUP.md` for detailed information.

