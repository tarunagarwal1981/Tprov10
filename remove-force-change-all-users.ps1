# Remove Force Change Password Requirement for ALL Users
# This script finds all users with FORCE_CHANGE_PASSWORD status and sets permanent passwords

$UserPoolId = "us-east-1_oF5qfa2IX"

Write-Host "=== Remove Force Change Password for All Users ===" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is available
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "AWS CLI is not installed" -ForegroundColor Red
    exit 1
}

# Function to generate a secure random password
function Generate-SecurePassword {
    $length = 12
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    $password = ""
    for ($i = 0; $i -lt $length; $i++) {
        $password += $chars[(Get-Random -Maximum $chars.Length)]
    }
    return $password
}

# Get all users
Write-Host "Fetching all users from Cognito..." -ForegroundColor Yellow
$allUsers = @()
$paginationToken = $null

do {
    $cmd = "aws cognito-idp list-users --user-pool-id $UserPoolId --output json"
    
    if ($paginationToken) {
        $cmd += " --pagination-token `"$paginationToken`""
    }
    
    $response = Invoke-Expression $cmd | ConvertFrom-Json
    
    if ($response.Users) {
        $allUsers += $response.Users
    }
    
    $paginationToken = $response.PaginationToken
} while ($paginationToken)

Write-Host "Found $($allUsers.Count) users" -ForegroundColor Green
Write-Host ""

# Filter users with FORCE_CHANGE_PASSWORD status
$usersToFix = $allUsers | Where-Object { $_.UserStatus -eq "FORCE_CHANGE_PASSWORD" }

if ($usersToFix.Count -eq 0) {
    Write-Host "No users with FORCE_CHANGE_PASSWORD status found!" -ForegroundColor Green
    Write-Host "All users are already set up correctly." -ForegroundColor Gray
    exit 0
}

Write-Host "Found $($usersToFix.Count) users with FORCE_CHANGE_PASSWORD status:" -ForegroundColor Yellow
$usersToFix | ForEach-Object {
    $username = $_.Username
    $email = ($_.Attributes | Where-Object { $_.Name -eq "email" }).Value
    Write-Host "  - $username ($email)" -ForegroundColor Gray
}
Write-Host ""

# Ask for confirmation
$confirm = Read-Host "Do you want to set permanent passwords for these users? (yes/no)"
if ($confirm -ne "yes" -and $confirm -ne "y") {
    Write-Host "Operation cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Setting permanent passwords..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0
$passwords = @{}

foreach ($user in $usersToFix) {
    $username = $user.Username
    $email = ($user.Attributes | Where-Object { $_.Name -eq "email" }).Value
    
    if (-not $email) {
        $email = $username
    }
    
    Write-Host "Processing: $username ($email)..." -ForegroundColor Cyan
    
    # Generate a secure password
    $newPassword = Generate-SecurePassword
    $passwords[$email] = $newPassword
    
    # Set permanent password
    $passwordEscaped = $newPassword -replace '"', '\"'
    $cmd = "aws cognito-idp admin-set-user-password --user-pool-id $UserPoolId --username `"$username`" --password `"$passwordEscaped`" --permanent"
    $result = Invoke-Expression $cmd 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Password set as permanent" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  Failed: $result" -ForegroundColor Red
        $failCount++
        $passwords.Remove($email)
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Successfully updated: $successCount users" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "Failed: $failCount users" -ForegroundColor Red
}
Write-Host ""

# Save passwords to file
if ($successCount -gt 0) {
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $passwordFile = "cognito-passwords-$timestamp.txt"
    
    $passwords.GetEnumerator() | ForEach-Object {
        "$($_.Key): $($_.Value)"
    } | Out-File -FilePath $passwordFile -Encoding utf8
    
    Write-Host "Passwords saved to: $passwordFile" -ForegroundColor Yellow
    Write-Host "Keep this file secure and share passwords with users!" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "All users updated!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Share passwords with users (from password file)" -ForegroundColor White
Write-Host "  2. Users can now login without being forced to change password" -ForegroundColor White
Write-Host "  3. Users can change their password after login if desired" -ForegroundColor White
