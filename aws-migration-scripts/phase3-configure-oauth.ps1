# Phase 3: Configure OAuth Providers
# This script configures Google and GitHub OAuth providers in Cognito

param(
    [string]$GoogleClientId = "",
    [string]$GoogleClientSecret = "",
    [string]$GitHubClientId = "",
    [string]$GitHubClientSecret = ""
)

$env:Path += ";C:\Program Files\Amazon\AWSCLIV2"

$userPoolId = "us-east-1_oF5qfa2IX"
$cognitoDomain = "travel-app-auth-2285.auth.us-east-1.amazoncognito.com"
$region = "us-east-1"
$redirectUri = "https://$cognitoDomain/oauth2/idpresponse"

Write-Host "=== Step 3: Configure OAuth Providers ===" -ForegroundColor Cyan
Write-Host ""

# Configure Google OAuth
if ($GoogleClientId -and $GoogleClientSecret) {
    Write-Host "Configuring Google OAuth provider..." -ForegroundColor Yellow
    
    $googleProviderConfig = @{
        ProviderName = "Google"
        ProviderType = "Google"
        ProviderDetails = @{
            client_id = $GoogleClientId
            client_secret = $GoogleClientSecret
            authorize_scopes = "email profile openid"
        }
        AttributeMapping = @{
            email = "email"
            name = "name"
        }
    } | ConvertTo-Json -Depth 10
    
    $googleProviderConfig | Out-File -FilePath "google-provider-config.json" -Encoding UTF8
    
    try {
        aws cognito-idp create-identity-provider `
            --user-pool-id $userPoolId `
            --provider-name Google `
            --provider-type Google `
            --provider-details "client_id=$GoogleClientId,client_secret=$GoogleClientSecret,authorize_scopes=email profile openid" `
            --attribute-mapping "email=email,name=name" `
            --region $region `
            --output json 2>&1 | Out-Null
        
        Write-Host "✅ Google OAuth provider configured" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Google provider may already exist, trying to update..." -ForegroundColor Yellow
        aws cognito-idp update-identity-provider `
            --user-pool-id $userPoolId `
            --provider-name Google `
            --provider-details "client_id=$GoogleClientId,client_secret=$GoogleClientSecret,authorize_scopes=email profile openid" `
            --attribute-mapping "email=email,name=name" `
            --region $region `
            --output json 2>&1 | Out-Null
        Write-Host "✅ Google OAuth provider updated" -ForegroundColor Green
    }
    Write-Host ""
} else {
    Write-Host "⚠️  Google OAuth credentials not provided, skipping..." -ForegroundColor Yellow
    Write-Host ""
}

# Configure GitHub OAuth
if ($GitHubClientId -and $GitHubClientSecret) {
    Write-Host "Configuring GitHub OAuth provider..." -ForegroundColor Yellow
    
    try {
        aws cognito-idp create-identity-provider `
            --user-pool-id $userPoolId `
            --provider-name GitHub `
            --provider-type GitHub `
            --provider-details "client_id=$GitHubClientId,client_secret=$GitHubClientSecret,authorize_scopes=user:email" `
            --attribute-mapping "email=email,username=login" `
            --region $region `
            --output json 2>&1 | Out-Null
        
        Write-Host "✅ GitHub OAuth provider configured" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  GitHub provider may already exist, trying to update..." -ForegroundColor Yellow
        aws cognito-idp update-identity-provider `
            --user-pool-id $userPoolId `
            --provider-name GitHub `
            --provider-details "client_id=$GitHubClientId,client_secret=$GitHubClientSecret,authorize_scopes=user:email" `
            --attribute-mapping "email=email,username=login" `
            --region $region `
            --output json 2>&1 | Out-Null
        Write-Host "✅ GitHub OAuth provider updated" -ForegroundColor Green
    }
    Write-Host ""
} else {
    Write-Host "⚠️  GitHub OAuth credentials not provided, skipping..." -ForegroundColor Yellow
    Write-Host ""
}

# Update App Client to support identity providers
Write-Host "Updating App Client to support identity providers..." -ForegroundColor Yellow

$appClientId = "20t43em6vuke645ka10s4slgl9"
$supportedProviders = @("COGNITO")

if ($GoogleClientId) {
    $supportedProviders += "Google"
}
if ($GitHubClientId) {
    $supportedProviders += "GitHub"
}

$providersString = $supportedProviders -join " "

aws cognito-idp update-user-pool-client `
    --user-pool-id $userPoolId `
    --client-id $appClientId `
    --supported-identity-providers $providersString `
    --region $region `
    --output json 2>&1 | Out-Null

Write-Host "✅ App Client updated to support identity providers" -ForegroundColor Green
Write-Host ""

Write-Host "=== OAuth Configuration Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
if ($GoogleClientId) {
    Write-Host "  ✅ Google OAuth configured" -ForegroundColor White
}
if ($GitHubClientId) {
    Write-Host "  ✅ GitHub OAuth configured" -ForegroundColor White
}
Write-Host ""
Write-Host "🔗 OAuth Redirect URI:" -ForegroundColor Cyan
Write-Host "  $redirectUri" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Make sure this URI is added to your OAuth app settings!" -ForegroundColor Yellow

