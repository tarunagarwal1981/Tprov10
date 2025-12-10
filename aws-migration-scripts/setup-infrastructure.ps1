# AWS Infrastructure Setup Script
# This script creates all necessary AWS infrastructure for the migration

$env:Path += ";C:\Program Files\Amazon\AWSCLIV2"

# Configuration
$vpcId = "vpc-035de28e2067ea386"
$igwId = "igw-06e7a2709e4aff68d"

Write-Host "🚀 Starting AWS Infrastructure Setup..." -ForegroundColor Green
Write-Host ""

# Get existing subnet IDs
Write-Host "📋 Getting existing subnets..." -ForegroundColor Yellow
$publicSubnet1a = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Name,Values=travel-app-public-1a" --query "Subnets[0].SubnetId" --output text
Write-Host "Public Subnet 1a: $publicSubnet1a" -ForegroundColor Cyan

# Create remaining subnets
Write-Host ""
Write-Host "📦 Creating remaining subnets..." -ForegroundColor Yellow

# Public Subnet 2 (us-east-1b)
$publicSubnet1b = aws ec2 create-subnet --vpc-id $vpcId --cidr-block 10.0.2.0/24 --availability-zone us-east-1b --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=travel-app-public-1b}]" --query "Subnet.SubnetId" --output text
Write-Host "✅ Created Public Subnet 1b: $publicSubnet1b" -ForegroundColor Green

# Private Subnet 1 (us-east-1a)
$privateSubnet1a = aws ec2 create-subnet --vpc-id $vpcId --cidr-block 10.0.3.0/24 --availability-zone us-east-1a --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=travel-app-private-1a}]" --query "Subnet.SubnetId" --output text
Write-Host "✅ Created Private Subnet 1a: $privateSubnet1a" -ForegroundColor Green

# Private Subnet 2 (us-east-1b)
$privateSubnet1b = aws ec2 create-subnet --vpc-id $vpcId --cidr-block 10.0.4.0/24 --availability-zone us-east-1b --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=travel-app-private-1b}]" --query "Subnet.SubnetId" --output text
Write-Host "✅ Created Private Subnet 1b: $privateSubnet1b" -ForegroundColor Green

# Create Route Tables
Write-Host ""
Write-Host "🛣️  Creating route tables..." -ForegroundColor Yellow

# Public Route Table
$publicRtId = aws ec2 create-route-table --vpc-id $vpcId --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=travel-app-public-rt}]" --query "RouteTable.RouteTableId" --output text
Write-Host "✅ Created Public Route Table: $publicRtId" -ForegroundColor Green

# Add route to Internet Gateway
aws ec2 create-route --route-table-id $publicRtId --destination-cidr-block 0.0.0.0/0 --gateway-id $igwId | Out-Null
Write-Host "✅ Added route to Internet Gateway" -ForegroundColor Green

# Associate public subnets
aws ec2 associate-route-table --subnet-id $publicSubnet1a --route-table-id $publicRtId | Out-Null
aws ec2 associate-route-table --subnet-id $publicSubnet1b --route-table-id $publicRtId | Out-Null
Write-Host "✅ Associated public subnets with route table" -ForegroundColor Green

# Create Security Groups
Write-Host ""
Write-Host "🔒 Creating security groups..." -ForegroundColor Yellow

# RDS Security Group
$rdsSgId = aws ec2 create-security-group --group-name rds-sg --description "Security group for RDS PostgreSQL" --vpc-id $vpcId --query "GroupId" --output text
aws ec2 authorize-security-group-ingress --group-id $rdsSgId --protocol tcp --port 5432 --cidr 10.0.0.0/16 | Out-Null
Write-Host "✅ Created RDS Security Group: $rdsSgId" -ForegroundColor Green

# App Security Group
$appSgId = aws ec2 create-security-group --group-name app-sg --description "Security group for application" --vpc-id $vpcId --query "GroupId" --output text
aws ec2 authorize-security-group-ingress --group-id $appSgId --protocol tcp --port 80 --cidr 0.0.0.0/0 | Out-Null
aws ec2 authorize-security-group-ingress --group-id $appSgId --protocol tcp --port 443 --cidr 0.0.0.0/0 | Out-Null
Write-Host "✅ Created App Security Group: $appSgId" -ForegroundColor Green

# Create DB Subnet Group
Write-Host ""
Write-Host "🗄️  Creating DB Subnet Group..." -ForegroundColor Yellow
aws rds create-db-subnet-group --db-subnet-group-name travel-app-db-subnet-group --db-subnet-group-description "Subnet group for RDS PostgreSQL" --subnet-ids $privateSubnet1a $privateSubnet1b --tags "Key=Name,Value=travel-app-db-subnet-group" | Out-Null
Write-Host "✅ Created DB Subnet Group: travel-app-db-subnet-group" -ForegroundColor Green

# Create S3 Bucket
Write-Host ""
Write-Host "🪣 Creating S3 bucket..." -ForegroundColor Yellow
$bucketSuffix = Get-Random -Minimum 1000 -Maximum 9999
$bucketName = "travel-app-storage-$bucketSuffix"
aws s3 mb s3://$bucketName --region us-east-1 | Out-Null
aws s3api put-bucket-versioning --bucket $bucketName --versioning-configuration Status=Enabled | Out-Null
$encryptionConfig = @'
{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}
'@
aws s3api put-bucket-encryption --bucket $bucketName --server-side-encryption-configuration $encryptionConfig | Out-Null
aws s3api put-public-access-block --bucket $bucketName --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" | Out-Null
Write-Host "✅ Created S3 Bucket: $bucketName" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "✅ Infrastructure Setup Complete!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Configuration Summary:" -ForegroundColor Yellow
Write-Host "  VPC ID: $vpcId"
Write-Host "  Internet Gateway: $igwId"
Write-Host "  Public Subnet 1a: $publicSubnet1a"
Write-Host "  Public Subnet 1b: $publicSubnet1b"
Write-Host "  Private Subnet 1a: $privateSubnet1a"
Write-Host "  Private Subnet 1b: $privateSubnet1b"
Write-Host "  RDS Security Group: $rdsSgId"
Write-Host "  App Security Group: $appSgId"
Write-Host "  S3 Bucket: $bucketName"
Write-Host ""
Write-Host "Save these values to .env.local:" -ForegroundColor Yellow
Write-Host "  S3_BUCKET_NAME=$bucketName"
Write-Host ""
Write-Host "Next Step: Create RDS PostgreSQL instance" -ForegroundColor Cyan
Write-Host "  Run: aws rds create-db-instance ..." -ForegroundColor Gray
Write-Host ""

