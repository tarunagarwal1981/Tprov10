#!/bin/bash

# Verify Itinerary Tables using AWS CLI/SDK
# This script uses AWS CLI to invoke Lambda and verify tables
#
# Prerequisites:
# - AWS CLI installed and configured
# - DATABASE_LAMBDA_NAME environment variable set (or uses default)
#
# Usage:
#   ./scripts/verify-tables-aws.sh

set -e

LAMBDA_FUNCTION_NAME="${DATABASE_LAMBDA_NAME:-travel-app-database-service}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🔍 Verifying itinerary tables in AWS RDS..."
echo "📡 Using Lambda: ${LAMBDA_FUNCTION_NAME}"
echo "🌍 Region: ${AWS_REGION}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed"
    echo "💡 Install it with: ./scripts/install-aws-cli.sh"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo "💡 Run: aws configure"
    echo "   Or set: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION"
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# Test Lambda connection
echo "🔌 Testing Lambda connection..."
TEST_PAYLOAD='{"action":"test"}'
TEST_RESPONSE=$(aws lambda invoke \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$AWS_REGION" \
    --payload "$TEST_PAYLOAD" \
    /tmp/lambda-test-response.json 2>&1)

if [ $? -ne 0 ]; then
    echo "❌ Failed to invoke Lambda function"
    echo "$TEST_RESPONSE"
    echo ""
    echo "💡 Check:"
    echo "   1. Lambda function name is correct: $LAMBDA_FUNCTION_NAME"
    echo "   2. You have permission to invoke Lambda"
    echo "   3. Lambda function exists in region: $AWS_REGION"
    exit 1
fi

TEST_RESULT=$(cat /tmp/lambda-test-response.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('body', '{}'))" 2>/dev/null || echo "{}")
echo "✅ Lambda connection successful"
echo ""

# Required tables
REQUIRED_TABLES=(
    "itineraries"
    "itinerary_days"
    "itinerary_items"
    "multi_city_packages"
    "multi_city_hotel_packages"
    "multi_city_pricing_packages"
    "multi_city_hotel_pricing_packages"
    "multi_city_pricing_rows"
    "multi_city_hotel_pricing_rows"
    "multi_city_private_package_rows"
    "multi_city_hotel_private_package_rows"
    "multi_city_package_day_plans"
    "multi_city_hotel_package_day_plans"
    "multi_city_package_cities"
    "multi_city_hotel_package_cities"
    "multi_city_hotel_package_city_hotels"
    "multi_city_package_images"
    "multi_city_hotel_package_images"
)

EXISTS_COUNT=0
MISSING_TABLES=()
HAS_TIME_SLOTS=false

# Check each table
for TABLE in "${REQUIRED_TABLES[@]}"; do
    QUERY="SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '\$1') as exists"
    PAYLOAD=$(cat <<EOF
{
  "action": "query",
  "query": "$QUERY",
  "params": ["$TABLE"]
}
EOF
)
    
    # Use python3 for JSON if jq is not available
    if command -v jq &> /dev/null; then
        PAYLOAD_JSON=$(echo "$PAYLOAD" | jq -c .)
    else
        PAYLOAD_JSON=$(python3 -c "import json, sys; print(json.dumps(json.loads(sys.stdin.read())))" <<< "$PAYLOAD")
    fi
    
    RESPONSE=$(aws lambda invoke \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --region "$AWS_REGION" \
        --payload "$PAYLOAD_JSON" \
        /tmp/lambda-response.json 2>&1)
    
    if [ $? -eq 0 ]; then
        RESULT=$(cat /tmp/lambda-response.json | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); rows=body.get('rows', []); print('true' if rows and rows[0].get('exists') else 'false')" 2>/dev/null || echo "false")
        
        if [ "$RESULT" = "true" ]; then
            echo "✅ $TABLE - EXISTS"
            ((EXISTS_COUNT++))
            
            # Check time_slots column for itinerary_days
            if [ "$TABLE" = "itinerary_days" ]; then
                COLUMN_QUERY="SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '\$1' AND column_name = 'time_slots') as exists"
                COLUMN_PAYLOAD=$(cat <<EOF
{
  "action": "query",
  "query": "$COLUMN_QUERY",
  "params": ["$TABLE"]
}
EOF
)
                if command -v jq &> /dev/null; then
                    COLUMN_PAYLOAD_JSON=$(echo "$COLUMN_PAYLOAD" | jq -c .)
                else
                    COLUMN_PAYLOAD_JSON=$(python3 -c "import json, sys; print(json.dumps(json.loads(sys.stdin.read())))" <<< "$COLUMN_PAYLOAD")
                fi
                
                COLUMN_RESPONSE=$(aws lambda invoke \
                    --function-name "$LAMBDA_FUNCTION_NAME" \
                    --region "$AWS_REGION" \
                    --payload "$COLUMN_PAYLOAD_JSON" \
                    /tmp/lambda-column-response.json 2>&1)
                
                if [ $? -eq 0 ]; then
                    COLUMN_RESULT=$(cat /tmp/lambda-column-response.json | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); rows=body.get('rows', []); print('true' if rows and rows[0].get('exists') else 'false')" 2>/dev/null || echo "false")
                    if [ "$COLUMN_RESULT" = "true" ]; then
                        HAS_TIME_SLOTS=true
                        echo "   ✅ time_slots column exists"
                    else
                        echo "   ⚠️  time_slots column missing (backward compatible)"
                    fi
                fi
            fi
        else
            echo "❌ $TABLE - MISSING"
            MISSING_TABLES+=("$TABLE")
        fi
    else
        echo "❌ $TABLE - ERROR checking"
        MISSING_TABLES+=("$TABLE")
    fi
done

# Summary
echo ""
echo "📊 Summary:"
echo "✅ Tables found: $EXISTS_COUNT/${#REQUIRED_TABLES[@]}"
echo "❌ Tables missing: ${#MISSING_TABLES[@]}"
echo "✅ time_slots column: $([ "$HAS_TIME_SLOTS" = "true" ] && echo "EXISTS" || echo "MISSING (backward compatible)")"

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Missing tables:"
    for TABLE in "${MISSING_TABLES[@]}"; do
        echo "   - $TABLE"
    done
    echo ""
    echo "💡 Run migrations to create missing tables"
    echo "   Use: ./scripts/migrate-tables-aws.sh"
    exit 1
else
    echo ""
    echo "✅ All required tables exist!"
    if [ "$HAS_TIME_SLOTS" != "true" ]; then
        echo ""
        echo "💡 Note: time_slots column is missing but code handles this gracefully"
        echo "   To add it: Run migration 017_enhance_itinerary_days.sql"
    fi
    exit 0
fi

