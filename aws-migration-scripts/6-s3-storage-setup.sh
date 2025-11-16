#!/bin/bash
# ============================================================================
# S3 Storage Setup and Migration Script
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== S3 Storage Setup ===${NC}"

# Configuration
BUCKET_NAME="travel-app-storage"
AWS_REGION="us-east-1"

echo -e "${YELLOW}Step 1: Creating S3 Bucket...${NC}"

# Create S3 bucket
aws s3api create-bucket \
  --bucket "$BUCKET_NAME" \
  --region "$AWS_REGION" \
  --create-bucket-configuration LocationConstraint="$AWS_REGION" 2>/dev/null || \
  aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$AWS_REGION"

echo -e "${GREEN}✅ S3 Bucket created: ${BUCKET_NAME}${NC}"

echo -e "${YELLOW}Step 2: Configuring bucket settings...${NC}"

# Block public access (we'll use CloudFront)
aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled

# Enable server-side encryption
aws s3api put-bucket-encryption \
  --bucket "$BUCKET_NAME" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Configure lifecycle policy (optional - save costs)
aws s3api put-bucket-lifecycle-configuration \
  --bucket "$BUCKET_NAME" \
  --lifecycle-configuration '{
    "Rules": [
      {
        "Id": "IntelligentTieringRule",
        "Status": "Enabled",
        "Filter": {},
        "Transitions": [
          {
            "Days": 30,
            "StorageClass": "INTELLIGENT_TIERING"
          }
        ]
      },
      {
        "Id": "DeleteOldVersions",
        "Status": "Enabled",
        "Filter": {},
        "NoncurrentVersionExpiration": {
          "NoncurrentDays": 90
        }
      }
    ]
  }'

echo -e "${GREEN}✅ Bucket configured${NC}"

echo -e "${YELLOW}Step 3: Setting up CORS configuration...${NC}"

# CORS configuration
aws s3api put-bucket-cors \
  --bucket "$BUCKET_NAME" \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedOrigins": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedHeaders": ["*"],
        "MaxAgeSeconds": 3600
      }
    ]
  }'

echo -e "${GREEN}✅ CORS configured${NC}"

echo -e "${YELLOW}Step 4: Creating CloudFront Distribution...${NC}"

# Create OAI (Origin Access Identity)
OAI_OUTPUT=$(aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config \
    CallerReference="travel-app-$(date +%s)",Comment="Travel App S3 Access" \
  --output json)

OAI_ID=$(echo "$OAI_OUTPUT" | jq -r '.CloudFrontOriginAccessIdentity.Id')
OAI_CANONICAL_USER=$(echo "$OAI_OUTPUT" | jq -r '.CloudFrontOriginAccessIdentity.S3CanonicalUserId')

echo -e "${GREEN}✅ OAI created: ${OAI_ID}${NC}"

# Update S3 bucket policy to allow CloudFront access
aws s3api put-bucket-policy \
  --bucket "$BUCKET_NAME" \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [
      {
        \"Sid\": \"AllowCloudFrontOAI\",
        \"Effect\": \"Allow\",
        \"Principal\": {
          \"AWS\": \"arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity $OAI_ID\"
        },
        \"Action\": \"s3:GetObject\",
        \"Resource\": \"arn:aws:s3:::$BUCKET_NAME/*\"
      }
    ]
  }"

# Create CloudFront distribution
DISTRIBUTION_CONFIG=$(cat <<EOF
{
  "CallerReference": "travel-app-$(date +%s)",
  "Comment": "Travel App CDN",
  "Enabled": true,
  "DefaultRootObject": "",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-${BUCKET_NAME}",
        "DomainName": "${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": "origin-access-identity/cloudfront/${OAI_ID}"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-${BUCKET_NAME}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": { "Forward": "none" }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  }
}
EOF
)

DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution \
  --distribution-config "$DISTRIBUTION_CONFIG" \
  --output json)

DISTRIBUTION_ID=$(echo "$DISTRIBUTION_OUTPUT" | jq -r '.Distribution.Id')
DISTRIBUTION_DOMAIN=$(echo "$DISTRIBUTION_OUTPUT" | jq -r '.Distribution.DomainName')

echo -e "${GREEN}✅ CloudFront Distribution created${NC}"
echo -e "Distribution ID: ${DISTRIBUTION_ID}"
echo -e "Domain: ${DISTRIBUTION_DOMAIN}"

echo -e "${GREEN}=== S3 Setup Complete ===${NC}"
echo ""
echo -e "=== SAVE THESE VALUES ==="
echo -e "S3_BUCKET_NAME=${BUCKET_NAME}"
echo -e "S3_REGION=${AWS_REGION}"
echo -e "CLOUDFRONT_DISTRIBUTION_ID=${DISTRIBUTION_ID}"
echo -e "CLOUDFRONT_DOMAIN=${DISTRIBUTION_DOMAIN}"
echo ""
echo -e "${YELLOW}Next step: Run migration script 7-migrate-storage.ts${NC}"


