# Comprehensive Fix: Secrets Manager + Amplify Environment Variables
# This script checks and fixes both Secrets Manager and Amplify env vars

$ErrorActionPreference = "Stop"

$REGION = "us-east-1"
$APP_ID = "d2p2uq8t9xysui"
$BRANCH_NAME = "dev"
$SECRET_NAME = "travel-app/dev/secrets"

# Correct values
$CORRECT_RDS_HOST = "travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com"
$CORRECT_COGNITO_USER_POOL_ID = "us-east-1_oF5qfa2IX"
$CORRECT_COGNITO_CLIENT_ID = "20t43em6vuke645ka10s4slgl9"
$CORRECT_RDS_PORT = "5432"
$CORRECT_RDS_DB = "postgres"
$CORRECT_RDS_USER = "postgres"
$CORRECT_DEPLOYMENT_REGION = "us-east-1"
$CORRECT_COGNITO_DOMAIN = "travel-app-auth-2285.auth.us-east-1.amazoncognito.com"

# Note: RDS_PASSWORD should already be in the secret - we'll preserve it

Write-Host "=== Comprehensive Secrets & Environment Variables Fix ===" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# STEP 1: Read Secrets Manager
# ============================================================
Write-Host "Step 1: Reading Secrets Manager..." -ForegroundColor Yellow

