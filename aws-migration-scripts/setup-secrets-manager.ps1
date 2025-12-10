# Setup AWS Secrets Manager for Secure Secret Storage
# Plain ASCII version to avoid encoding issues

param(
    [string]$SecretName = "travel-app/dev/secrets",
    [string]$Region = "us-east-1"
)

Write-Host "Setting up AWS Secrets Manager..."

# Ensure AWS CLI is available
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "AWS CLI not found. Please install AWS CLI first."
    exit 1
}

Write-Host ""
Write-Host "Enter secret values (press Enter to use environment variables if set):"

function Get-ValueOrPrompt {
    param(
        [string]$EnvName,
        [string]$Prompt
    )

    $envValue = [Environment]::GetEnvironmentVariable($EnvName)

    if (-not [string]::IsNullOrEmpty($envValue)) {
        Write-Host "Using $EnvName from environment"
        return $envValue
    } else {
        return Read-Host $Prompt
    }
}

$rdsPassword = Get-ValueOrPrompt -EnvName "RDS_PASSWORD" -Prompt "RDS Password"
$supabaseServiceKey = Get-ValueOrPrompt -EnvName "SUPABASE_SERVICE_ROLE_KEY" -Prompt "Supabase Service Role Key"
$cognitoClientId = Get-ValueOrPrompt -EnvName "COGNITO_CLIENT_ID" -Prompt "Cognito Client ID"
$cognitoUserPoolId = Get-ValueOrPrompt -EnvName "COGNITO_USER_POOL_ID" -Prompt "Cognito User Pool ID"

$secretJson = @{
    RDS_PASSWORD = $rdsPassword
    SUPABASE_SERVICE_ROLE_KEY = $supabaseServiceKey
    COGNITO_CLIENT_ID = $cognitoClientId
    COGNITO_USER_POOL_ID = $cognitoUserPoolId
} | ConvertTo-Json -Compress

Write-Host ""
Write-Host "Checking if secret already exists..."

$secretExists = aws secretsmanager describe-secret --secret-id $SecretName --region $Region 2>$null

if ($secretExists) {
    Write-Host "Secret already exists. Updating..."
    aws secretsmanager update-secret `
        --secret-id $SecretName `
        --secret-string $secretJson `
        --region $Region
} else {
    Write-Host "Creating new secret..."
    aws secretsmanager create-secret `
        --name $SecretName `
        --description "Travel App secrets for dev environment" `
        --secret-string $secretJson `
        --region $Region
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create or update secret."
    exit 1
}

Write-Host ""
Write-Host "Secret Details:"
Write-Host "   Name: $SecretName"
Write-Host "   Region: $Region"
Write-Host "   Keys: RDS_PASSWORD, SUPABASE_SERVICE_ROLE_KEY, COGNITO_CLIENT_ID, COGNITO_USER_POOL_ID"
Write-Host ""
Write-Host "IMPORTANT: Grant Amplify execution role access to this secret!"
Write-Host "See AMPLIFY_SECRETS_MANAGER_IAM.md for steps."
Write-Host ""

