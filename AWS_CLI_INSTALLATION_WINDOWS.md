# AWS CLI Installation Guide for Windows

## 🚀 Quick Installation

### **Option 1: Using MSI Installer (Recommended)**

1. **Download AWS CLI**
   - Go to: https://awscli.amazonaws.com/AWSCLIV2.msi
   - Or search: "AWS CLI Windows MSI installer"

2. **Run the Installer**
   - Double-click `AWSCLIV2.msi`
   - Follow the installation wizard
   - Default installation path: `C:\Program Files\Amazon\AWSCLIV2\`

3. **Verify Installation**
   ```powershell
   aws --version
   ```
   Should show: `aws-cli/2.x.x Python/3.x.x Windows/10 exe/AMD64`

---

### **Option 2: Using winget (Windows Package Manager)**

If you have Windows 10/11 with winget:

```powershell
winget install Amazon.AWSCLI
```

Then verify:
```powershell
aws --version
```

---

### **Option 3: Using Chocolatey**

If you have Chocolatey installed:

```powershell
choco install awscli
```

Then verify:
```powershell
aws --version
```

---

## 🔧 After Installation

### **1. Restart Terminal**

**Important:** Close and reopen your Cursor terminal after installation so it picks up the new PATH.

Or refresh PATH in current terminal:
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

### **2. Verify Installation**

```powershell
aws --version
```

Expected output:
```
aws-cli/2.15.0 Python/3.11.9 Windows/10 exe/AMD64
```

### **3. Configure AWS CLI**

```powershell
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: Get from AWS Console → IAM → Users → Your User → Security Credentials
- **AWS Secret Access Key**: Get when creating access key
- **Default region name**: `us-east-1` (or your preferred region)
- **Default output format**: `json`

---

## 🔑 Getting AWS Credentials

### **Step 1: Create IAM User**

1. Go to AWS Console: https://console.aws.amazon.com/
2. Navigate to: **IAM** → **Users** → **Create User**
3. Username: `migration-user` (or any name)
4. Select: **Provide user access to the AWS Management Console** (optional)
   - Or: **Access key - Programmatic access** (for CLI only)

### **Step 2: Attach Policies**

1. Select: **Attach policies directly**
2. Search and select: **AdministratorAccess** (for migration - you can restrict later)
3. Click **Next** → **Create User**

### **Step 3: Create Access Key**

1. Click on the user you just created
2. Go to **Security credentials** tab
3. Scroll to **Access keys** section
4. Click **Create access key**
5. Select: **Command Line Interface (CLI)**
6. Click **Next** → **Create access key**
7. **IMPORTANT:** Copy both:
   - **Access key ID**
   - **Secret access key** (shown only once!)

### **Step 4: Configure CLI**

```powershell
aws configure
```

Enter:
- Access Key ID: `[paste your access key]`
- Secret Access Key: `[paste your secret key]`
- Default region: `us-east-1`
- Default output format: `json`

---

## ✅ Test Configuration

### **Test 1: Check Your Identity**

```powershell
aws sts get-caller-identity
```

Expected output:
```json
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/migration-user"
}
```

### **Test 2: List S3 Buckets**

```powershell
aws s3 ls
```

Should show your buckets (or empty if none exist).

---

## 🚨 Troubleshooting

### **Issue: "aws: command not found" after installation**

**Solution 1: Restart Terminal**
- Close Cursor completely
- Reopen Cursor
- Open new terminal

**Solution 2: Check PATH**
```powershell
$env:Path -split ';' | Select-String -Pattern 'aws'
```

Should show: `C:\Program Files\Amazon\AWSCLIV2\`

**Solution 3: Add to PATH manually**
```powershell
# Check if AWS CLI is installed
Test-Path "C:\Program Files\Amazon\AWSCLIV2\aws.exe"

# If true, add to PATH
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\Amazon\AWSCLIV2", "User")
```

### **Issue: "Unable to locate credentials"**

**Solution:**
```powershell
# Check if credentials file exists
Test-Path "$env:USERPROFILE\.aws\credentials"

# If false, run configure again
aws configure
```

### **Issue: "Access Denied" errors**

**Solution:**
- Check IAM user has correct permissions
- For migration, use `AdministratorAccess` policy (temporary)
- Can restrict after migration is complete

---

## 📋 Quick Reference

### **Installation Commands**

```powershell
# Option 1: Download MSI from https://awscli.amazonaws.com/AWSCLIV2.msi
# Option 2: Using winget
winget install Amazon.AWSCLI

# Option 3: Using Chocolatey
choco install awscli
```

### **Configuration**

```powershell
# Configure AWS CLI
aws configure

# Test configuration
aws sts get-caller-identity

# List S3 buckets
aws s3 ls

# List RDS instances
aws rds describe-db-instances
```

### **Useful Commands**

```powershell
# Check AWS CLI version
aws --version

# Check current identity
aws sts get-caller-identity

# List all regions
aws ec2 describe-regions

# Check credentials
aws configure list
```

---

## 🎯 Next Steps

After AWS CLI is installed and configured:

1. ✅ Verify: `aws --version`
2. ✅ Configure: `aws configure`
3. ✅ Test: `aws sts get-caller-identity`
4. ✅ Continue with Phase 1 of migration

---

## 📞 Need Help?

- **AWS CLI Documentation**: https://docs.aws.amazon.com/cli/latest/userguide/
- **AWS CLI Installation**: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
- **IAM User Guide**: https://docs.aws.amazon.com/IAM/latest/UserGuide/

---

**Once AWS CLI is installed, you can continue with the migration! 🚀**

