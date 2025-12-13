#!/bin/bash

# Interactive AWS Credentials Setup
# This script helps you configure AWS credentials

set -e

echo "🔐 AWS Credentials Setup"
echo "========================"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed"
    echo "💡 Installing AWS CLI first..."
    ./scripts/install-aws-cli.sh
    echo ""
fi

echo "📝 Setting up AWS credentials..."
echo ""
echo "You can configure credentials in two ways:"
echo "1. Interactive (aws configure) - Recommended"
echo "2. Environment variables"
echo ""
read -p "Choose method (1 or 2): " method

if [ "$method" = "1" ]; then
    echo ""
    echo "Running: aws configure"
    echo "You'll be prompted for:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region (e.g., us-east-1)"
    echo "  - Default output format (json)"
    echo ""
    aws configure
    
    echo ""
    echo "✅ AWS CLI configured!"
    echo ""
    echo "Testing credentials..."
    if aws sts get-caller-identity &> /dev/null; then
        echo "✅ Credentials are valid!"
        aws sts get-caller-identity
    else
        echo "❌ Credentials test failed"
        exit 1
    fi
elif [ "$method" = "2" ]; then
    echo ""
    echo "Enter AWS credentials:"
    read -p "AWS Access Key ID: " access_key
    read -sp "AWS Secret Access Key: " secret_key
    echo ""
    read -p "AWS Region (default: us-east-1): " region
    region=${region:-us-east-1}
    
    export AWS_ACCESS_KEY_ID="$access_key"
    export AWS_SECRET_ACCESS_KEY="$secret_key"
    export AWS_REGION="$region"
    
    echo ""
    echo "✅ Environment variables set!"
    echo ""
    echo "Testing credentials..."
    if aws sts get-caller-identity &> /dev/null; then
        echo "✅ Credentials are valid!"
        aws sts get-caller-identity
        echo ""
        echo "💡 Add these to your shell profile (~/.zshrc or ~/.bashrc):"
        echo "export AWS_ACCESS_KEY_ID=\"$access_key\""
        echo "export AWS_SECRET_ACCESS_KEY=\"$secret_key\""
        echo "export AWS_REGION=\"$region\""
    else
        echo "❌ Credentials test failed"
        exit 1
    fi
else
    echo "❌ Invalid choice"
    exit 1
fi

echo ""
echo "📋 Additional Configuration:"
read -p "Lambda Function Name (default: travel-app-database-service): " lambda_name
lambda_name=${lambda_name:-travel-app-database-service}
export DATABASE_LAMBDA_NAME="$lambda_name"

echo ""
echo "✅ Setup complete!"
echo ""
echo "You can now run:"
echo "  ./scripts/verify-tables-aws.sh"
echo ""

