# AWS Migration - Workflow & Terminal Guide

## 🖥️ Where to Run Commands

### ✅ **Use Current Cursor Project Terminal**

**All commands should be run in your current Cursor project terminal** (`C:\Users\train\.cursor\Tprov10`). Here's why:

1. ✅ Migration scripts are in this project (`aws-migration-scripts/`)
2. ✅ Code utilities are in this project (`src/lib/aws/`)
3. ✅ Environment variables (`.env.local`) are in this project
4. ✅ SQL export files will be created here
5. ✅ Easier to manage everything in one place

---

## 📋 Recommended Workflow

### **Option 1: Single Terminal (Recommended)**

Use **one terminal** in your current Cursor project for everything:

```bash
# Your current project directory
C:\Users\train\.cursor\Tprov10
```

**Advantages:**
- ✅ All files in one place
- ✅ Environment variables accessible
- ✅ Easy to navigate
- ✅ Scripts can access project files directly

### **Option 2: Two Terminals (Optional)**

If you prefer separation:

1. **Terminal 1 (Current Project)**: For migration scripts and code
   ```bash
   cd C:\Users\train\.cursor\Tprov10
   # Run: npm commands, migration scripts, code changes
   ```

2. **Terminal 2 (Any Location)**: For AWS CLI commands only
   ```bash
   # Can be anywhere
   # Run: aws configure, aws rds commands, etc.
   ```

**When to use Option 2:**
- If you want to keep AWS CLI separate
- If you're running long-running AWS operations
- Personal preference

---

## 🚀 Step-by-Step Terminal Usage

### **Prerequisites: Install AWS CLI First**

**⚠️ IMPORTANT:** Before running any AWS commands, you need to install AWS CLI.

**Quick Install (Windows):**
```powershell
# Option 1: Using winget (Windows 10/11)
winget install Amazon.AWSCLI

# Option 2: Download MSI installer
# Go to: https://awscli.amazonaws.com/AWSCLIV2.msi
```

**After installation:**
1. **Close and reopen your Cursor terminal** (so it picks up the new PATH)
2. Verify: `aws --version`
3. Configure: `aws configure`

**📖 Full installation guide:** See `AWS_CLI_INSTALLATION_WINDOWS.md`

---

### **Phase 1: AWS Setup**

**Terminal:** Current Cursor project (or any terminal for AWS CLI)

```bash
# In your current project terminal
cd C:\Users\train\.cursor\Tprov10

# Configure AWS CLI (one-time setup)
# ⚠️ Make sure AWS CLI is installed first!
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Output (json)

# Test AWS connection
aws sts get-caller-identity
```

### **Phase 2: Database Migration**

**Terminal:** Current Cursor project

```bash
# In your current project terminal
cd C:\Users\train\.cursor\Tprov10

# Export Supabase schema
pg_dump --host=[SUPABASE_HOST] \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --schema-only \
  --no-owner \
  --no-acl \
  --file=supabase_schema.sql

# Export Supabase data
pg_dump --host=[SUPABASE_HOST] \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --data-only \
  --no-owner \
  --no-acl \
  --file=supabase_data.sql

# Import to RDS (after RDS is created)
psql --host=[RDS_ENDPOINT] \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --file=supabase_schema.sql
```

**Note:** SQL files (`supabase_schema.sql`, `supabase_data.sql`) will be created in your project root.

### **Phase 3: User Migration**

**Terminal:** Current Cursor project

```bash
# In your current project terminal
cd C:\Users\train\.cursor\Tprov10

# Set environment variables
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
$env:COGNITO_USER_POOL_ID="us-east-1_xxxxx"
$env:COGNITO_CLIENT_ID="xxxxx"
$env:AWS_REGION="us-east-1"

# Run migration script
npx ts-node aws-migration-scripts/migrate-users.ts
```

### **Phase 4: Storage Migration**

**Terminal:** Current Cursor project

```bash
# In your current project terminal
cd C:\Users\train\.cursor\Tprov10

# Set environment variables
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
$env:S3_BUCKET_NAME="travel-app-storage-xxx"
$env:AWS_REGION="us-east-1"

# Run migration script
npx ts-node aws-migration-scripts/migrate-storage.ts
```

### **Phase 5: Code Development**

**Terminal:** Current Cursor project

```bash
# In your current project terminal
cd C:\Users\train\.cursor\Tprov10

# Install dependencies
npm install

# Run development server
npm run dev

# Build project
npm run build

# Type check
npm run type-check
```

