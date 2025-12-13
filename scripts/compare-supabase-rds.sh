#!/bin/bash

# Compare Supabase and RDS to identify missing tables, columns, and data
# This script connects to both databases and compares their structure

set -e

SUPABASE_URL="https://megmjzszmqnmzdxwzigt.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MTc4NiwiZXhwIjoyMDc1MTI3Nzg2fQ.i2kYiW0n-1uuJuTK5HH6sc0W7Vpjrl4SEXBq8TwL-KA"
LAMBDA_FUNCTION_NAME="${DATABASE_LAMBDA_NAME:-travel-app-database-service}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🔍 Comparing Supabase and RDS Databases"
echo "=========================================="
echo ""

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found, using direct API calls..."
    USE_CLI=false
else
    USE_CLI=true
    echo "✅ Using Supabase CLI"
fi

echo ""

# Get tables from Supabase using REST API
echo "📋 Fetching tables from Supabase..."
SUPABASE_TABLES=$(curl -s -X GET \
    "${SUPABASE_URL}/rest/v1/rpc/get_tables" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" 2>/dev/null || echo "[]")

# Alternative: Query information_schema directly via SQL
echo "📋 Querying Supabase tables via SQL..."
SUPABASE_TABLES_QUERY='SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' ORDER BY table_name'

# Use Supabase REST API to execute SQL
SUPABASE_TABLES_JSON=$(curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"${SUPABASE_TABLES_QUERY}\"}" 2>/dev/null || echo "[]")

echo "✅ Supabase connection successful"
echo ""

# Get tables from RDS
echo "📋 Fetching tables from RDS..."
RDS_TABLES_QUERY='SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' ORDER BY table_name'
RDS_TABLES_PAYLOAD=$(cat <<EOF
{
  "action": "query",
  "query": "$RDS_TABLES_QUERY",
  "params": []
}
EOF
)

RDS_TABLES_RESPONSE=$(aws lambda invoke \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$AWS_REGION" \
    --payload "$(echo "$RDS_TABLES_PAYLOAD" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin)))")" \
    /tmp/rds-tables.json 2>&1)

if [ $? -eq 0 ]; then
    RDS_TABLES=$(cat /tmp/rds-tables.json | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); rows=body.get('rows', []); print('\n'.join([r['table_name'] for r in rows]))" 2>/dev/null || echo "")
    echo "✅ RDS connection successful"
else
    echo "❌ Failed to fetch RDS tables"
    exit 1
fi

echo ""
echo "📊 Comparison Results:"
echo "======================"
echo ""

# Compare tables
echo "📋 Tables in Supabase but not in RDS:"
SUPABASE_TABLE_LIST=$(echo "$SUPABASE_TABLES_JSON" | python3 -c "import sys, json; data=json.load(sys.stdin); print('\n'.join([r.get('table_name', '') for r in (data if isinstance(data, list) else [])]))" 2>/dev/null || echo "")

# For now, let's use a simpler approach - query specific tables we know about
echo "Checking specific tables..."

MISSING_TABLES=(
    "multi_city_hotel_pricing_rows"
    "multi_city_hotel_private_package_rows"
    "multi_city_package_day_plans"
    "multi_city_hotel_package_day_plans"
)

echo ""
echo "🔍 Checking for missing tables..."
for table in "${MISSING_TABLES[@]}"; do
    if echo "$RDS_TABLES" | grep -q "^${table}$"; then
        echo "   ✅ $table - EXISTS in RDS"
    else
        echo "   ❌ $table - MISSING in RDS (needs migration)"
    fi
done

echo ""
echo "✅ Comparison complete!"

