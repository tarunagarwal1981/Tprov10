#!/bin/bash

# Setup Environment Variables and Test AWS Connection
# This script sets up all environment variables and tests AWS connectivity

set -e

echo "🔧 Setting up environment variables..."
echo ""

# Set all environment variables
export COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9
export COGNITO_USER_POOL_ID=us-east-1_oF5qfa2IX
export DATABASE_LAMBDA_NAME=travel-app-database-service
export DEPLOYMENT_REGION=us-east-1
export AWS_REGION=us-east-1
export RDS_DB="${RDS_DB:-postgres}"
export RDS_DATABASE="${RDS_DATABASE:-postgres}"
export RDS_HOST="${RDS_HOST:-travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com}"
export RDS_HOSTNAME="${RDS_HOSTNAME:-travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com}"
export RDS_PASSWORD="${RDS_PASSWORD:-${PGPASSWORD}}"
export RDS_PORT="${RDS_PORT:-5432}"
export RDS_USER="${RDS_USER:-postgres}"
export RDS_USERNAME="${RDS_USERNAME:-postgres}"

# Validate required password
if [ -z "$RDS_PASSWORD" ]; then
    echo "⚠️  Warning: RDS_PASSWORD or PGPASSWORD not set"
    echo "💡 Please set it before running database operations:"
    echo "   export RDS_PASSWORD=your_password"
fi

echo "✅ Environment variables set"
echo ""

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI not found. Installing..."
    
    # Try pip installation
    if python3 -m pip install --user awscli 2>&1 | grep -q "Successfully installed"; then
        export PATH="$HOME/Library/Python/3.9/bin:$PATH"
        echo "✅ AWS CLI installed via pip"
    else
        echo "❌ Failed to install AWS CLI"
        echo "💡 Please install manually or provide AWS credentials"
        exit 1
    fi
fi

# Verify AWS CLI
echo "🔍 Checking AWS CLI..."
aws --version
echo ""

# Test AWS credentials
echo "🔐 Testing AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    echo "✅ AWS credentials are valid!"
    aws sts get-caller-identity
    echo ""
else
    echo "⚠️  AWS credentials not configured"
    echo "💡 You may need to:"
    echo "   1. Run: aws configure"
    echo "   2. Or set: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    echo ""
    echo "⚠️  Continuing with Lambda test (may use IAM role if available)..."
fi

# Test Lambda function
echo "🔌 Testing Lambda function connection..."
LAMBDA_FUNCTION_NAME="${DATABASE_LAMBDA_NAME:-travel-app-database-service}"
AWS_REGION="${AWS_REGION:-us-east-1}"

TEST_PAYLOAD='{"action":"test"}'
TEST_RESPONSE=$(aws lambda invoke \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$AWS_REGION" \
    --payload "$TEST_PAYLOAD" \
    /tmp/lambda-test-response.json 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ Lambda function is accessible!"
    TEST_RESULT=$(cat /tmp/lambda-test-response.json | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); print('DB Time:', body.get('time', 'N/A'))" 2>/dev/null || echo "Response received")
    echo "$TEST_RESULT"
    echo ""
    
    echo "✅ All connections successful!"
    echo ""
    echo "🚀 Ready to verify tables. Run:"
    echo "   ./scripts/verify-tables-aws.sh"
else
    echo "❌ Lambda function test failed"
    echo "$TEST_RESPONSE"
    echo ""
    echo "💡 This might be due to:"
    echo "   1. Missing AWS credentials"
    echo "   2. Lambda function doesn't exist"
    echo "   3. No permission to invoke Lambda"
    echo ""
    echo "⚠️  You may need AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
fi

echo ""
echo "📋 Current Environment:"
echo "   DATABASE_LAMBDA_NAME: $DATABASE_LAMBDA_NAME"
echo "   AWS_REGION: $AWS_REGION"
echo "   RDS_HOSTNAME: $RDS_HOSTNAME"
echo "   RDS_DATABASE: $RDS_DATABASE"
echo "   RDS_USERNAME: $RDS_USERNAME"

