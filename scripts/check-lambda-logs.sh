#!/bin/bash

# Script to check Lambda CloudWatch logs for database errors
# Usage: ./scripts/check-lambda-logs.sh [number-of-lines]

set -e

LAMBDA_FUNCTION_NAME="${DATABASE_LAMBDA_NAME:-travel-app-database-service}"
AWS_REGION="${AWS_REGION:-us-east-1}"
LINES="${1:-50}"

echo "📋 Checking Lambda CloudWatch logs for: $LAMBDA_FUNCTION_NAME"
echo "🌍 Region: $AWS_REGION"
echo "📊 Last $LINES lines"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found"
    exit 1
fi

# Check credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo "💡 Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# Get log group name
LOG_GROUP="/aws/lambda/$LAMBDA_FUNCTION_NAME"

# Check if log group exists
if ! aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --region "$AWS_REGION" --query "logGroups[?logGroupName=='$LOG_GROUP']" --output text | grep -q "$LOG_GROUP"; then
    echo "⚠️  Log group not found: $LOG_GROUP"
    echo "💡 The Lambda might not have been invoked yet, or logging might not be configured"
    exit 1
fi

# Get recent log streams
echo "🔍 Fetching recent log streams..."
LOG_STREAMS=$(aws logs describe-log-streams \
    --log-group-name "$LOG_GROUP" \
    --region "$AWS_REGION" \
    --order-by LastEventTime \
    --descending \
    --max-items 1 \
    --query "logStreams[0].logStreamName" \
    --output text)

if [ -z "$LOG_STREAMS" ] || [ "$LOG_STREAMS" == "None" ]; then
    echo "⚠️  No log streams found"
    exit 1
fi

echo "📝 Latest log stream: $LOG_STREAMS"
echo ""

# Get logs
echo "📋 Recent logs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
aws logs tail "$LOG_GROUP" \
    --region "$AWS_REGION" \
    --follow false \
    --format short \
    | tail -n "$LINES"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 To see errors only, run:"
echo "   aws logs tail $LOG_GROUP --region $AWS_REGION --format short | grep -i error"
