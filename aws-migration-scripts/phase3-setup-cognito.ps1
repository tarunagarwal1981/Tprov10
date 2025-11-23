# Phase 3: Setup Cognito User Pool
# This script creates the Cognito User Pool and App Client

$env:Path += ";C:\Program Files\Amazon\AWSCLIV2"

Write-Host "=== Phase 3: Setting Up Cognito User Pool ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$userPoolName = "travel-app-users"
$appClientName = "travel-app-client"
$region = "us-east-1"

Write-Host "Creating Cognito User Pool..." -ForegroundColor Yellow

# Create User Pool with custom attributes
# Note: Custom attributes need to be added separately after pool creation
$userPoolResponse = aws cognito-idp create-user-pool `
    --pool-name $userPoolName `
    --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=true}" `
    --auto-verified-attributes email `
    --schema `
        "Name=email,AttributeDataType=String,Required=true,Mutable=false" `
        "Name=name,AttributeDataType=String,Required=false,Mutable=true" `
    --region $region `
    --output json 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error creating user pool:" -ForegroundColor Red
    Write-Host $userPoolResponse -ForegroundColor Red
    exit 1
}

$userPoolJson = $userPoolResponse | ConvertFrom-Json
$userPoolId = $userPoolJson.UserPool.Id

Write-Host "User Pool created: $userPoolId" -ForegroundColor Green
Write-Host ""

# Create App Client (without client secret for public clients)
Write-Host "Creating App Client..." -ForegroundColor Yellow

$appClientResponse = aws cognito-idp create-user-pool-client `
    --user-pool-id $userPoolId `
    --client-name $appClientName `
    --no-generate-secret `
    --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH `
    --supported-identity-providers COGNITO `
    --callback-urls "http://localhost:3000/auth/callback" `
    --logout-urls "http://localhost:3000" `
    --allowed-o-auth-flows code `
    --allowed-o-auth-scopes email openid profile `
    --allowed-o-auth-flows-user-pool-client `
    --region $region `
    --output json 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error creating app client:" -ForegroundColor Red
    Write-Host $appClientResponse -ForegroundColor Red
    exit 1
}

$appClientJson = $appClientResponse | ConvertFrom-Json
$appClientId = $appClientJson.UserPoolClient.ClientId

Write-Host "App Client created: $appClientId" -ForegroundColor Green
Write-Host ""

# Create Cognito Domain
Write-Host "Creating Cognito Domain..." -ForegroundColor Yellow

$domainPrefix = "travel-app-auth-$(Get-Random -Minimum 1000 -Maximum 9999)"
$domainResponse = aws cognito-idp create-user-pool-domain `
    --domain $domainPrefix `
    --user-pool-id $userPoolId `
    --region $region `
    --output json 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Could not create domain:" -ForegroundColor Yellow
    Write-Host $domainResponse -ForegroundColor Yellow
    $cognitoDomain = "$domainPrefix.auth.$region.amazoncognito.com"
} else {
    $cognitoDomain = "$domainPrefix.auth.$region.amazoncognito.com"
    Write-Host "Cognito Domain created: $cognitoDomain" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Cognito Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Save these credentials:" -ForegroundColor Cyan
Write-Host "  User Pool ID: $userPoolId" -ForegroundColor White
Write-Host "  App Client ID: $appClientId" -ForegroundColor White
Write-Host "  Cognito Domain: $cognitoDomain" -ForegroundColor White
Write-Host ""
Write-Host "Add these to AWS_CREDENTIALS_SAFE.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure OAuth providers in AWS Console" -ForegroundColor White
Write-Host "2. Update environment variables" -ForegroundColor White
Write-Host "3. Run user migration script" -ForegroundColor White
