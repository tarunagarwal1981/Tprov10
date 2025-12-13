#!/bin/bash

# Check All Tables in RDS Database
# This script lists all tables in the RDS database without making any changes

set -e

LAMBDA_FUNCTION_NAME="${DATABASE_LAMBDA_NAME:-travel-app-database-service}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🔍 Checking RDS Database Tables"
echo "================================"
echo "📡 Using Lambda: $LAMBDA_FUNCTION_NAME"
echo "🌍 Region: $AWS_REGION"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found"
    exit 1
fi

# Check credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# Get all tables
echo "📋 Fetching all tables from RDS..."
ALL_TABLES_QUERY='SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' ORDER BY table_name'
ALL_TABLES_PAYLOAD=$(cat <<EOF
{
  "action": "query",
  "query": "$ALL_TABLES_QUERY",
  "params": []
}
EOF
)

ALL_TABLES_RESPONSE=$(aws lambda invoke \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$AWS_REGION" \
    --payload "$(echo "$ALL_TABLES_PAYLOAD" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin)))")" \
    /tmp/all-tables-response.json 2>&1)

if [ $? -eq 0 ]; then
    ALL_TABLES=$(cat /tmp/all-tables-response.json | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); rows=body.get('rows', []); print('\n'.join([r['table_name'] for r in rows]))" 2>/dev/null || echo "")
    
    echo "✅ Found $(echo "$ALL_TABLES" | wc -l | tr -d ' ') tables in database"
    echo ""
    echo "📊 All Tables:"
    echo "$ALL_TABLES" | while read table; do
        echo "   ✅ $table"
    done
else
    echo "❌ Failed to fetch tables"
    echo "$ALL_TABLES_RESPONSE"
    exit 1
fi

echo ""

# Check specifically for itinerary and multi_city tables
echo "🔍 Checking Itinerary & Multi-City Tables..."
ITINERARY_TABLES=(
    "itineraries"
    "itinerary_days"
    "itinerary_items"
)

MULTI_CITY_TABLES=(
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

echo ""
echo "📋 Itinerary Tables:"
for table in "${ITINERARY_TABLES[@]}"; do
    if echo "$ALL_TABLES" | grep -q "^${table}$"; then
        echo "   ✅ $table - EXISTS"
        
        # Check for time_slots column in itinerary_days
        if [ "$table" = "itinerary_days" ]; then
            COLUMN_CHECK_QUERY="SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '\''$table'\'' AND column_name = 'time_slots') as exists"
            COLUMN_CHECK_PAYLOAD=$(cat <<EOF
{
  "action": "query",
  "query": "$COLUMN_CHECK_QUERY",
  "params": []
}
EOF
)
            COLUMN_RESPONSE=$(aws lambda invoke \
                --function-name "$LAMBDA_FUNCTION_NAME" \
                --region "$AWS_REGION" \
                --payload "$(echo "$COLUMN_CHECK_PAYLOAD" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin)))")" \
                /tmp/column-check.json 2>&1)
            
            if [ $? -eq 0 ]; then
                HAS_COLUMN=$(cat /tmp/column-check.json | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); rows=body.get('rows', []); print('true' if rows and rows[0].get('exists') else 'false')" 2>/dev/null || echo "false")
                if [ "$HAS_COLUMN" = "true" ]; then
                    echo "      ✅ time_slots column exists"
                else
                    echo "      ⚠️  time_slots column missing (backward compatible)"
                fi
            fi
        fi
    else
        echo "   ❌ $table - NOT FOUND"
    fi
done

echo ""
echo "📋 Multi-City Package Tables:"
for table in "${MULTI_CITY_TABLES[@]}"; do
    if echo "$ALL_TABLES" | grep -q "^${table}$"; then
        echo "   ✅ $table - EXISTS"
    else
        echo "   ❌ $table - NOT FOUND"
    fi
done

echo ""
echo "✅ Table check complete!"

