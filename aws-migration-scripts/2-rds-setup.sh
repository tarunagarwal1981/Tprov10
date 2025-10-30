#!/bin/bash
# ============================================================================
# RDS PostgreSQL Setup Script
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== AWS RDS PostgreSQL Setup ===${NC}"

# Configuration
DB_INSTANCE_ID="travel-app-db"
DB_INSTANCE_CLASS="db.t4g.medium"
DB_ENGINE="postgres"
DB_ENGINE_VERSION="15.4"
DB_MASTER_USERNAME="postgres"
DB_MASTER_PASSWORD="" # Set this securely
DB_ALLOCATED_STORAGE="100"
DB_STORAGE_TYPE="gp3"
VPC_SECURITY_GROUP_IDS="" # Your security group ID
DB_SUBNET_GROUP_NAME="" # Your subnet group name
AWS_REGION="us-east-1"

# Check if required variables are set
if [ -z "$DB_MASTER_PASSWORD" ]; then
  echo -e "${YELLOW}Please set DB_MASTER_PASSWORD in the script${NC}"
  exit 1
fi

echo -e "${YELLOW}Creating RDS instance: ${DB_INSTANCE_ID}${NC}"

aws rds create-db-instance \
  --db-instance-identifier "$DB_INSTANCE_ID" \
  --db-instance-class "$DB_INSTANCE_CLASS" \
  --engine "$DB_ENGINE" \
  --engine-version "$DB_ENGINE_VERSION" \
  --master-username "$DB_MASTER_USERNAME" \
  --master-user-password "$DB_MASTER_PASSWORD" \
  --allocated-storage "$DB_ALLOCATED_STORAGE" \
  --storage-type "$DB_STORAGE_TYPE" \
  --storage-encrypted \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --vpc-security-group-ids "$VPC_SECURITY_GROUP_IDS" \
  --db-subnet-group-name "$DB_SUBNET_GROUP_NAME" \
  --publicly-accessible false \
  --multi-az false \
  --auto-minor-version-upgrade true \
  --deletion-protection true \
  --enable-performance-insights \
  --performance-insights-retention-period 7 \
  --region "$AWS_REGION"

echo -e "${GREEN}✅ RDS instance creation initiated${NC}"
echo -e "${YELLOW}Waiting for instance to be available (this may take 10-15 minutes)...${NC}"

# Wait for instance to be available
aws rds wait db-instance-available \
  --db-instance-identifier "$DB_INSTANCE_ID" \
  --region "$AWS_REGION"

echo -e "${GREEN}✅ RDS instance is now available!${NC}"

# Get the endpoint
ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "$DB_INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo -e "${GREEN}=== RDS Instance Details ===${NC}"
echo -e "Instance ID: ${DB_INSTANCE_ID}"
echo -e "Endpoint: ${ENDPOINT}"
echo -e "Port: 5432"
echo -e "Master Username: ${DB_MASTER_USERNAME}"
echo ""
echo -e "Connection string:"
echo -e "postgresql://${DB_MASTER_USERNAME}:${DB_MASTER_PASSWORD}@${ENDPOINT}:5432/postgres"
echo ""
echo -e "${YELLOW}Save these details securely!${NC}"
echo -e "Next step: Import database using script 3-database-import.sh"

