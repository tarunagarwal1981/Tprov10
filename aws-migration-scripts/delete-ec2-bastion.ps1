# Delete EC2 Bastion Instance
# This script finds and terminates the migration-bastion EC2 instance

Write-Host "=== Deleting EC2 Bastion Instance ===" -ForegroundColor Cyan
Write-Host ""

# Find all instances with migration-bastion tag
Write-Host "Searching for EC2 instances..." -ForegroundColor Yellow
$instances = aws ec2 describe-instances `
  --filters "Name=tag:Name,Values=migration-bastion" `
  --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]" `
  --output json | ConvertFrom-Json

if ($instances.Count -eq 0 -or ($instances[0].Count -eq 0)) {
    Write-Host "✅ No EC2 instances found with tag 'migration-bastion'" -ForegroundColor Green
    Write-Host "   Instance may already be deleted or never existed." -ForegroundColor Gray
    exit 0
}

Write-Host "Found instances:" -ForegroundColor Yellow
foreach ($instance in $instances[0]) {
    $instanceId = $instance[0]
    $state = $instance[1]
    $publicIp = $instance[2]
    Write-Host "  - Instance ID: $instanceId" -ForegroundColor White
    Write-Host "    State: $state" -ForegroundColor Gray
    Write-Host "    Public IP: $publicIp" -ForegroundColor Gray
}

# Confirm deletion
Write-Host ""
$confirm = Read-Host "Do you want to terminate these instances? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Cancelled. No instances were deleted." -ForegroundColor Yellow
    exit 0
}

# Terminate instances
Write-Host ""
Write-Host "Terminating instances..." -ForegroundColor Yellow
foreach ($instance in $instances[0]) {
    $instanceId = $instance[0]
    $state = $instance[1]
    
    if ($state -eq "terminated") {
        Write-Host "  ⏭️  Instance $instanceId is already terminated" -ForegroundColor Gray
        continue
    }
    
    Write-Host "  🗑️  Terminating $instanceId..." -ForegroundColor Yellow
    aws ec2 terminate-instances --instance-ids $instanceId | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Termination initiated for $instanceId" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to terminate $instanceId" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Deletion process initiated!" -ForegroundColor Green
Write-Host "   Instances will be fully terminated in 1-2 minutes." -ForegroundColor Gray
Write-Host ""
Write-Host "To verify deletion:" -ForegroundColor Cyan
Write-Host "  aws ec2 describe-instances --filters 'Name=tag:Name,Values=migration-bastion'" -ForegroundColor Gray





