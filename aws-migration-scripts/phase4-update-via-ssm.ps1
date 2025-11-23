# Phase 4: Update URLs via Systems Manager Run Command
# This runs commands on EC2 without needing interactive connection

Write-Host "=== Phase 4: Update URLs via SSM Run Command ===" -ForegroundColor Cyan
Write-Host ""

$INSTANCE_ID = "i-056a065313dae8712"

# Check SSM Agent status
Write-Host "Checking SSM Agent status..." -ForegroundColor Yellow
$ssmStatus = aws ssm describe-instance-information `
  --filters "Key=InstanceIds,Values=$INSTANCE_ID" `
  --query "InstanceInformationList[0].PingStatus" `
  --output text 2>&1

Write-Host "SSM Status: $ssmStatus" -ForegroundColor Cyan

if ($ssmStatus -ne "Online") {
    Write-Host ""
    Write-Host "⚠️  SSM Agent is not online yet." -ForegroundColor Yellow
    Write-Host "Waiting 2 minutes for SSM Agent to register..." -ForegroundColor Yellow
    
    $count = 0
    do {
        Start-Sleep -Seconds 10
        $ssmStatus = aws ssm describe-instance-information `
          --filters "Key=InstanceIds,Values=$INSTANCE_ID" `
          --query "InstanceInformationList[0].PingStatus" `
          --output text 2>&1
        Write-Host "[$count] Status: $ssmStatus" -ForegroundColor Gray
        $count++
    } while ($ssmStatus -ne "Online" -and $count -lt 12)
    
    if ($ssmStatus -ne "Online") {
        Write-Host ""
        Write-Host "❌ SSM Agent still not online after 2 minutes." -ForegroundColor Red
        Write-Host ""
        Write-Host "Alternative: Use API Route from Amplify" -ForegroundColor Yellow
        Write-Host "  1. Deploy API route to Amplify" -ForegroundColor White
        Write-Host "  2. Call: fetch('/api/admin/update-urls', { method: 'POST' })" -ForegroundColor White
        exit 1
    }
}

Write-Host ""
Write-Host "✅ SSM Agent is online!" -ForegroundColor Green
Write-Host ""

# Step 1: Download SQL script
Write-Host "Step 1: Downloading SQL script from S3..." -ForegroundColor Yellow
$command1 = "aws s3 cp s3://travel-app-storage-1769/migration/update-urls.sql /tmp/update-urls.sql"
$result1 = aws ssm send-command `
  --instance-ids $INSTANCE_ID `
  --document-name "AWS-RunShellScript" `
  --parameters "commands=[`"$command1`"]" `
  --output json 2>&1 | ConvertFrom-Json

$commandId1 = $result1.Command.CommandId
Write-Host "Command ID: $commandId1" -ForegroundColor Gray

# Wait for command to complete
Write-Host "Waiting for download to complete..." -ForegroundColor Yellow
do {
    Start-Sleep -Seconds 5
    $status1 = aws ssm get-command-invocation `
      --command-id $commandId1 `
      --instance-id $INSTANCE_ID `
      --query "Status" `
      --output text 2>&1
} while ($status1 -ne "Success" -and $status1 -ne "Failed" -and $status1 -ne "Cancelled")

if ($status1 -ne "Success") {
    Write-Host "❌ Download failed. Status: $status1" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Script downloaded" -ForegroundColor Green
Write-Host ""

# Step 2: Run SQL update
Write-Host "Step 2: Running SQL update..." -ForegroundColor Yellow
$command2 = "export PGPASSWORD='ju3vrLHJUW8PqDG4' && psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com --port=5432 --username=postgres --dbname=postgres --file=/tmp/update-urls.sql"
$result2 = aws ssm send-command `
  --instance-ids $INSTANCE_ID `
  --document-name "AWS-RunShellScript" `
  --parameters "commands=[`"$command2`"]" `
  --output json 2>&1 | ConvertFrom-Json

$commandId2 = $result2.Command.CommandId
Write-Host "Command ID: $commandId2" -ForegroundColor Gray

# Wait for command to complete
Write-Host "Waiting for update to complete..." -ForegroundColor Yellow
do {
    Start-Sleep -Seconds 5
    $status2 = aws ssm get-command-invocation `
      --command-id $commandId2 `
      --instance-id $INSTANCE_ID `
      --query "Status" `
      --output text 2>&1
    Write-Host "Status: $status2" -ForegroundColor Gray
} while ($status2 -ne "Success" -and $status2 -ne "Failed" -and $status2 -ne "Cancelled")

if ($status2 -eq "Success") {
    Write-Host ""
    Write-Host "✅ Update completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Getting output..." -ForegroundColor Yellow
    $output = aws ssm get-command-invocation `
      --command-id $commandId2 `
      --instance-id $INSTANCE_ID `
      --query "StandardOutputContent" `
      --output text 2>&1
    Write-Host $output -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Update failed. Status: $status2" -ForegroundColor Red
    $error = aws ssm get-command-invocation `
      --command-id $commandId2 `
      --instance-id $INSTANCE_ID `
      --query "StandardErrorContent" `
      --output text 2>&1
    Write-Host "Error: $error" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Update Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Terminating EC2 instance..." -ForegroundColor Yellow
aws ec2 terminate-instances --instance-ids $INSTANCE_ID 2>&1 | Out-Null
Write-Host "✅ Instance termination initiated" -ForegroundColor Green