try {
    $secretJson = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" secretsmanager get-secret-value `
        --secret-id $SECRET_NAME `
        --region $REGION `
        --query "SecretString" `
        --output text
    
    $secretObj = $secretJson | ConvertFrom-Json
    # Convert to hashtable for easier manipulation
    $secretData = @{}
    $secretObj.PSObject.Properties | ForEach-Object {
        $secretData[$_.Name] = $_.Value
    }
    Write-Host "[OK] Secret read successfully" -ForegroundColor Green
    Write-Host "   Keys found: $($secretData.Keys -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "[WARN] Secret read failed or doesn't exist: $_" -ForegroundColor Yellow
    $secretData = @{}
}

Write-Host ""

# ============================================================
# STEP 2: Read Amplify Environment Variables
# ============================================================
Write-Host "Step 2: Reading Amplify environment variables..." -ForegroundColor Yellow

try {
    $amplifyJson = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" amplify get-branch `
        --app-id $APP_ID `
        --branch-name $BRANCH_NAME `
        --region $REGION `
        --query "branch.environmentVariables" `
        --output json
    
    $amplifyObj = $amplifyJson | ConvertFrom-Json
    # Convert to hashtable for easier manipulation
    $amplifyEnvVars = @{}
    if ($amplifyObj) {
        $amplifyObj.PSObject.Properties | ForEach-Object {
            $amplifyEnvVars[$_.Name] = $_.Value
        }
    }
    Write-Host "[OK] Amplify env vars read successfully" -ForegroundColor Green
    Write-Host "   Variables found: $($amplifyEnvVars.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to read Amplify env vars: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================
# STEP 3: Identify Issues
# ============================================================
Write-Host "Step 3: Identifying issues..." -ForegroundColor Yellow
Write-Host ""

$issues = @()
$secretNeedsUpdate = $false
$amplifyNeedsUpdate = $false

# Check RDS_HOST (CRITICAL!)
$rdsHostInSecret = $secretData.RDS_HOST -or $secretData.RDS_HOSTNAME
$rdsHostInAmplify = $amplifyEnvVars.RDS_HOST -or $amplifyEnvVars.RDS_HOSTNAME

# Ensure all RDS config is in Secrets Manager (for security)
if ($secretData.RDS_HOST -ne $CORRECT_RDS_HOST -and $secretData.RDS_HOSTNAME -ne $CORRECT_RDS_HOST) {
    $issues += "[ERROR] Secret: RDS_HOST/RDS_HOSTNAME missing or wrong (should be '$CORRECT_RDS_HOST')"
    $secretData.RDS_HOST = $CORRECT_RDS_HOST
    $secretData.RDS_HOSTNAME = $CORRECT_RDS_HOST
    $secretNeedsUpdate = $true
}

if ($rdsHostInAmplify -ne $CORRECT_RDS_HOST) {
    $issues += "[ERROR] Amplify: RDS_HOST is '$rdsHostInAmplify' (should be '$CORRECT_RDS_HOST')"
    $amplifyEnvVars.RDS_HOST = $CORRECT_RDS_HOST
    $amplifyEnvVars.RDS_HOSTNAME = $CORRECT_RDS_HOST
    $amplifyNeedsUpdate = $true
}

# Check Cognito
if ($secretData.COGNITO_USER_POOL_ID -ne $CORRECT_COGNITO_USER_POOL_ID) {
    $issues += "[ERROR] Secret: COGNITO_USER_POOL_ID mismatch"
    $secretData.COGNITO_USER_POOL_ID = $CORRECT_COGNITO_USER_POOL_ID
    $secretNeedsUpdate = $true
}

if ($secretData.COGNITO_CLIENT_ID -ne $CORRECT_COGNITO_CLIENT_ID) {
    $issues += "[ERROR] Secret: COGNITO_CLIENT_ID mismatch"
    $secretData.COGNITO_CLIENT_ID = $CORRECT_COGNITO_CLIENT_ID
    $secretNeedsUpdate = $true
}

if ($amplifyEnvVars.COGNITO_USER_POOL_ID -ne $CORRECT_COGNITO_USER_POOL_ID) {
    $issues += "[ERROR] Amplify: COGNITO_USER_POOL_ID mismatch"
    $amplifyEnvVars.COGNITO_USER_POOL_ID = $CORRECT_COGNITO_USER_POOL_ID
    $amplifyNeedsUpdate = $true
}

if ($amplifyEnvVars.COGNITO_CLIENT_ID -ne $CORRECT_COGNITO_CLIENT_ID) {
    $issues += "[ERROR] Amplify: COGNITO_CLIENT_ID mismatch"
    $amplifyEnvVars.COGNITO_CLIENT_ID = $CORRECT_COGNITO_CLIENT_ID
    $amplifyNeedsUpdate = $true
}

# Check RDS other values
if ($secretData.RDS_PORT -ne $CORRECT_RDS_PORT) {
    $issues += "[ERROR] Secret: RDS_PORT mismatch"
    $secretData.RDS_PORT = $CORRECT_RDS_PORT
    $secretNeedsUpdate = $true
}

if ($amplifyEnvVars.RDS_PORT -ne $CORRECT_RDS_PORT) {
    $issues += "[ERROR] Amplify: RDS_PORT missing or wrong"
    $amplifyEnvVars.RDS_PORT = $CORRECT_RDS_PORT
    $amplifyNeedsUpdate = $true
}

if ($secretData.RDS_DB -ne $CORRECT_RDS_DB -and $secretData.RDS_DATABASE -ne $CORRECT_RDS_DB) {
    $issues += "[ERROR] Secret: RDS_DB mismatch"
    $secretData.RDS_DB = $CORRECT_RDS_DB
    $secretData.RDS_DATABASE = $CORRECT_RDS_DB
    $secretNeedsUpdate = $true
}

if ($amplifyEnvVars.RDS_DB -ne $CORRECT_RDS_DB) {
    $issues += "[ERROR] Amplify: RDS_DB missing or wrong"
    $amplifyEnvVars.RDS_DB = $CORRECT_RDS_DB
    $amplifyNeedsUpdate = $true
}

if ($secretData.RDS_USER -ne $CORRECT_RDS_USER -and $secretData.RDS_USERNAME -ne $CORRECT_RDS_USER) {
    $issues += "[ERROR] Secret: RDS_USER mismatch"
    $secretData.RDS_USER = $CORRECT_RDS_USER
    $secretData.RDS_USERNAME = $CORRECT_RDS_USER
    $secretNeedsUpdate = $true
}

if ($amplifyEnvVars.RDS_USER -ne $CORRECT_RDS_USER) {
    $issues += "[ERROR] Amplify: RDS_USER missing or wrong"
    $amplifyEnvVars.RDS_USER = $CORRECT_RDS_USER
    $amplifyNeedsUpdate = $true
}

# Ensure required Amplify vars exist
if (-not $amplifyEnvVars.DEPLOYMENT_REGION) {
    $issues += "[ERROR] Amplify: Missing DEPLOYMENT_REGION"
    $amplifyEnvVars.DEPLOYMENT_REGION = $CORRECT_DEPLOYMENT_REGION
    $amplifyNeedsUpdate = $true
}

if ($amplifyEnvVars.NEXT_PUBLIC_COGNITO_CLIENT_ID -ne $CORRECT_COGNITO_CLIENT_ID) {
    $issues += "[ERROR] Amplify: NEXT_PUBLIC_COGNITO_CLIENT_ID mismatch"
    $amplifyEnvVars.NEXT_PUBLIC_COGNITO_CLIENT_ID = $CORRECT_COGNITO_CLIENT_ID
    $amplifyNeedsUpdate = $true
}

if ($amplifyEnvVars.NEXT_PUBLIC_COGNITO_DOMAIN -ne $CORRECT_COGNITO_DOMAIN) {
    $issues += "[ERROR] Amplify: NEXT_PUBLIC_COGNITO_DOMAIN mismatch"
    $amplifyEnvVars.NEXT_PUBLIC_COGNITO_DOMAIN = $CORRECT_COGNITO_DOMAIN
    $amplifyNeedsUpdate = $true
}

if ($issues.Count -eq 0) {
    Write-Host "[OK] No issues found! Everything is correctly configured." -ForegroundColor Green
    Write-Host ""
    exit 0
}

Write-Host "Found $($issues.Count) issue(s):" -ForegroundColor Yellow
$issues | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
Write-Host ""

# ============================================================
# STEP 4: Update Secrets Manager
# ============================================================
if ($secretNeedsUpdate) {
    Write-Host "Step 4: Updating Secrets Manager..." -ForegroundColor Yellow
    
    $secretJson = $secretData | ConvertTo-Json -Compress
    $secretJson | Out-File -FilePath "temp-secret.json" -Encoding utf8 -NoNewline
    
    & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" secretsmanager update-secret `
        --secret-id $SECRET_NAME `
        --secret-string "file://temp-secret.json" `
        --region $REGION | Out-Null
    
    Remove-Item "temp-secret.json" -ErrorAction SilentlyContinue
    
    Write-Host "[OK] Secret updated successfully" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[OK] Step 4: Secrets Manager is up to date" -ForegroundColor Green
    Write-Host ""
}

# ============================================================
# STEP 5: Update Amplify Environment Variables
# ============================================================
if ($amplifyNeedsUpdate) {
    Write-Host "Step 5: Updating Amplify environment variables..." -ForegroundColor Yellow
    
    # Convert to AWS CLI format: key1=value1,key2=value2
    $envVarsArray = @()
    $amplifyEnvVars.GetEnumerator() | ForEach-Object {
        $envVarsArray += "$($_.Key)=$($_.Value)"
    }
    $envVarsString = $envVarsArray -join ","
    
    & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" amplify update-branch `
        --app-id $APP_ID `
        --branch-name $BRANCH_NAME `
        --environment-variables $envVarsString `
        --region $REGION | Out-Null
    
    Write-Host "[OK] Amplify env vars updated successfully" -ForegroundColor Green
    Write-Host "[WARN] IMPORTANT: A new deployment will be triggered automatically." -ForegroundColor Yellow
    Write-Host "   Wait for the deployment to complete (5-10 minutes) before testing." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "[OK] Step 5: Amplify env vars are up to date" -ForegroundColor Green
    Write-Host ""
}

# ============================================================
# SUMMARY
# ============================================================
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "[OK] All fixes applied!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Wait for Amplify deployment to complete"
Write-Host "2. Test login at: https://dev.d2p2uq8t9xysui.amplifyapp.com"
Write-Host "3. Check debug endpoint: https://dev.d2p2uq8t9xysui.amplifyapp.com/api/debug/env"
Write-Host ""

