#!/bin/bash

# Complete Environment Setup and AWS Connection Test
# This script sets up all environment variables and tests AWS connectivity

set -e

echo "🚀 Complete AWS Setup and Connection Test"
echo "=========================================="
echo ""

# Set all provided environment variables
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

# Add AWS CLI to PATH if installed via pip
export PATH="$HOME/Library/Python/3.9/bin:$PATH"

echo "✅ Environment variables configured:"
echo "   DATABASE_LAMBDA_NAME: $DATABASE_LAMBDA_NAME"
echo "   AWS_REGION: $AWS_REGION"
echo "   RDS_HOSTNAME: $RDS_HOSTNAME"
echo "   RDS_DATABASE: $RDS_DATABASE"
echo "   RDS_USERNAME: $RDS_USERNAME"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found"
    echo "💡 Installing AWS CLI..."
    python3 -m pip install --user awscli --quiet
    export PATH="$HOME/Library/Python/3.9/bin:$PATH"
fi

echo "✅ AWS CLI: $(aws --version 2>&1 | head -1)"
echo ""

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if [ -z "$AWS_ACCESS_KEY_ID" ] && [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    # Check if credentials file exists
    if [ -f ~/.aws/credentials ]; then
        echo "✅ Found AWS credentials file: ~/.aws/credentials"
        # Try to test
        if aws sts get-caller-identity &> /dev/null; then
            echo "✅ AWS credentials are valid!"
            aws sts get-caller-identity
        else
            echo "⚠️  Credentials file exists but authentication failed"
            echo "💡 Please provide AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
            MISSING_CREDS=true
        fi
    else
        echo "⚠️  AWS credentials not found"
        echo "💡 Please provide:"
        echo "   - AWS_ACCESS_KEY_ID"
        echo "   - AWS_SECRET_ACCESS_KEY"
        MISSING_CREDS=true
    fi
else
    echo "✅ AWS credentials found in environment"
    if aws sts get-caller-identity &> /dev/null; then
        echo "✅ AWS credentials are valid!"
        aws sts get-caller-identity
    else
        echo "❌ AWS credentials are invalid"
        MISSING_CREDS=true
    fi
fi

echo ""

# Test Lambda function (if credentials available)
if [ "$MISSING_CREDS" != "true" ]; then
    echo "🔌 Testing Lambda function connection..."
    TEST_PAYLOAD='{"action":"test"}'
    
    if aws lambda invoke \
        --function-name "$DATABASE_LAMBDA_NAME" \
        --region "$AWS_REGION" \
        --payload "$TEST_PAYLOAD" \
        /tmp/lambda-test-response.json &> /dev/null; then
        
        TEST_RESULT=$(cat /tmp/lambda-test-response.json | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); print('✅ Lambda connected! DB Time:', body.get('time', 'N/A'))" 2>/dev/null || echo "✅ Lambda response received")
        echo "$TEST_RESULT"
        echo ""
        echo "✅ All connections successful!"
        echo ""
        echo "🚀 Ready to verify tables. Run:"
        echo "   ./scripts/verify-tables-aws.sh"
    else
        ERROR_MSG=$(cat /tmp/lambda-test-response.json 2>/dev/null || echo "Unknown error")
        echo "❌ Lambda function test failed"
        echo "   Error: $ERROR_MSG"
        echo ""
        echo "💡 Possible issues:"
        echo "   1. Lambda function doesn't exist: $DATABASE_LAMBDA_NAME"
        echo "   2. No permission to invoke Lambda"
        echo "   3. Lambda function is in different region"
    fi
else
    echo "⚠️  Skipping Lambda test (credentials needed)"
    echo ""
    echo "📋 To complete setup, provide:"
    echo "   export AWS_ACCESS_KEY_ID=your-access-key-id"
    echo "   export AWS_SECRET_ACCESS_KEY=your-secret-access-key"
    echo ""
    echo "Then run this script again or:"
    echo "   ./scripts/verify-tables-aws.sh"
fi

echo ""
echo "📋 Summary:"
echo "   ✅ Environment variables: SET"
echo "   ✅ AWS CLI: INSTALLED"
if [ "$MISSING_CREDS" = "true" ]; then
    echo "   ⚠️  AWS Credentials: NEEDED"
else
    echo "   ✅ AWS Credentials: CONFIGURED"
fi

