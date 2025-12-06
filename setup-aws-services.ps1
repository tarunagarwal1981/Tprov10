# AWS Services Setup Script
# Sets up SNS (SMS), SES (Email), and S3 (Documents) for OTP Authentication

$ErrorActionPreference = "Stop"
$region = "us-east-1"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AWS Services Setup for OTP Authentication" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 1. AWS SNS (SMS) Setup
# ============================================================================
Write-Host "1. Setting up AWS SNS (SMS)..." -ForegroundColor Yellow
Write-Host ""

# Check current SMS attributes
Write-Host "Checking current SNS SMS configuration..." -ForegroundColor Gray
$smsAttrs = aws sns get-sms-attributes --region $region 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Current SMS attributes:" -ForegroundColor Gray
    Write-Host $smsAttrs
} else {
    Write-Host "No existing SMS attributes found." -ForegroundColor Gray
}

# Set default sender ID
Write-Host ""
Write-Host "Setting default sender ID to TRAVCLAN..." -ForegroundColor Green
aws sns set-sms-attributes --attributes DefaultSenderID=TRAVCLAN --region $region

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Sender ID set successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to set sender ID" -ForegroundColor Red
}

# Check account attributes (to see if in sandbox)
Write-Host ""
Write-Host "Checking account status..." -ForegroundColor Gray
$accountAttrs = aws sns get-sms-attributes --attribute-names MonthlySpendLimit --region $region 2>&1
Write-Host $accountAttrs

Write-Host ""
Write-Host "NOTE: If you are in sandbox mode, you need to request production access:" -ForegroundColor Yellow
Write-Host "  - Go to: https://console.aws.amazon.com/sns/v3/home?region=$region#/text-messaging/account" -ForegroundColor Cyan
Write-Host "  - Click Request production access" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 2. AWS SES (Email) Setup
# ============================================================================
Write-Host "2. Setting up AWS SES (Email)..." -ForegroundColor Yellow
Write-Host ""

# Check account sending status
Write-Host "Checking SES account status..." -ForegroundColor Gray
$sesStatus = aws ses get-account-sending-enabled --region $region 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host $sesStatus
    $enabled = ($sesStatus | ConvertFrom-Json).Enabled
    if ($enabled) {
        Write-Host "[OK] SES sending is enabled" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] SES sending is disabled (sandbox mode)" -ForegroundColor Yellow
        Write-Host "  Request production access at: https://console.aws.amazon.com/ses/home?region=$region#/account" -ForegroundColor Cyan
    }
} else {
    Write-Host "Could not check SES status" -ForegroundColor Red
}

# List verified identities
Write-Host ""
Write-Host "Checking verified email addresses/domains..." -ForegroundColor Gray
$identities = aws ses list-identities --region $region 2>&1
if ($LASTEXITCODE -eq 0) {
    $identityList = ($identities | ConvertFrom-Json).Identities
    if ($identityList.Count -eq 0) {
        Write-Host "[WARNING] No verified identities found" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To verify an email address, run:" -ForegroundColor Cyan
        Write-Host "  aws ses verify-email-identity --email-address noreply@yourdomain.com --region $region" -ForegroundColor White
        Write-Host ""
        Write-Host "Or verify a domain via AWS Console:" -ForegroundColor Cyan
        Write-Host "  https://console.aws.amazon.com/ses/home?region=$region#/verified-identities" -ForegroundColor White
    } else {
        Write-Host "Verified identities:" -ForegroundColor Green
        foreach ($identity in $identityList) {
            Write-Host "  - $identity" -ForegroundColor Green
        }
    }
} else {
    Write-Host "Could not list identities" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# 3. AWS S3 (Document Storage) Setup
# ============================================================================
Write-Host "3. Setting up AWS S3 (Document Storage)..." -ForegroundColor Yellow
Write-Host ""

$bucketName = "travclan-documents"

# Check if bucket exists
Write-Host "Checking if bucket $bucketName exists..." -ForegroundColor Gray
$bucketExists = aws s3 ls "s3://$bucketName" --region $region 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Bucket $bucketName already exists" -ForegroundColor Green
} else {
    Write-Host "Bucket does not exist. Creating..." -ForegroundColor Yellow
    
    # Create bucket
    Write-Host "Creating bucket $bucketName..." -ForegroundColor Green
    aws s3api create-bucket --bucket $bucketName --region $region --create-bucket-configuration LocationConstraint=$region 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        # Try without LocationConstraint for us-east-1
        Write-Host "Retrying without LocationConstraint..." -ForegroundColor Gray
        aws s3api create-bucket --bucket $bucketName --region $region 2>&1 | Out-Null
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Bucket created successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to create bucket" -ForegroundColor Red
        Write-Host "  Error: $($bucketExists)" -ForegroundColor Red
    }
}

