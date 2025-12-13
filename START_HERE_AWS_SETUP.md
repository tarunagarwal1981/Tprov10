# 🚀 Start Here: AWS Setup for Database Operations

## ✅ What's Ready

All scripts and tools are ready! You just need to:

1. **Install AWS CLI** (one-time setup)
2. **Provide AWS credentials** (I'll guide you)
3. **Run verification** (automatic)

---

## 📋 Information I Need From You

Please provide:

### 1. AWS Access Credentials
- **AWS Access Key ID** - Get from: AWS Console → IAM → Users → Your User → Security credentials → Create access key
- **AWS Secret Access Key** - Same location (save this securely!)
- **AWS Region** - Where your resources are (e.g., `us-east-1`, `us-west-2`, `eu-west-1`)

### 2. Lambda Function Name (Optional)
- **Function Name** - Your database service Lambda
- Find in: AWS Console → Lambda → Functions
- **Default**: `travel-app-database-service` (if you're not sure, we can check)

---

## 🎯 Quick Start (3 Steps)

### Step 1: Install AWS CLI

**Option A: Using pip (No password needed)**
```bash
python3 -m pip install --user awscli
export PATH="$HOME/Library/Python/3.9/bin:$PATH"
aws --version
```

**Option B: Official Installer (Requires password)**
```bash
# Installer is at /tmp/AWSCLIV2.pkg
sudo installer -pkg /tmp/AWSCLIV2.pkg -target /
aws --version
```

### Step 2: Configure Credentials

Once you have your credentials, run:
```bash
./scripts/setup-aws-credentials.sh
```

Or manually:
```bash
aws configure
# Enter your credentials when prompted
```

### Step 3: Run Verification

```bash
# Set Lambda function name (if different from default)
export DATABASE_LAMBDA_NAME=travel-app-database-service
export AWS_REGION=us-east-1

# Verify tables
./scripts/verify-tables-aws.sh
```

---

## 📝 Detailed Instructions

### Getting AWS Credentials

1. **Log into AWS Console**: https://console.aws.amazon.com
2. **Go to IAM**: Search for "IAM" in the top search bar
3. **Click Users**: In the left sidebar
4. **Select Your User**: Click on your username
5. **Security Credentials Tab**: Click the tab
6. **Create Access Key**: 
   - Click "Create access key"
   - Choose "Command Line Interface (CLI)"
   - Click "Next" → "Create access key"
   - **IMPORTANT**: Copy both Access Key ID and Secret Access Key
   - Save them securely (you won't see the secret again!)

### Getting Lambda Function Name

1. **Go to Lambda**: AWS Console → Lambda
2. **Functions**: Click "Functions" in left sidebar
3. **Find Database Service**: Look for function with "database" in the name
4. **Copy Function Name**: It's in the function list

Or we can list all functions:
```bash
aws lambda list-functions --region us-east-1 --query 'Functions[?contains(FunctionName, `database`)].FunctionName'
```

---

## 🔧 Available Scripts

All scripts are in the `scripts/` directory:

### Setup
- ✅ `install-aws-cli.sh` - Install AWS CLI
- ✅ `setup-aws-credentials.sh` - Interactive credential setup

### Verification  
- ✅ `verify-tables-aws.sh` - **Main verification script** ⭐
- ✅ `verify-itinerary-tables-aws.js` - Alternative (Node.js)

### Migration (Coming Soon)
- 🔄 `migrate-tables-aws.sh` - Run database migrations

---

## 🎬 Let's Start!

**Tell me when you're ready and I'll help you:**

1. Install AWS CLI
2. Configure credentials
3. Run the verification
4. Set up any missing tables

**Or if you prefer to do it yourself:**

```bash
# 1. Install AWS CLI
python3 -m pip install --user awscli
export PATH="$HOME/Library/Python/3.9/bin:$PATH"

# 2. Configure (you'll enter credentials)
aws configure

# 3. Set environment
export DATABASE_LAMBDA_NAME=travel-app-database-service
export AWS_REGION=us-east-1

# 4. Verify
./scripts/verify-tables-aws.sh
```

---

## 📚 Documentation

- `README_AWS_SETUP.md` - Complete setup guide
- `AWS_CREDENTIALS_SETUP.md` - Credentials details
- `QUICK_START_AWS_SETUP.md` - Quick reference
- `INSTALL_AWS_CLI.md` - Installation options

---

## ⚠️ Security Notes

- **Never commit credentials to git**
- **Don't share credentials in chat** (use secure methods)
- **Rotate credentials regularly**
- **Use IAM roles when possible** (for production)

---

**Ready?** Let me know when you have your AWS credentials and we'll proceed! 🚀

