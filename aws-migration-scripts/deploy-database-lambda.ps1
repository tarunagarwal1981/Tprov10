# Deploy Database Service Lambda
# This Lambda runs in the same VPC as RDS for direct database access

$ErrorActionPreference = "Stop"

$REGION = "us-east-1"
$LAMBDA_NAME = "travel-app-database-service"
$ROLE_NAME = "travel-app-database-lambda-role"
$VPC_ID = "vpc-035de28e2067ea386"
$SUBNET_1 = "subnet-03492171db95e0412"
$SUBNET_2 = "subnet-0a9c5d406940f11d2"
$SECURITY_GROUP_ID = "sg-0351956ce61a8d1f1" # RDS security group
$SECRET_NAME = "travel-app/dev/secrets"

Write-Host "=== Deploying Database Service Lambda ===" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# STEP 1: Create IAM Role for Lambda
# ============================================================
Write-Host "Step 1: Creating IAM role..." -ForegroundColor Yellow

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
} | ConvertTo-Json -Compress

$trustPolicy | Out-File -FilePath "lambda-trust-policy.json" -Encoding utf8 -NoNewline

# Try to get role, if it fails, prompt user to create manually
Write-Host "Checking for IAM role..." -ForegroundColor Yellow
$roleCheck = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" iam get-role --role-name $ROLE_NAME --query "Role.Arn" --output text 2>&1

