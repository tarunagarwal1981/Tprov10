# Remove Force Change Password Requirement
# This script sets a permanent password, removing the force change requirement
# Usage: .\remove-force-change-password.ps1 agent@gmail.com YourNewPassword123!

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password
)

$UserPoolId = "us-east-1_oF5qfa2IX"

Write-Host "🔐 Removing Force Change Password Requirement" -ForegroundColor Cyan
Write-Host "User: $Email" -ForegroundColor White
Write-Host ""

# Check if AWS CLI is available
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI is not installed" -ForegroundColor Red
    exit 1
}

# First, check user status
Write-Host "🔍 Checking user status..." -ForegroundColor Yellow
$userInfo = aws cognito-idp admin-get-user `
    --user-pool-id $UserPoolId `
    --username $Email `
    --output json | ConvertFrom-Json

if ($userInfo) {
    Write-Host "   Current Status: $($userInfo.UserStatus)" -ForegroundColor Gray
    Write-Host ""
}

# Set permanent password (this removes force change requirement)
Write-Host "🔐 Setting permanent password..." -ForegroundColor Yellow
aws cognito-idp admin-set-user-password `
    --user-pool-id $UserPoolId `
    --username $Email `
    --password $Password `
    --permanent

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Password set as permanent!" -ForegroundColor Green
    Write-Host "   Force change password requirement removed" -ForegroundColor Green
    Write-Host ""
    
    # Verify status
    Write-Host "🔍 Verifying new status..." -ForegroundColor Yellow
    $updatedUser = aws cognito-idp admin-get-user `
        --user-pool-id $UserPoolId `
        --username $Email `
        --output json | ConvertFrom-Json
    
    Write-Host "   New Status: $($updatedUser.UserStatus)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "✅ User can now login without being forced to change password!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Login credentials:" -ForegroundColor Cyan
    Write-Host "  Email: $Email" -ForegroundColor White
    Write-Host "  Password: $Password" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Failed to set password" -ForegroundColor Red
    Write-Host "Check the error message above" -ForegroundColor Yellow
}