# Enable versioning
Write-Host ""
Write-Host "Enabling versioning on bucket..." -ForegroundColor Green
aws s3api put-bucket-versioning --bucket $bucketName --versioning-configuration Status=Enabled --region $region 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Versioning enabled" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Could not enable versioning" -ForegroundColor Yellow
}

# Configure CORS
Write-Host ""
Write-Host "Configuring CORS..." -ForegroundColor Green

$corsConfig = @'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "http://localhost:3000",
        "https://*.amplifyapp.com",
        "https://*.netlify.app"
      ],
      "ExposeHeaders": ["ETag", "x-amz-server-side-encryption"],
      "MaxAgeSeconds": 3000
    }
  ]
}
'@

$corsFile = "cors-config.json"
$corsConfig | Out-File -FilePath $corsFile -Encoding UTF8 -NoNewline

aws s3api put-bucket-cors --bucket $bucketName --cors-configuration file://$corsFile --region $region 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] CORS configured successfully" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Could not configure CORS" -ForegroundColor Yellow
    Write-Host "  You may need to configure it manually in the AWS Console" -ForegroundColor Yellow
}

# Clean up temp file
Remove-Item $corsFile -ErrorAction SilentlyContinue

# Block public access (should be enabled by default)
Write-Host ""
Write-Host "Ensuring public access is blocked..." -ForegroundColor Green
$publicAccessConfig = @'
{
  "BlockPublicAcls": true,
  "IgnorePublicAcls": true,
  "BlockPublicPolicy": true,
  "RestrictPublicBuckets": true
}
'@

$publicAccessFile = "public-access-config.json"
$publicAccessConfig | Out-File -FilePath $publicAccessFile -Encoding UTF8 -NoNewline

aws s3api put-public-access-block --bucket $bucketName --public-access-block-configuration file://$publicAccessFile --region $region 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Public access blocked" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Could not configure public access block" -ForegroundColor Yellow
}

Remove-Item $publicAccessFile -ErrorAction SilentlyContinue

# ============================================================================
# Summary
# ============================================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[OK] SNS (SMS):" -ForegroundColor Green
Write-Host "  - Sender ID: TRAVCLAN" -ForegroundColor Gray
Write-Host "  - Action needed: Request production access if in sandbox" -ForegroundColor Yellow
Write-Host ""

Write-Host "[OK] SES (Email):" -ForegroundColor Green
Write-Host "  - Action needed: Verify email address or domain" -ForegroundColor Yellow
Write-Host "  - Action needed: Request production access if in sandbox" -ForegroundColor Yellow
Write-Host ""

Write-Host "[OK] S3 (Documents):" -ForegroundColor Green
Write-Host "  - Bucket: $bucketName" -ForegroundColor Gray
Write-Host "  - Versioning: Enabled" -ForegroundColor Gray
Write-Host "  - CORS: Configured" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Verify SES email/domain:" -ForegroundColor Yellow
Write-Host "   aws ses verify-email-identity --email-address noreply@yourdomain.com --region $region" -ForegroundColor White
Write-Host ""
Write-Host "2. Request production access for SNS and SES (if needed):" -ForegroundColor Yellow
Write-Host "   - SNS: https://console.aws.amazon.com/sns/v3/home?region=$region#/text-messaging/account" -ForegroundColor White
Write-Host "   - SES: https://console.aws.amazon.com/ses/home?region=$region#/account" -ForegroundColor White
Write-Host ""
Write-Host "3. Update your .env.local with:" -ForegroundColor Yellow
Write-Host "   SMS_SENDER_ID=TRAVCLAN" -ForegroundColor White
Write-Host "   SES_FROM_EMAIL=noreply@yourdomain.com" -ForegroundColor White
Write-Host "   SES_FROM_NAME=TravClan" -ForegroundColor White
Write-Host "   S3_DOCUMENTS_BUCKET=$bucketName" -ForegroundColor White
Write-Host ""
