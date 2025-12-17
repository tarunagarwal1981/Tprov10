#!/bin/bash

# Script to configure S3 CORS using root credentials
# Usage: ./configure-cors-root.sh

echo "🔧 S3 CORS Configuration Script (Root User)"
echo "============================================"
echo ""

# Check if AWS credentials are set
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "⚠️  AWS_ACCESS_KEY_ID not set"
    echo "Please set your root AWS credentials:"
    echo "  export AWS_ACCESS_KEY_ID=<your-root-access-key>"
    echo "  export AWS_SECRET_ACCESS_KEY=<your-root-secret-key>"
    echo "  export AWS_REGION=us-east-1"
    exit 1
fi

if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "⚠️  AWS_SECRET_ACCESS_KEY not set"
    exit 1
fi

BUCKET_NAME="travel-app-storage-1769"
REGION="${AWS_REGION:-us-east-1}"

echo "📦 Bucket: $BUCKET_NAME"
echo "📍 Region: $REGION"
echo ""

# Check if AWS CLI is available
if command -v aws &> /dev/null; then
    echo "✅ AWS CLI found"
    echo ""
    echo "Configuring CORS using AWS CLI..."
    
    aws s3api put-bucket-cors \
        --bucket "$BUCKET_NAME" \
        --region "$REGION" \
        --cors-configuration file://cors-config.json
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ CORS configured successfully!"
        echo ""
        echo "Verifying configuration..."
        aws s3api get-bucket-cors --bucket "$BUCKET_NAME" --region "$REGION"
    else
        echo "❌ Failed to configure CORS"
        exit 1
    fi
else
    echo "⚠️  AWS CLI not found"
    echo "Using Node.js script instead..."
    echo ""
    node fix-s3-cors.js
fi

echo ""
echo "✨ Done!"
echo "💡 CORS changes may take 1-2 minutes to propagate"
