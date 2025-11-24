# Set Password Directly in Cognito (No Email Sent)
# This sets the password directly without sending an email to the user
# Usage: .\set-password-direct.ps1 agent@gmail.com NewPassword123!

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password
)

$UserPoolId = "us-east-1_oF5qfa2IX"

Write-Host "=== Set Password Directly (No Email) ===" -ForegroundColor Cyan
Write-Host "User: $Email" -ForegroundColor White
Write-Host ""

# Check if AWS CLI is available
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI is not installed" -ForegroundColor Red
    Write-Host "Using TypeScript script instead..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run: npx ts-node aws-migration-scripts/set-password-direct.ts $Email `"$Password`"" -ForegroundColor Cyan
    exit 1
}

# Set password directly (no email sent)
Write-Host "🔐 Setting password directly..." -ForegroundColor Yellow
aws cognito-idp admin-set-user-password `
    --user-pool-id $UserPoolId `
    --username $Email `
    --password $Password `
    --permanent

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Password set successfully!" -ForegroundColor Green
    Write-Host "   No email was sent to the user" -ForegroundColor Gray
    Write-Host ""
    Write-Host "User can now login with:" -ForegroundColor Cyan
    Write-Host "  Email: $Email" -ForegroundColor White
    Write-Host "  Password: $Password" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Share the password with the user securely!" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Failed to set password" -ForegroundColor Red
    Write-Host "Check the error message above" -ForegroundColor Yellow
}

