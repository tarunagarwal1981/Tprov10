# Find Amplify Execution Role
# This script finds the actual execution role used by Amplify API routes

$ErrorActionPreference = "Stop"

$REGION = "us-east-1"

Write-Host "=== Finding Amplify Execution Role ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Please provide your Amplify App ID:" -ForegroundColor Yellow
Write-Host "You can find it in the Amplify Console URL or run:" -ForegroundColor Gray
Write-Host "  aws amplify list-apps --query 'apps[].{Name:name,AppId:appId}' --output table" -ForegroundColor Gray
Write-Host ""

$appId = Read-Host "Amplify App ID"

if (-not $appId) {
    Write-Host "[ERROR] App ID is required" -ForegroundColor Red
    exit 1
}

Write-Host "Getting Amplify app details..." -ForegroundColor Yellow

try {
    $appDetails = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" amplify get-app `
        --app-id $appId `
        --region $REGION `
        --output json | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "=== Amplify App Details ===" -ForegroundColor Green
    Write-Host "App Name: $($appDetails.app.name)" -ForegroundColor Gray
    Write-Host "App ID: $appId" -ForegroundColor Gray
    Write-Host ""
    
    # Check for service role (execution role)
    $serviceRoleArn = $appDetails.app.serviceRoleArn
    $iamServiceRoleArn = $appDetails.app.iamServiceRoleArn
    
    if ($serviceRoleArn) {
        Write-Host "✅ Service Role (Execution Role):" -ForegroundColor Green
        Write-Host "   ARN: $serviceRoleArn" -ForegroundColor Gray
        
        # Extract role name from ARN
        $roleName = $serviceRoleArn -replace '.*role/', ''
        Write-Host "   Role Name: $roleName" -ForegroundColor Gray
        Write-Host ""
        
        # Check if role has Lambda invoke policy
        Write-Host "Checking attached policies..." -ForegroundColor Yellow
        $attachedPolicies = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" iam list-attached-role-policies `
            --role-name $roleName `
            --region $REGION `
            --output json | ConvertFrom-Json
        
        Write-Host "   Attached Policies:" -ForegroundColor Gray
        $hasLambdaPolicy = $false
        foreach ($policy in $attachedPolicies.AttachedPolicies) {
            Write-Host "     - $($policy.PolicyName)" -ForegroundColor Gray
            
            # Check if it's a Lambda policy
            if ($policy.PolicyName -like "*Lambda*" -or $policy.PolicyArn -like "*Lambda*") {
                $hasLambdaPolicy = $true
                Write-Host "       ✅ This looks like a Lambda policy!" -ForegroundColor Green
            }
        }
        
        if (-not $hasLambdaPolicy) {
            Write-Host ""
            Write-Host "⚠️  No Lambda policy found!" -ForegroundColor Yellow
            Write-Host "   You need to attach a policy with lambda:InvokeFunction permission" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "   To fix:" -ForegroundColor Cyan
            Write-Host "   1. Go to IAM Console → Roles → $roleName" -ForegroundColor White
            Write-Host "   2. Add permissions → Attach policies" -ForegroundColor White
            Write-Host "   3. Search for: AWSLambda_FullAccess" -ForegroundColor White
            Write-Host "   4. Attach policy" -ForegroundColor White
        } else {
            Write-Host ""
            Write-Host "✅ Lambda policy found!" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "=== Summary ===" -ForegroundColor Cyan
        Write-Host "Execution Role Name: $roleName" -ForegroundColor Gray
        Write-Host "Role ARN: $serviceRoleArn" -ForegroundColor Gray
        Write-Host ""
        
    } else {
        Write-Host "⚠️  No service role found in app details" -ForegroundColor Yellow
        Write-Host "   This might mean Amplify is using a default role" -ForegroundColor Yellow
    }
    
    if ($iamServiceRoleArn -and $iamServiceRoleArn -ne $serviceRoleArn) {
        Write-Host ""
        Write-Host "IAM Service Role: $iamServiceRoleArn" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "[ERROR] Failed to get app details: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green

