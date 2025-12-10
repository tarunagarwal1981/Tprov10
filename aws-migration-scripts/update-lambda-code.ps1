# Update Lambda Function Code
# This script uploads the updated Lambda package

$ErrorActionPreference = "Stop"

$REGION = "us-east-1"
$LAMBDA_NAME = "travel-app-database-service"
$LAMBDA_ZIP = "lambda/database-service/function.zip"

Write-Host "=== Updating Lambda Function Code ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $LAMBDA_ZIP)) {
    Write-Host "[ERROR] Lambda package not found: $LAMBDA_ZIP" -ForegroundColor Red
    exit 1
}

$zipPath = (Resolve-Path $LAMBDA_ZIP).Path
$zipSize = (Get-Item $zipPath).Length / 1MB

Write-Host "Uploading Lambda package..." -ForegroundColor Yellow
Write-Host "   Package: $zipPath" -ForegroundColor Gray
Write-Host "   Size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Gray
Write-Host ""

try {
    & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" lambda update-function-code `
        --function-name $LAMBDA_NAME `
        --zip-file "fileb://$zipPath" `
        --region $REGION | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Lambda function code updated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Wait 10-20 seconds for update to propagate" -ForegroundColor White
        Write-Host "2. Test Lambda again with: {`"action`":`"test`"}" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "[ERROR] Failed to update Lambda function" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Failed to update Lambda: $_" -ForegroundColor Red
    exit 1
}

