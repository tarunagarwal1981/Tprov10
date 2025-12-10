# Quick Password Reset Script for Cognito
# Usage: .\reset-password.ps1 agent@gmail.com YourNewPassword123!

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password
)

$UserPoolId = "us-east-1_oF5qfa2IX"

Write-Host "🔐 Resetting password for: $Email" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is available
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI is not installed" -ForegroundColor Red
    Write-Host "Please install AWS CLI first" -ForegroundColor Yellow
    exit 1
}

# Set password using AWS CLI
Write-Host "Setting password..." -ForegroundColor Yellow
aws cognito-idp admin-set-user-password `
    --user-pool-id $UserPoolId `
    --username $Email `
    --password $Password `
    --permanent

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Password reset successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "User can now login with:" -ForegroundColor Cyan
    Write-Host "  Email: $Email" -ForegroundColor White
    Write-Host "  Password: $Password" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Failed to reset password" -ForegroundColor Red
    Write-Host "Check the error message above" -ForegroundColor Yellow
}

