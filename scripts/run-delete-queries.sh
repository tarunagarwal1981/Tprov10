#!/bin/bash

# Quick script to delete queries via AWS Lambda
# This script uses AWS CLI to invoke the Lambda function

LAMBDA_FUNCTION_NAME="${DATABASE_LAMBDA_NAME:-travel-app-database-service}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🗑️  Deleting existing queries from itinerary_queries table"
echo "=========================================================="
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found"
    echo ""
    echo "Please install AWS CLI first:"
    echo "  macOS: brew install awscli"
    echo "  Or visit: https://aws.amazon.com/cli/"
    echo ""
    echo "Alternatively, you can:"
    echo "  1. Start your dev server: npm run dev"
    echo "  2. Run: curl -X POST http://localhost:3000/api/admin/delete-queries"
    exit 1
fi

# Check credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo "Please run: aws configure"
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# Count queries
echo "📊 Counting existing queries..."
COUNT_PAYLOAD='{"action":"query","query":"SELECT COUNT(*) as count FROM itinerary_queries","params":[]}'
aws lambda invoke \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$AWS_REGION" \
    --payload "$COUNT_PAYLOAD" \
    /tmp/count-result.json > /dev/null 2>&1

COUNT=$(cat /tmp/count-result.json | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('body', {}).get('rows', [{}])[0].get('count', 0) if isinstance(d.get('body', {}).get('rows', []), list) and len(d.get('body', {}).get('rows', [])) > 0 else 0)" 2>/dev/null || echo "0")

echo "Found $COUNT queries"
echo ""

if [ "$COUNT" != "0" ]; then
    # Delete queries
    echo "🗑️  Deleting all queries..."
    DELETE_PAYLOAD='{"action":"query","query":"DELETE FROM itinerary_queries","params":[]}'
    aws lambda invoke \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --region "$AWS_REGION" \
        --payload "$DELETE_PAYLOAD" \
        /tmp/delete-result.json > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Delete query executed"
        echo ""
        
        # Verify
        echo "✅ Verifying deletion..."
        VERIFY_PAYLOAD='{"action":"query","query":"SELECT COUNT(*) as remaining_queries FROM itinerary_queries","params":[]}'
        aws lambda invoke \
            --function-name "$LAMBDA_FUNCTION_NAME" \
            --region "$AWS_REGION" \
            --payload "$VERIFY_PAYLOAD" \
            /tmp/verify-result.json > /dev/null 2>&1
        
        REMAINING=$(cat /tmp/verify-result.json | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('body', {}).get('rows', [{}])[0].get('remaining_queries', 0) if isinstance(d.get('body', {}).get('rows', []), list) and len(d.get('body', {}).get('rows', [])) > 0 else 0)" 2>/dev/null || echo "0")
        
        if [ "$REMAINING" = "0" ]; then
            echo "✅ Success! All queries deleted. Remaining: $REMAINING"
        else
            echo "⚠️  Warning: $REMAINING queries still remain"
        fi
    else
        echo "❌ Failed to delete queries"
        cat /tmp/delete-result.json
        exit 1
    fi
else
    echo "ℹ️  No queries found. Nothing to delete."
fi

echo ""
echo "✅ Done!"