---

## 🔧 Environment Variables Setup

### **Windows PowerShell (Recommended)**

Create a `.env.local` file in your project root:

```bash
# .env.local (in project root)
RDS_HOSTNAME=xxx.rds.amazonaws.com
RDS_PORT=5432
RDS_DATABASE=postgres
RDS_USERNAME=postgres
RDS_PASSWORD=your_password

COGNITO_USER_POOL_ID=us-east-1_xxxxx
COGNITO_CLIENT_ID=xxxxx
AWS_REGION=us-east-1

S3_BUCKET_NAME=travel-app-storage-xxx
CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net

# Keep Supabase for migration scripts
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **Or Set in Terminal (Temporary)**

For one-time commands, set in PowerShell:

```powershell
# PowerShell syntax
$env:VARIABLE_NAME="value"

# Example
$env:RDS_HOSTNAME="xxx.rds.amazonaws.com"
$env:COGNITO_USER_POOL_ID="us-east-1_xxxxx"
```

---

## 📁 File Organization

All migration-related files will be in your project:

```
C:\Users\train\.cursor\Tprov10\
├── aws-migration-scripts/          # Migration scripts
│   ├── migrate-users.ts
│   ├── migrate-storage.ts
│   └── README.md
├── src/lib/aws/                    # AWS utilities
│   ├── database.ts
│   ├── cognito.ts
│   └── s3-upload.ts
├── supabase_schema.sql             # Exported schema (created during migration)
├── supabase_data.sql               # Exported data (created during migration)
├── .env.local                       # Environment variables
└── AWS_MIGRATION_*.md              # Documentation
```

---

## 💡 Pro Tips

### **1. Use PowerShell Profile (Optional)**

Create a function in your PowerShell profile for quick environment setup:

```powershell
# Add to: C:\Users\train\Documents\PowerShell\Microsoft.PowerShell_profile.ps1
function Set-AWSMigrationEnv {
    $env:SUPABASE_URL="https://your-project.supabase.co"
    $env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
    $env:COGNITO_USER_POOL_ID="us-east-1_xxxxx"
    $env:COGNITO_CLIENT_ID="xxxxx"
    $env:AWS_REGION="us-east-1"
    $env:S3_BUCKET_NAME="travel-app-storage-xxx"
    Write-Host "✅ AWS Migration environment variables set"
}

# Then just run:
Set-AWSMigrationEnv
```

### **2. Use VS Code/Cursor Integrated Terminal**

- Press `` Ctrl+` `` to open terminal
- Terminal opens in project root automatically
- Can split terminal if needed (`` Ctrl+Shift+` ``)

### **3. Keep Terminal History**

All commands are saved in terminal history. Use:
- `↑` / `↓` to navigate previous commands
- `Ctrl+R` to search command history

### **4. Run Long Commands in Background**

For long-running operations:

```powershell
# Start job
Start-Job -ScriptBlock { npx ts-node aws-migration-scripts/migrate-storage.ts }

# Check status
Get-Job

# Get output
Receive-Job -Id 1
```

---

## ✅ Quick Checklist

- [ ] **Install AWS CLI** (see `AWS_CLI_INSTALLATION_WINDOWS.md`)
- [ ] Use current Cursor project terminal
- [ ] Create `.env.local` file for environment variables
- [ ] Install dependencies: `npm install`
- [ ] Configure AWS CLI: `aws configure`
- [ ] Test AWS connection: `aws sts get-caller-identity`
- [ ] Ready to run migration scripts

---

## 🚨 Common Issues

### **Issue: "Command not found"**
**Solution:** Make sure you're in the project directory:
```bash
cd C:\Users\train\.cursor\Tprov10
```

### **Issue: "Environment variable not set"**
**Solution:** Set variables in `.env.local` or in terminal:
```powershell
$env:VARIABLE_NAME="value"
```

### **Issue: "AWS credentials not found"**
**Solution:** Configure AWS CLI:
```bash
aws configure
```

### **Issue: "ts-node not found"**
**Solution:** Install dependencies:
```bash
npm install
```

---

## 📞 Summary

**✅ Use your current Cursor project terminal for everything!**

- All scripts are in this project
- All code is in this project
- All files will be created here
- Environment variables are here
- One terminal, one project, simple workflow

**Just open the terminal in Cursor (`` Ctrl+` ``) and you're ready to go!** 🚀

