# Create VPC Endpoint for Secrets Manager
# This allows Lambda in VPC to access Secrets Manager without internet/NAT Gateway

$ErrorActionPreference = "Stop"

$REGION = "us-east-1"
$VPC_ID = "vpc-035de28e2067ea386"
$SUBNET_1 = "subnet-03492171db95e0412"
$SUBNET_2 = "subnet-0a9c5d406940f11d2"
$ENDPOINT_NAME = "secrets-manager-endpoint"

Write-Host "=== Creating VPC Endpoint for Secrets Manager ===" -ForegroundColor Cyan
Write-Host ""

# Check if endpoint already exists
Write-Host "Checking for existing endpoint..." -ForegroundColor Yellow
$existing = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" ec2 describe-vpc-endpoints `
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=service-name,Values=com.amazonaws.us-east-1.secretsmanager" `
    --region $REGION `
    --query "VpcEndpoints[0].VpcEndpointId" `
    --output text 2>&1

if ($existing -and $existing -ne "None" -and $existing -notmatch "error") {
    Write-Host "[OK] VPC endpoint already exists: $existing" -ForegroundColor Green
    Write-Host ""
    Write-Host "Endpoint ID: $existing" -ForegroundColor Gray
    exit 0
}

Write-Host "Creating VPC endpoint..." -ForegroundColor Yellow

# Get default security group for VPC (allows all outbound)
$defaultSG = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" ec2 describe-security-groups `
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=default" `
    --region $REGION `
    --query "SecurityGroups[0].GroupId" `
    --output text

if (-not $defaultSG -or $defaultSG -eq "None") {
    Write-Host "[WARN] Could not find default security group, creating new one..." -ForegroundColor Yellow
    # Create a security group that allows HTTPS outbound
    $sgName = "secrets-manager-endpoint-sg"
    $sgDescription = "Security group for Secrets Manager VPC endpoint"
    
    $sgResponse = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" ec2 create-security-group `
        --group-name $sgName `
        --description $sgDescription `
        --vpc-id $VPC_ID `
        --region $REGION `
        --output json | ConvertFrom-Json
    
    $defaultSG = $sgResponse.GroupId
    
    # Allow HTTPS outbound (required for VPC endpoint)
    & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" ec2 authorize-security-group-egress `
        --group-id $defaultSG `
        --protocol tcp `
        --port 443 `
        --cidr 0.0.0.0/0 `
        --region $REGION 2>&1 | Out-Null
}

Write-Host "   Using security group: $defaultSG" -ForegroundColor Gray

# Create VPC endpoint
try {
    $endpointResponse = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" ec2 create-vpc-endpoint `
        --vpc-id $VPC_ID `
        --service-name "com.amazonaws.us-east-1.secretsmanager" `
        --vpc-endpoint-type Interface `
        --subnet-ids $SUBNET_1 $SUBNET_2 `
        --security-group-ids $defaultSG `
        --region $REGION `
        --output json | ConvertFrom-Json
    
    $endpointId = $endpointResponse.VpcEndpoint.VpcEndpointId
    
    Write-Host "[OK] VPC endpoint created: $endpointId" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for endpoint to be available (this may take 2-3 minutes)..." -ForegroundColor Yellow
    
    # Wait for endpoint to be available
    $maxWait = 180 # 3 minutes
    $waited = 0
    $interval = 10
    
    do {
        Start-Sleep -Seconds $interval
        $waited += $interval
        
        $status = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" ec2 describe-vpc-endpoints `
            --vpc-endpoint-ids $endpointId `
            --region $REGION `
            --query "VpcEndpoints[0].State" `
            --output text
        
        Write-Host "   Status: $status (waited $waited seconds)" -ForegroundColor Gray
        
        if ($status -eq "available") {
            Write-Host "[OK] VPC endpoint is now available!" -ForegroundColor Green
            break
        }
        
        if ($waited -ge $maxWait) {
            Write-Host "[WARN] Endpoint still not available after $maxWait seconds" -ForegroundColor Yellow
            Write-Host "   It may still be provisioning. Check status in AWS Console." -ForegroundColor Yellow
            break
        }
    } while ($true)
    
    Write-Host ""
    Write-Host "=== VPC Endpoint Created ===" -ForegroundColor Green
    Write-Host "Endpoint ID: $endpointId" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test Lambda again with: {`"action`":`"test`"}" -ForegroundColor White
    Write-Host "2. Should now connect to Secrets Manager successfully" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Failed to create VPC endpoint: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "You can create it manually:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.aws.amazon.com/vpc/home?region=us-east-1#Endpoints:" -ForegroundColor Cyan
    Write-Host "2. Create endpoint" -ForegroundColor Cyan
    Write-Host "3. Service: com.amazonaws.us-east-1.secretsmanager" -ForegroundColor Cyan
    Write-Host "4. VPC: $VPC_ID" -ForegroundColor Cyan
    Write-Host "5. Subnets: $SUBNET_1, $SUBNET_2" -ForegroundColor Cyan
    exit 1
}

