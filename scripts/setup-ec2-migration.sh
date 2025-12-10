#!/bin/bash
# Setup EC2 Instance for Database Migration
# This script helps set up an EC2 instance in the same VPC as RDS

set -e

echo "🚀 Setting up EC2 instance for database migration..."

# Configuration - Update these values
REGION="us-east-1"
VPC_ID=""  # Will be detected from RDS
SUBNET_ID=""  # Will use default subnet
KEY_NAME="migration-key"  # Your existing EC2 key pair name
INSTANCE_TYPE="t3.micro"  # Free tier eligible
AMI_ID="ami-0c02fb55956c7d316"  # Amazon Linux 2023 (update for your region)

# Get RDS VPC and Subnet
echo "📋 Detecting RDS VPC and subnet..."
RDS_VPC=$(aws rds describe-db-instances \
  --db-instance-identifier travel-app-db \
  --region $REGION \
  --query 'DBInstances[0].DBSubnetGroup.VpcId' \
  --output text)

RDS_SUBNET=$(aws rds describe-db-instances \
  --db-instance-identifier travel-app-db \
  --region $REGION \
  --query 'DBInstances[0].DBSubnetGroup.Subnets[0].SubnetIdentifier' \
  --output text)

echo "RDS VPC: $RDS_VPC"
echo "RDS Subnet: $RDS_SUBNET"

# Get security group ID (use RDS security group or create new)
SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=vpc-id,Values=$RDS_VPC" "Name=group-name,Values=rds-sg" \
  --region $REGION \
  --query 'SecurityGroups[0].GroupId' \
  --output text)

if [ -z "$SG_ID" ]; then
  echo "Creating security group for EC2..."
  SG_ID=$(aws ec2 create-security-group \
    --group-name migration-ec2-sg \
    --description "Security group for migration EC2 instance" \
    --vpc-id $RDS_VPC \
    --region $REGION \
    --query 'GroupId' \
    --output text)
  
  # Allow SSH from your IP
  aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region $REGION
fi

echo "Security Group: $SG_ID"

# Create user data script for EC2
cat > /tmp/user-data.sh << 'EOF'
#!/bin/bash
yum update -y
yum install -y postgresql15 git

# Install Node.js and npm (for running migration script if needed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18
nvm use 18

# Clone repository or prepare for migration
mkdir -p /home/ec2-user/migration
chown ec2-user:ec2-user /home/ec2-user/migration

echo "✅ EC2 instance setup complete!"
EOF

# Launch EC2 instance
echo "🚀 Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type $INSTANCE_TYPE \
  --key-name $KEY_NAME \
  --subnet-id $RDS_SUBNET \
  --security-group-ids $SG_ID \
  --user-data file:///tmp/user-data.sh \
  --region $REGION \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "Instance ID: $INSTANCE_ID"
echo "Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo ""
echo "✅ EC2 instance is ready!"
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo ""
echo "SSH command:"
echo "ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP"
echo ""
echo "Next steps:"
echo "1. SSH into the instance"
echo "2. Run the migration script"

