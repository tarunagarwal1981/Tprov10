# Grant Lambda Invoke Permission to Amplify
# This script adds permission for Amplify to invoke the database Lambda

$ErrorActionPreference = "Stop"

$REGION = "us-east-1"
$LAMBDA_NAME = "travel-app-database-service"

Write-Host "=== Granting Lambda Invoke Permission to Amplify ===" -ForegroundColor Cyan
Write-Host ""

# Get Amplify app ID (you'll need to provide this)
Write-Host "Please provide your Amplify App ID:" -ForegroundColor Yellow
Write-Host "You can find it in the Amplify Console URL or run:" -ForegroundColor Gray
Write-Host "  aws amplify list-apps --query 'apps[].{Name:name,AppId:appId}' --output table" -ForegroundColor Gray
Write-Host ""

$appId = Read-Host "Amplify App ID"

if (-not $appId) {
    Write-Host "[ERROR] App ID is required" -ForegroundColor Red
    exit 1
}

Write-Host "Getting Amplify app details..." -ForegroundColor Yellow

try {
    $appDetails = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" amplify get-app `
        --app-id $appId `
        --region $REGION `
        --output json | ConvertFrom-Json
    
    $serviceRoleArn = $appDetails.app.serviceRoleArn
    
    if (-not $serviceRoleArn) {
        Write-Host "[ERROR] Could not find Amplify service role" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   Amplify App: $($appDetails.app.name)" -ForegroundColor Gray
    Write-Host "   Service Role: $serviceRoleArn" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Adding Lambda invoke permission..." -ForegroundColor Yellow
    
    # Add permission
    & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" lambda add-permission `
        --function-name $LAMBDA_NAME `
        --statement-id "amplify-invoke-$appId" `
        --action "lambda:InvokeFunction" `
        --principal $serviceRoleArn `
        --region $REGION 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Lambda invoke permission granted!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Amplify can now invoke the Lambda function." -ForegroundColor Gray
    } else {
        Write-Host "[WARN] Permission may already exist (this is OK)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "[ERROR] Failed to grant permission: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "You can also do this manually:" -ForegroundColor Yellow
    Write-Host "1. Go to Lambda Console: https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/$LAMBDA_NAME" -ForegroundColor Cyan
    Write-Host "2. Configuration → Permissions → Resource-based policy" -ForegroundColor Cyan
    Write-Host "3. Add permission for: $serviceRoleArn" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green

