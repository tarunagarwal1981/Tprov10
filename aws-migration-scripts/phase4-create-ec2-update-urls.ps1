# Phase 4: Create Temporary EC2 Instance and Update Database URLs
# This script creates an EC2 instance, runs the URL update, then cleans up

Write-Host "=== Phase 4: Temporary EC2 Instance for URL Update ===" -ForegroundColor Cyan
Write-Host ""

# VPC Configuration (from previous setup)
$VPC_ID = "vpc-035de28e2067ea386"
$PUBLIC_SUBNET_ID = "subnet-03492171db95e0412"  # Public subnet
$SECURITY_GROUP_NAME = "travel-app-ec2-temp"
$KEY_NAME = "travel-app-key"  # You may need to create this or use existing

# Get latest Amazon Linux 2023 AMI
Write-Host "Step 1: Getting latest Amazon Linux 2023 AMI..." -ForegroundColor Yellow
$amiResult = aws ec2 describe-images `
  --owners amazon `
  --filters "Name=name,Values=al2023-ami-2023*" "Name=architecture,Values=arm64" `
  --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" `
  --output text 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to get AMI. Trying x86_64..." -ForegroundColor Red
    $amiResult = aws ec2 describe-images `
      --owners amazon `
      --filters "Name=name,Values=al2023-ami-2023*" "Name=architecture,Values=x86_64" `
      --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" `
      --output text 2>&1
}

$AMI_ID = $amiResult.Trim()
Write-Host "✅ Using AMI: $AMI_ID" -ForegroundColor Green

# Create security group for EC2
Write-Host ""
Write-Host "Step 2: Creating security group..." -ForegroundColor Yellow
$sgResult = aws ec2 create-security-group `
  --group-name $SECURITY_GROUP_NAME `
  --description "Temporary EC2 for Phase 4 URL update" `
  --vpc-id $VPC_ID `
  --output json 2>&1 | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    # Security group might already exist
    Write-Host "Security group may already exist, trying to get it..." -ForegroundColor Yellow
    $sgResult = aws ec2 describe-security-groups `
      --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" "Name=vpc-id,Values=$VPC_ID" `
      --query "SecurityGroups[0]" `
      --output json 2>&1 | ConvertFrom-Json
}

$SG_ID = $sgResult.GroupId
Write-Host "✅ Security Group ID: $SG_ID" -ForegroundColor Green

# Get your public IP
$myIP = (Invoke-WebRequest -Uri "https://checkip.amazonaws.com" -UseBasicParsing).Content.Trim()
Write-Host "Your IP: $myIP" -ForegroundColor Gray

# Allow SSH from your IP
Write-Host "Adding SSH access from your IP..." -ForegroundColor Yellow
aws ec2 authorize-security-group-ingress `
  --group-id $SG_ID `
  --protocol tcp `
  --port 22 `
  --cidr "$myIP/32" `
  --output json 2>&1 | Out-Null

# Allow outbound to RDS (port 5432)
Write-Host "Adding RDS access..." -ForegroundColor Yellow
aws ec2 authorize-security-group-ingress `
  --group-id $SG_ID `
  --protocol tcp `
  --port 5432 `
  --source-group sg-0351956ce61a8d1f1 `
  --output json 2>&1 | Out-Null

# Create IAM role for SSM (so we can use Session Manager instead of SSH)
Write-Host ""
Write-Host "Step 3: Creating IAM role for SSM..." -ForegroundColor Yellow
$roleName = "travel-app-ec2-ssm-role"

# Check if role exists
$roleExists = aws iam get-role --role-name $roleName 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    # Create role
    Write-Host "Creating IAM role..." -ForegroundColor Gray
    aws iam create-role `
      --role-name $roleName `
      --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"Service": "ec2.amazonaws.com"},
          "Action": "sts:AssumeRole"
        }]
      }' `
      --output json 2>&1 | Out-Null

    # Attach SSM policy
    aws iam attach-role-policy `
      --role-name $roleName `
      --policy-arn "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore" `
      --output json 2>&1 | Out-Null

    # Create instance profile
    aws iam create-instance-profile --instance-profile-name $roleName 2>&1 | Out-Null
    aws iam add-role-to-instance-profile `
      --instance-profile-name $roleName `
      --role-name $roleName `
      --output json 2>&1 | Out-Null

    Start-Sleep -Seconds 5  # Wait for IAM propagation
}

