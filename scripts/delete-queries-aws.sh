#!/bin/bash

# Delete existing queries from itinerary_queries table via AWS Lambda
# This prevents conflicts with the new flow where query form appears after card clicks

set -e

LAMBDA_FUNCTION_NAME="${DATABASE_LAMBDA_NAME:-travel-app-database-service}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🗑️  Deleting existing queries from itinerary_queries table"
echo "=========================================================="
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# Function to execute SQL on RDS via Lambda
execute_rds_sql() {
    local sql=$1
    local escaped_sql=$(echo "$sql" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read().strip()))")
    
    local payload=$(cat <<EOF
{
  "action": "query",
  "query": $escaped_sql,
  "params": []
}
EOF
)
    
    echo "Executing SQL via Lambda..."
    aws lambda invoke \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --region "$AWS_REGION" \
        --payload "$(echo "$payload" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin)))")" \
        /tmp/rds-response.json
    
    if [ $? -eq 0 ]; then
        echo "✅ Query executed successfully"
        cat /tmp/rds-response.json | python3 -m json.tool
        echo ""
    else
        echo "❌ Failed to execute query"
        cat /tmp/rds-response.json
        exit 1
    fi
}

# Step 1: Count existing queries
echo "📊 Step 1: Counting existing queries..."
COUNT_QUERY="SELECT COUNT(*) as count FROM itinerary_queries"
COUNT_RESULT=$(execute_rds_sql "$COUNT_QUERY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('body', {}).get('rows', [{}])[0].get('count', 0) if isinstance(data.get('body', {}).get('rows', []), list) and len(data.get('body', {}).get('rows', [])) > 0 else 0)" 2>/dev/null || echo "0")
echo "Found $COUNT_RESULT queries"
echo ""

# Step 2: Delete all queries
if [ "$COUNT_RESULT" != "0" ]; then
    echo "🗑️  Step 2: Deleting all queries..."
    DELETE_QUERY="DELETE FROM itinerary_queries"
    execute_rds_sql "$DELETE_QUERY"
    echo ""
    
    # Step 3: Verify deletion
    echo "✅ Step 3: Verifying deletion..."
    VERIFY_QUERY="SELECT COUNT(*) as remaining_queries FROM itinerary_queries"
    REMAINING=$(execute_rds_sql "$VERIFY_QUERY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('body', {}).get('rows', [{}])[0].get('remaining_queries', 0) if isinstance(data.get('body', {}).get('rows', []), list) and len(data.get('body', {}).get('rows', [])) > 0 else 0)" 2>/dev/null || echo "0")
    
    if [ "$REMAINING" = "0" ]; then
        echo "✅ Success! All queries deleted. Remaining: $REMAINING"
    else
        echo "⚠️  Warning: $REMAINING queries still remain"
    fi
else
    echo "ℹ️  No queries found. Nothing to delete."
fi

echo ""
echo "✅ Done!"