if ($LASTEXITCODE -eq 0 -and $roleCheck) {
    $roleArn = $roleCheck
    Write-Host "[OK] IAM role found: $roleArn" -ForegroundColor Green
} else {
    Write-Host "[WARN] IAM role not found or IAM access issue" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please create the IAM role manually:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://console.aws.amazon.com/iam/home#/roles" -ForegroundColor White
    Write-Host "2. Create role: $ROLE_NAME" -ForegroundColor White
    Write-Host "3. Trust: Lambda service" -ForegroundColor White
    Write-Host "4. Attach: AWSLambdaVPCAccessExecutionRole" -ForegroundColor White
    Write-Host "5. Add inline policy for Secrets Manager (see LAMBDA_DEPLOY_QUICK.md)" -ForegroundColor White
    Write-Host ""
    Write-Host "Or run: powershell -ExecutionPolicy Bypass -File aws-migration-scripts/create-lambda-role.ps1" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Press Enter after creating the role, or type 'skip' to continue anyway"
    
    if ($continue -ne "skip") {
        $roleArn = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" iam get-role --role-name $ROLE_NAME --query "Role.Arn" --output text
        if (-not $roleArn) {
            Write-Host "[ERROR] Role still not found. Please create it and run this script again." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "[INFO] Skipping IAM role check. Make sure role exists before deploying Lambda." -ForegroundColor Yellow
        $roleArn = "arn:aws:iam::815660521604:role/$ROLE_NAME"
    }
}
Write-Host "   Role ARN: $roleArn" -ForegroundColor Gray
Write-Host ""

# ============================================================
# STEP 2: Build Lambda package (with pg bundled)
# ============================================================
Write-Host "Step 2: Building Lambda package..." -ForegroundColor Yellow

Push-Location "lambda/database-service"

try {
    # Install all dependencies including pg
    Write-Host "   Installing dependencies..." -ForegroundColor Gray
    
    if (Test-Path "node_modules") {
        Remove-Item "node_modules" -Recurse -Force
    }
    
    npm install --omit=dev 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    
    # Install dev dependencies for TypeScript compilation
    npm install --save-dev @types/pg typescript 2>&1 | Out-Null
    
    # Compile TypeScript
    Write-Host "   Compiling TypeScript..." -ForegroundColor Gray
    npx tsc 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "TypeScript compilation failed"
    }
    
    # Create deployment package
    Write-Host "   Creating deployment package..." -ForegroundColor Gray
    if (Test-Path "function.zip") {
        Remove-Item "function.zip" -Force
    }
    
    # Package necessary files (pg is bundled)
    $filesToPackage = @("index.js", "package.json", "node_modules")
    Compress-Archive -Path $filesToPackage -DestinationPath "function.zip" -Force
    
    $zipSize = (Get-Item "function.zip").Length / 1MB
    Write-Host "[OK] Lambda package created ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed to build Lambda package: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

# ============================================================
# STEP 3: Create or Update Lambda Function
# ============================================================
Write-Host "Step 3: Deploying Lambda function..." -ForegroundColor Yellow

$lambdaZipPath = (Resolve-Path "lambda/database-service/function.zip").Path

try {
    # Check if Lambda exists
    $existingLambda = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" lambda get-function `
        --function-name $LAMBDA_NAME `
        --region $REGION 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Updating existing Lambda function..." -ForegroundColor Gray
        & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" lambda update-function-code `
            --function-name $LAMBDA_NAME `
            --zip-file "fileb://$lambdaZipPath" `
            --region $REGION | Out-Null
        
        # Update configuration
        & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" lambda update-function-configuration `
            --function-name $LAMBDA_NAME `
            --timeout 30 `
            --memory-size 512 `
            --vpc-config "SubnetIds=$SUBNET_1,$SUBNET_2,SecurityGroupIds=$SECURITY_GROUP_ID" `
            --environment "Variables={SECRETS_MANAGER_SECRET_NAME=$SECRET_NAME,AWS_REGION=$REGION}" `
            --region $REGION | Out-Null
        
        Write-Host "[OK] Lambda function updated" -ForegroundColor Green
    } else {
        Write-Host "   Creating new Lambda function..." -ForegroundColor Gray
        & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" lambda create-function `
            --function-name $LAMBDA_NAME `
            --runtime "nodejs20.x" `
            --role $roleArn `
            --handler "index.handler" `
            --zip-file "fileb://$lambdaZipPath" `
            --timeout 30 `
            --memory-size 512 `
            --vpc-config "SubnetIds=$SUBNET_1,$SUBNET_2,SecurityGroupIds=$SECURITY_GROUP_ID" `
            --environment "Variables={SECRETS_MANAGER_SECRET_NAME=$SECRET_NAME,AWS_REGION=$REGION}" `
            --region $REGION | Out-Null
        
        Write-Host "[OK] Lambda function created" -ForegroundColor Green
    }
    
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed to deploy Lambda: $_" -ForegroundColor Red
    exit 1
}

# ============================================================
# STEP 4: Test Lambda
# ============================================================
Write-Host "Step 4: Testing Lambda function..." -ForegroundColor Yellow
Write-Host "   (Waiting 15 seconds for VPC configuration to propagate...)" -ForegroundColor Gray
Start-Sleep -Seconds 15

$testPayload = @{
    action = "test"
} | ConvertTo-Json -Compress

$testPayload | Out-File -FilePath "test-payload.json" -Encoding utf8 -NoNewline

try {
    $testResult = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" lambda invoke `
        --function-name $LAMBDA_NAME `
        --payload "file://test-payload.json" `
        --region $REGION `
        --output json `
        response.json
    
    $response = Get-Content "response.json" | ConvertFrom-Json
    
    if ($response.statusCode -eq 200) {
        Write-Host "[OK] Lambda test successful!" -ForegroundColor Green
        Write-Host "   Response: $($response.body)" -ForegroundColor Gray
    } else {
        Write-Host "[WARN] Lambda test returned status $($response.statusCode)" -ForegroundColor Yellow
        Write-Host "   Response: $($response.body)" -ForegroundColor Gray
    }
    
    Remove-Item "test-payload.json", "response.json" -ErrorAction SilentlyContinue
} catch {
    Write-Host "[WARN] Lambda test failed (this is OK if VPC is still configuring): $_" -ForegroundColor Yellow
}

# Cleanup
Remove-Item "lambda-trust-policy.json", "lambda-secrets-policy.json" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "[OK] Database Lambda deployed!" -ForegroundColor Green
Write-Host ""
Write-Host "Lambda Name: $LAMBDA_NAME" -ForegroundColor Gray
Write-Host "Region: $REGION" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update Next.js API routes to call this Lambda"
Write-Host "2. Test the Lambda function"
Write-Host "3. Deploy updated Next.js app"
Write-Host ""

