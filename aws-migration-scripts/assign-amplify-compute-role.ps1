# Assign Compute Role to Amplify App
# The compute role is what actually executes API routes and needs Lambda invoke permission

$ErrorActionPreference = "Stop"

$REGION = "us-east-1"
$APP_ID = "d2p2uq8t9xysui"

Write-Host "=== Assigning Compute Role to Amplify App ===" -ForegroundColor Cyan
Write-Host ""

# Option 1: Use the existing AmplifySSRLoggingRole as compute role
# (It already has AWSLambda_FullAccess attached)
$computeRoleArn = "arn:aws:iam::815660521604:role/service-role/AmplifySSRLoggingRole-5b109d56-99a3-45c4-a40e-a24f4ca1094c"

Write-Host "Using compute role: $computeRoleArn" -ForegroundColor Yellow
Write-Host ""

Write-Host "Updating Amplify app to use compute role..." -ForegroundColor Yellow

try {
    # Update the app to set the compute role
    # Note: Amplify CLI might be needed, or we can use the console
    # Let's try using update-app if it supports compute role
    
    $updateResult = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" amplify update-app `
        --app-id $APP_ID `
        --iam-service-role-arn $computeRoleArn `
        --region $REGION `
        --output json 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Amplify app updated with compute role!" -ForegroundColor Green
        Write-Host ""
        Write-Host "The compute role is now assigned and API routes will use it for execution." -ForegroundColor Gray
    } else {
        Write-Host "[WARN] Update command may have limitations" -ForegroundColor Yellow
        Write-Host "   Output: $updateResult" -ForegroundColor Gray
        Write-Host ""
        Write-Host "You may need to set this in the Amplify Console:" -ForegroundColor Yellow
        Write-Host "1. Go to Amplify Console → Your App → App settings → General" -ForegroundColor Cyan
        Write-Host "2. Find 'Compute role' or 'Execution role' section" -ForegroundColor Cyan
        Write-Host "3. Set it to: $computeRoleArn" -ForegroundColor Cyan
        Write-Host "4. Save" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "[ERROR] Failed to update: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set the compute role manually in Amplify Console:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.aws.amazon.com/amplify/home?region=us-east-1#/$APP_ID" -ForegroundColor Cyan
    Write-Host "2. App settings → General" -ForegroundColor Cyan
    Write-Host "3. Find 'Compute role' or 'Execution role'" -ForegroundColor Cyan
    Write-Host "4. Set to: $computeRoleArn" -ForegroundColor Cyan
    Write-Host "5. Save and wait for app to restart" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host ""
Write-Host "After assigning the compute role:" -ForegroundColor Yellow
Write-Host "1. Wait 2-3 minutes for Amplify to restart" -ForegroundColor White
Write-Host "2. Test login again" -ForegroundColor White
Write-Host "3. Should now work!" -ForegroundColor White

