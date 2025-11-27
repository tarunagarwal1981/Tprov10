# Create IAM Role for Database Lambda
# This script creates the IAM role separately to avoid issues

$ErrorActionPreference = "Stop"

$ROLE_NAME = "travel-app-database-lambda-role"
$REGION = "us-east-1"
$SECRET_NAME = "travel-app/dev/secrets"

Write-Host "=== Creating IAM Role for Database Lambda ===" -ForegroundColor Cyan
Write-Host ""

# Create trust policy file
$trustPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Principal = @{
                Service = "lambda.amazonaws.com"
            }
            Action = "sts:AssumeRole"
        }
    )
} | ConvertTo-Json -Depth 10

$trustPolicy | Out-File -FilePath "trust-policy.json" -Encoding utf8

Write-Host "Step 1: Creating IAM role..." -ForegroundColor Yellow

try {
    # Check if role exists
    $existing = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" iam get-role --role-name $ROLE_NAME 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Role already exists" -ForegroundColor Green
    } else {
        Write-Host "   Creating role..." -ForegroundColor Gray
        & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" iam create-role `
            --role-name $ROLE_NAME `
            --assume-role-policy-document file://trust-policy.json
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Failed to create role" -ForegroundColor Red
            Write-Host ""
            Write-Host "Please create the role manually via AWS Console:" -ForegroundColor Yellow
            Write-Host "1. Go to: https://console.aws.amazon.com/iam/" -ForegroundColor Cyan
            Write-Host "2. Roles → Create role" -ForegroundColor Cyan
            Write-Host "3. AWS service → Lambda" -ForegroundColor Cyan
            Write-Host "4. Attach: AWSLambdaVPCAccessExecutionRole" -ForegroundColor Cyan
            Write-Host "5. Role name: $ROLE_NAME" -ForegroundColor Cyan
            exit 1
        }
        
        Start-Sleep -Seconds 3
        Write-Host "[OK] Role created" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Attaching policies..." -ForegroundColor Yellow

# Attach VPC execution role
& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" iam attach-role-policy `
    --role-name $ROLE_NAME `
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole" 2>&1 | Out-Null

# Create Secrets Manager inline policy
$secretsPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Action = @(
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            )
            Resource = "arn:aws:secretsmanager:$REGION`:*:secret:$SECRET_NAME-*"
        }
    )
} | ConvertTo-Json -Depth 10

$secretsPolicy | Out-File -FilePath "secrets-policy.json" -Encoding utf8

& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" iam put-role-policy `
    --role-name $ROLE_NAME `
    --policy-name SecretsManagerAccess `
    --policy-document file://secrets-policy.json 2>&1 | Out-Null

Write-Host "[OK] Policies attached" -ForegroundColor Green

# Get role ARN
$roleArn = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" iam get-role --role-name $ROLE_NAME --query "Role.Arn" --output text
Write-Host ""
Write-Host "[OK] Role ARN: $roleArn" -ForegroundColor Green
Write-Host ""

# Save for deployment script
$roleArn | Out-File -FilePath "role-arn.txt" -Encoding utf8 -NoNewline

# Cleanup
Remove-Item "trust-policy.json", "secrets-policy.json" -ErrorAction SilentlyContinue

Write-Host "=== IAM Role Setup Complete ===" -ForegroundColor Green