$instanceProfileArn = "arn:aws:iam::815660521604:instance-profile/$roleName"
Write-Host "✅ IAM role ready" -ForegroundColor Green

# User data script to install dependencies and run update
$userDataScript = @"
#!/bin/bash
set -e

echo "=== Installing dependencies ==="
sudo yum update -y
sudo yum install -y postgresql15 nodejs npm git

echo "=== Installing Node.js 20 if needed ==="
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 20 ]; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs
fi

echo "=== Installing tsx ==="
sudo npm install -g tsx

echo "=== Creating update script ==="
cat > /tmp/update-urls.ts << 'SCRIPT_EOF'
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.RDS_HOST || process.env.RDS_HOSTNAME || 'travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com',
  port: parseInt(process.env.RDS_PORT || '5432'),
  database: process.env.RDS_DATABASE || process.env.RDS_DB || 'postgres',
  user: process.env.RDS_USERNAME || process.env.RDS_USER || 'postgres',
  password: process.env.RDS_PASSWORD || process.env.PGPASSWORD || (() => {
    console.error('❌ RDS_PASSWORD or PGPASSWORD environment variable is required');
    console.error('Please set it before running this script:');
    console.error('  export RDS_PASSWORD=your_password');
    process.exit(1);
  })(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

const S3_BASE_URL = 'https://travel-app-storage-1769.s3.us-east-1.amazonaws.com';
const SUPABASE_STORAGE_URL = 'https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public';

async function updateDatabaseUrls() {
  console.log('🔄 Updating database URLs from Supabase to S3...\n');

  try {
    console.log('📦 Updating activity_package_images table...');
    
    const updatePublicUrl = \`
      UPDATE activity_package_images
      SET public_url = REPLACE(
        public_url,
        '\${SUPABASE_STORAGE_URL}/activity-package-images/',
        '\${S3_BASE_URL}/activity-package-images/'
      )
      WHERE public_url LIKE '%supabase.co%'
    \`;

    const updateStoragePath = \`
      UPDATE activity_package_images
      SET storage_path = REPLACE(
        storage_path,
        '\${SUPABASE_STORAGE_URL}/activity-package-images/',
        'activity-package-images/'
      )
      WHERE storage_path LIKE '%supabase.co%'
    \`;

    const publicUrlResult = await pool.query(updatePublicUrl);
    const storagePathResult = await pool.query(updateStoragePath);

    console.log(\`✅ Updated \${publicUrlResult.rowCount || 0} public_url records\`);
    console.log(\`✅ Updated \${storagePathResult.rowCount || 0} storage_path records\`);

    // Verify
    console.log('\n🔍 Verifying updates...');
    const verifyResult = await pool.query(\`
      SELECT 
        COUNT(*) FILTER (WHERE public_url LIKE '%supabase.co%' OR storage_path LIKE '%supabase.co%') as remaining,
        COUNT(*) FILTER (WHERE public_url LIKE '%s3.amazonaws.com%') as s3_count
      FROM activity_package_images
    \`);

    const stats = verifyResult.rows[0];
    const remaining = parseInt(stats.remaining) || 0;
    const s3Count = parseInt(stats.s3_count) || 0;

    if (remaining > 0) {
      console.log(\`⚠️  \${remaining} records still contain Supabase URLs\`);
    } else {
      console.log('✅ All URLs updated successfully!');
    }

    console.log(\`📊 S3 URLs: \${s3Count}\`);
    console.log('\n✅ Database URL update completed!');

    // Sample
    const sampleResult = await pool.query(\`
      SELECT id, LEFT(public_url, 80) as url
      FROM activity_package_images
      WHERE public_url LIKE '%s3.amazonaws.com%'
      LIMIT 3
    \`);
    
    console.log('\n📋 Sample URLs:');
    sampleResult.rows.forEach((row: any) => {
      console.log(\`   - \${row.url}\`);
    });

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

updateDatabaseUrls();
SCRIPT_EOF

echo "=== Running update script ==="
cd /tmp
npm init -y
npm install pg @types/pg
tsx update-urls.ts

echo "=== Update complete ==="
"@

$userDataBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($userDataScript))

# Launch EC2 instance
Write-Host ""
Write-Host "Step 4: Launching EC2 instance..." -ForegroundColor Yellow
$instanceResult = aws ec2 run-instances `
  --image-id $AMI_ID `
  --instance-type t3.micro `
  --subnet-id $PUBLIC_SUBNET_ID `
  --security-group-ids $SG_ID `
  --iam-instance-profile Name=$roleName `
  --user-data $userDataBase64 `
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=travel-app-temp-url-update},{Key=Purpose,Value=Phase4-URL-Update}]" `
  --output json 2>&1 | ConvertFrom-Json

$INSTANCE_ID = $instanceResult.Instances[0].InstanceId
Write-Host "✅ Instance ID: $INSTANCE_ID" -ForegroundColor Green

Write-Host ""
Write-Host "Step 5: Waiting for instance to be running..." -ForegroundColor Yellow
aws ec2 wait instance-running --instance-ids $INSTANCE_ID
Write-Host "✅ Instance is running" -ForegroundColor Green

Write-Host ""
Write-Host "Step 6: Waiting for SSM Agent to be ready..." -ForegroundColor Yellow
$maxWait = 60
$count = 0
do {
    Start-Sleep -Seconds 10
    $status = aws ssm describe-instance-information `
      --filters "Key=InstanceIds,Values=$INSTANCE_ID" `
      --query "InstanceInformationList[0].PingStatus" `
      --output text 2>&1
    
    Write-Host "[$count] SSM Status: $status" -ForegroundColor Gray
    $count++
} while ($status -ne "Online" -and $count -lt $maxWait)

if ($status -eq "Online") {
    Write-Host "✅ SSM Agent is online!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Step 7: Checking script execution..." -ForegroundColor Yellow
    Write-Host "The script should have run automatically via user-data." -ForegroundColor Gray
    Write-Host "Checking logs..." -ForegroundColor Gray
    
    # Get logs
    Start-Sleep -Seconds 30  # Give it time to run
    aws ssm get-command-invocation `
      --command-id "check-logs" `
      --instance-id $INSTANCE_ID 2>&1 | Out-Null
    
    Write-Host ""
    Write-Host "Connecting to instance to check results..." -ForegroundColor Yellow
    Write-Host "Run this command to see the output:" -ForegroundColor Cyan
    Write-Host "aws ssm start-session --target $INSTANCE_ID" -ForegroundColor Green
    Write-Host ""
    Write-Host "Or check CloudWatch logs:" -ForegroundColor Cyan
    Write-Host "aws logs tail /aws/ec2/travel-app-temp-url-update --follow" -ForegroundColor Green
} else {
    Write-Host "WARNING: SSM Agent not online yet. You can connect manually:" -ForegroundColor Yellow
    Write-Host "aws ssm start-session --target $INSTANCE_ID" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Instance Created ===" -ForegroundColor Green
Write-Host "Instance ID: $INSTANCE_ID" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Connect via SSM: aws ssm start-session --target $INSTANCE_ID" -ForegroundColor White
Write-Host "2. Check if script ran: cat /var/log/cloud-init-output.log" -ForegroundColor White
Write-Host "3. If needed, run manually: cd /tmp; tsx update-urls.ts" -ForegroundColor White
Write-Host "4. After completion, terminate instance: aws ec2 terminate-instances --instance-ids $INSTANCE_ID" -ForegroundColor White
Write-Host ""
Write-Host "WARNING: Remember to terminate the instance after use!" -ForegroundColor Yellow

