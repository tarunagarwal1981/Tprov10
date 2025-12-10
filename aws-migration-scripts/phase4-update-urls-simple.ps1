# Phase 4: Simple EC2 Instance for URL Update
# Based on Phase 2 working approach

Write-Host "=== Phase 4: Create EC2 Instance for URL Update ===" -ForegroundColor Cyan
Write-Host ""

# Check for existing instance
Write-Host "Checking for existing EC2 instance..." -ForegroundColor Yellow
$existingInstance = aws ec2 describe-instances `
  --filters "Name=tag:Name,Values=migration-bastion" "Name=instance-state-name,Values=running,stopped" `
  --query "Reservations[0].Instances[0].InstanceId" `
  --output text 2>&1

if ($existingInstance -and $existingInstance -ne "None") {
    Write-Host "Found existing instance: $existingInstance" -ForegroundColor Green
    Write-Host "Checking status..." -ForegroundColor Yellow
    
    $status = aws ec2 describe-instances --instance-ids $existingInstance --query "Reservations[0].Instances[0].State.Name" --output text
    Write-Host "Status: $status" -ForegroundColor Cyan
    
    if ($status -eq "stopped") {
        Write-Host "Starting instance..." -ForegroundColor Yellow
        aws ec2 start-instances --instance-ids $existingInstance | Out-Null
        Write-Host "Waiting for instance to be running..." -ForegroundColor Yellow
        aws ec2 wait instance-running --instance-ids $existingInstance
        Write-Host "Instance is running!" -ForegroundColor Green
    }
    
    $INSTANCE_ID = $existingInstance
} else {
    Write-Host "No existing instance found. Creating new one..." -ForegroundColor Yellow
    
    # Get latest AMI
    Write-Host "Getting latest Amazon Linux 2023 AMI..." -ForegroundColor Yellow
    $amiResult = aws ec2 describe-images `
      --owners amazon `
      --filters "Name=name,Values=al2023-ami-2023*" "Name=architecture,Values=x86_64" `
      --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" `
      --output text
    
    $AMI_ID = $amiResult.Trim()
    Write-Host "Using AMI: $AMI_ID" -ForegroundColor Green
    
    # Create instance (same as Phase 2)
    Write-Host "Creating EC2 instance..." -ForegroundColor Yellow
    $instanceResult = aws ec2 run-instances `
      --image-id $AMI_ID `
      --instance-type t3.micro `
      --subnet-id subnet-043c87443f8ef0263 `
      --security-group-ids sg-03d1d3d0c41a29e7a `
      --associate-public-ip-address `
      --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=migration-bastion}]" `
      --user-data "IyEvYmluL2Jhc2gKeXVtIHVwZGF0ZSAteQp5dW0gaW5zdGFsbCAteSBwb3N0Z3Jlc3FsMTU=" `
      --output json | ConvertFrom-Json
    
    $INSTANCE_ID = $instanceResult.Instances[0].InstanceId
    Write-Host "Instance created: $INSTANCE_ID" -ForegroundColor Green
    Write-Host "Waiting for instance to be running..." -ForegroundColor Yellow
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID
    Write-Host "Instance is running!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Instance Ready ===" -ForegroundColor Green
Write-Host "Instance ID: $INSTANCE_ID" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Connect via EC2 Instance Connect (easiest)" -ForegroundColor White
Write-Host "   - Go to EC2 Console" -ForegroundColor Gray
Write-Host "   - Find instance: $INSTANCE_ID" -ForegroundColor Gray
Write-Host "   - Click Connect -> EC2 Instance Connect" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Once connected, run these commands:" -ForegroundColor White
Write-Host ""
Write-Host "   # Install Node.js and tsx" -ForegroundColor Gray
Write-Host "   sudo yum install -y nodejs npm" -ForegroundColor Green
Write-Host "   sudo npm install -g tsx" -ForegroundColor Green
Write-Host ""
Write-Host "   # Create update script" -ForegroundColor Gray
Write-Host "   cat > /tmp/update-urls.ts << 'EOF'" -ForegroundColor Green
Write-Host "   import { Pool } from 'pg';" -ForegroundColor Green
Write-Host "   const pool = new Pool({" -ForegroundColor Green
Write-Host "     host: 'travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com'," -ForegroundColor Green
Write-Host "     port: 5432, database: 'postgres'," -ForegroundColor Green
Write-Host "     user: 'postgres', password: 'ju3vrLHJUW8PqDG4'," -ForegroundColor Green
Write-Host "     ssl: { rejectUnauthorized: false }" -ForegroundColor Green
Write-Host "   });" -ForegroundColor Green
Write-Host "   const S3_BASE = 'https://travel-app-storage-1769.s3.us-east-1.amazonaws.com';" -ForegroundColor Green
Write-Host "   const SUPABASE = 'https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public';" -ForegroundColor Green
Write-Host "   await pool.query(\`UPDATE activity_package_images SET public_url = REPLACE(public_url, '\${SUPABASE}/activity-package-images/', '\${S3_BASE}/activity-package-images/') WHERE public_url LIKE '%supabase.co%'\`);" -ForegroundColor Green
Write-Host "   await pool.query(\`UPDATE activity_package_images SET storage_path = REPLACE(storage_path, '\${SUPABASE}/activity-package-images/', 'activity-package-images/') WHERE storage_path LIKE '%supabase.co%'\`);" -ForegroundColor Green
Write-Host "   const result = await pool.query('SELECT COUNT(*) as s3_count FROM activity_package_images WHERE public_url LIKE ''%s3.amazonaws.com%''');" -ForegroundColor Green
Write-Host "   console.log('Updated:', result.rows[0].s3_count);" -ForegroundColor Green
Write-Host "   await pool.end();" -ForegroundColor Green
Write-Host "   EOF" -ForegroundColor Green
Write-Host ""
Write-Host "   # Install pg and run" -ForegroundColor Gray
Write-Host "   cd /tmp && npm init -y && npm install pg @types/pg && tsx update-urls.ts" -ForegroundColor Green
Write-Host ""
Write-Host "3. After completion, terminate instance:" -ForegroundColor White
Write-Host "   aws ec2 terminate-instances --instance-ids $INSTANCE_ID" -ForegroundColor Green

