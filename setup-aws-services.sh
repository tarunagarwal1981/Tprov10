#!/bin/bash
# AWS Services Setup Script
# Sets up SNS (SMS), SES (Email), and S3 (Documents) for OTP Authentication

set -e

REGION="us-east-1"
BUCKET_NAME="travclan-documents"

echo "========================================"
echo "AWS Services Setup for OTP Authentication"
echo "========================================"
echo ""

# ============================================================================
# 1. AWS SNS (SMS) Setup
# ============================================================================
echo "1. Setting up AWS SNS (SMS)..."
echo ""

# Check current SMS attributes
echo "Checking current SNS SMS configuration..."
aws sns get-sms-attributes --region $REGION || echo "No existing SMS attributes found."

# Set default sender ID
echo ""
echo "Setting default sender ID to 'TRAVCLAN'..."
aws sns set-sms-attributes --attributes DefaultSenderID=TRAVCLAN --region $REGION

if [ $? -eq 0 ]; then
    echo "✓ Sender ID set successfully"
else
    echo "✗ Failed to set sender ID"
fi

# Check account attributes
echo ""
echo "Checking account status..."
aws sns get-sms-attributes --attribute-names MonthlySpendLimit --region $REGION || true

echo ""
echo "NOTE: If you're in sandbox mode, you need to request production access:"
echo "  - Go to: https://console.aws.amazon.com/sns/v3/home?region=$REGION#/text-messaging/account"
echo "  - Click 'Request production access'"
echo ""

# ============================================================================
# 2. AWS SES (Email) Setup
# ============================================================================
echo "2. Setting up AWS SES (Email)..."
echo ""

# Check account sending status
echo "Checking SES account status..."
SES_STATUS=$(aws ses get-account-sending-enabled --region $REGION 2>&1 || echo "{}")
echo "$SES_STATUS"

# List verified identities
echo ""
echo "Checking verified email addresses/domains..."
IDENTITIES=$(aws ses list-identities --region $REGION 2>&1 || echo '{"Identities":[]}')

IDENTITY_COUNT=$(echo "$IDENTITIES" | jq -r '.Identities | length' 2>/dev/null || echo "0")

if [ "$IDENTITY_COUNT" -eq 0 ]; then
    echo "⚠ No verified identities found"
    echo ""
    echo "To verify an email address, run:"
    echo "  aws ses verify-email-identity --email-address noreply@yourdomain.com --region $REGION"
    echo ""
    echo "Or verify a domain via AWS Console:"
    echo "  https://console.aws.amazon.com/ses/home?region=$REGION#/verified-identities"
else
    echo "Verified identities:"
    echo "$IDENTITIES" | jq -r '.Identities[]' | while read identity; do
        echo "  - $identity"
    done
fi

echo ""

# ============================================================================
# 3. AWS S3 (Document Storage) Setup
# ============================================================================
echo "3. Setting up AWS S3 (Document Storage)..."
echo ""

# Check if bucket exists
echo "Checking if bucket '$BUCKET_NAME' exists..."
if aws s3 ls "s3://$BUCKET_NAME" --region $REGION 2>/dev/null; then
    echo "✓ Bucket '$BUCKET_NAME' already exists"
else
    echo "Bucket does not exist. Creating..."
    
    # Create bucket
    echo "Creating bucket '$BUCKET_NAME'..."
    if [ "$REGION" = "us-east-1" ]; then
        aws s3api create-bucket --bucket $BUCKET_NAME --region $REGION
    else
        aws s3api create-bucket --bucket $BUCKET_NAME --region $REGION \
            --create-bucket-configuration LocationConstraint=$REGION
    fi
    
    if [ $? -eq 0 ]; then
        echo "✓ Bucket created successfully"
    else
        echo "✗ Failed to create bucket"
        exit 1
    fi
fi

# Enable versioning
echo ""
echo "Enabling versioning on bucket..."
aws s3api put-bucket-versioning --bucket $BUCKET_NAME \
    --versioning-configuration Status=Enabled --region $REGION

if [ $? -eq 0 ]; then
    echo "✓ Versioning enabled"
fi

# Configure CORS
echo ""
echo "Configuring CORS..."

cat > cors-config.json <<EOF
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "http://localhost:3000",
        "https://*.amplifyapp.com",
        "https://*.netlify.app"
      ],
      "ExposeHeaders": ["ETag", "x-amz-server-side-encryption"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file://cors-config.json --region $REGION

if [ $? -eq 0 ]; then
    echo "✓ CORS configured successfully"
fi

rm -f cors-config.json

# Block public access
echo ""
echo "Ensuring public access is blocked..."

cat > public-access-config.json <<EOF
{
  "BlockPublicAcls": true,
  "IgnorePublicAcls": true,
  "BlockPublicPolicy": true,
  "RestrictPublicBuckets": true
}
EOF

aws s3api put-public-access-block --bucket $BUCKET_NAME \
    --public-access-block-configuration file://public-access-config.json --region $REGION

if [ $? -eq 0 ]; then
    echo "✓ Public access blocked"
fi

rm -f public-access-config.json

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "========================================"
echo "Setup Summary"
echo "========================================"
echo ""

echo "✓ SNS (SMS):"
echo "  - Sender ID: TRAVCLAN"
echo "  - Action needed: Request production access if in sandbox"
echo ""

echo "✓ SES (Email):"
echo "  - Action needed: Verify email address or domain"
echo "  - Action needed: Request production access if in sandbox"
echo ""

echo "✓ S3 (Documents):"
echo "  - Bucket: $BUCKET_NAME"
echo "  - Versioning: Enabled"
echo "  - CORS: Configured"
echo ""

echo "========================================"
echo "Next Steps:"
echo "========================================"
echo ""
echo "1. Verify SES email/domain:"
echo "   aws ses verify-email-identity --email-address noreply@yourdomain.com --region $REGION"
echo ""
echo "2. Request production access for SNS and SES (if needed):"
echo "   - SNS: https://console.aws.amazon.com/sns/v3/home?region=$REGION#/text-messaging/account"
echo "   - SES: https://console.aws.amazon.com/ses/home?region=$REGION#/account"
echo ""
echo "3. Update your .env.local with:"
echo "   SMS_SENDER_ID=TRAVCLAN"
echo "   SES_FROM_EMAIL=noreply@yourdomain.com"
echo "   SES_FROM_NAME=TravClan"
echo "   S3_DOCUMENTS_BUCKET=$BUCKET_NAME"
echo ""

