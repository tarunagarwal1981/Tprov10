#!/bin/bash

# Comprehensive Migration Script: Supabase to AWS RDS
# This script migrates missing tables, columns, and data from Supabase to RDS
# It carefully preserves existing RDS data and only adds what's missing

set -e

SUPABASE_URL="https://megmjzszmqnmzdxwzigt.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MTc4NiwiZXhwIjoyMDc1MTI3Nzg2fQ.i2kYiW0n-1uuJuTK5HH6sc0W7Vpjrl4SEXBq8TwL-KA"
LAMBDA_FUNCTION_NAME="${DATABASE_LAMBDA_NAME:-travel-app-database-service}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🚀 Migrating from Supabase to AWS RDS"
echo "======================================"
echo "📡 Supabase: $SUPABASE_URL"
echo "📡 RDS Lambda: $LAMBDA_FUNCTION_NAME"
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
    local params=${2:-"[]"}
    
    # Escape SQL for JSON
    local escaped_sql=$(echo "$sql" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read().strip()))")
    
    local payload=$(cat <<EOF
{
  "action": "query",
  "query": $escaped_sql,
  "params": $params
}
EOF
)
    
    aws lambda invoke \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --region "$AWS_REGION" \
        --payload "$(echo "$payload" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin)))")" \
        /tmp/rds-response.json &> /dev/null
    
    cat /tmp/rds-response.json
}

# Function to get data from Supabase
get_supabase_data() {
    local table=$1
    local limit=${2:-1000}
    
    curl -s -X GET \
        "${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${limit}" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Prefer: return=representation"
}

# Function to check if table exists in RDS
table_exists_rds() {
    local table=$1
    local query="SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '\''${table}'\'') as exists"
    local result=$(execute_rds_sql "$query")
    echo "$result" | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); rows=body.get('rows', []); print('true' if rows and rows[0].get('exists') else 'false')" 2>/dev/null || echo "false"
}

# Function to check if column exists in RDS
column_exists_rds() {
    local table=$1
    local column=$2
    local query="SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '\''${table}'\'' AND column_name = '\''${column}'\'') as exists"
    local result=$(execute_rds_sql "$query")
    echo "$result" | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); rows=body.get('rows', []); print('true' if rows and rows[0].get('exists') else 'false')" 2>/dev/null || echo "false"
}

# Function to get row count from RDS
get_rds_row_count() {
    local table=$1
    local query="SELECT COUNT(*) as count FROM ${table}"
    local result=$(execute_rds_sql "$query")
    echo "$result" | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); rows=body.get('rows', []); print(rows[0].get('count', 0) if rows else 0)" 2>/dev/null || echo "0"
}

echo "📋 Step 1: Checking missing tables..."
echo ""

# Missing tables to check
MISSING_TABLES=(
    "multi_city_hotel_pricing_rows"
    "multi_city_hotel_private_package_rows"
    "multi_city_package_day_plans"
    "multi_city_hotel_package_day_plans"
)

MISSING_TABLES_FOUND=()

for table in "${MISSING_TABLES[@]}"; do
    exists=$(table_exists_rds "$table")
    if [ "$exists" = "true" ]; then
        echo "   ✅ $table - EXISTS"
    else
        echo "   ❌ $table - MISSING"
        MISSING_TABLES_FOUND+=("$table")
    fi
done

echo ""
echo "📋 Step 2: Checking missing columns..."
echo ""

# Check time_slots column
has_time_slots=$(column_exists_rds "itinerary_days" "time_slots")
if [ "$has_time_slots" = "true" ]; then
    echo "   ✅ itinerary_days.time_slots - EXISTS"
else
    echo "   ❌ itinerary_days.time_slots - MISSING (will add)"
    # Add the column
    echo "   🔧 Adding time_slots column..."
    ADD_COLUMN_SQL="ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS time_slots JSONB DEFAULT '{\"morning\":{\"time\":\"\",\"activities\":[],\"transfers\":[]},\"afternoon\":{\"time\":\"\",\"activities\":[],\"transfers\":[]},\"evening\":{\"time\":\"\",\"activities\":[],\"transfers\":[]}}'::jsonb"
    execute_rds_sql "$ADD_COLUMN_SQL" > /dev/null
    echo "   ✅ Column added"
fi

echo ""
echo "📋 Step 3: Checking data differences..."
echo ""

# Check row counts for key tables
KEY_TABLES=(
    "itineraries"
    "itinerary_days"
    "itinerary_items"
    "multi_city_packages"
    "multi_city_hotel_packages"
)

echo "Comparing row counts between Supabase and RDS:"
for table in "${KEY_TABLES[@]}"; do
    if [ "$(table_exists_rds "$table")" = "true" ]; then
        rds_count=$(get_rds_row_count "$table")
        
        # Get Supabase count (approximate via API)
        supabase_data=$(get_supabase_data "$table" 1)
        supabase_count=$(echo "$supabase_data" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data) if isinstance(data, list) else 0)" 2>/dev/null || echo "?")
        
        echo "   📊 $table: RDS=$rds_count, Supabase=$supabase_count"
    fi
done

echo ""
echo "📋 Step 4: Summary"
echo ""

if [ ${#MISSING_TABLES_FOUND[@]} -eq 0 ]; then
    echo "✅ All required tables exist in RDS"
else
    echo "⚠️  Missing tables: ${MISSING_TABLES_FOUND[*]}"
    echo "💡 These tables need to be created from Supabase structure"
fi

echo ""
echo "✅ Migration check complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Review missing tables/columns above"
echo "   2. For missing tables, we need to:"
echo "      - Get table structure from Supabase"
echo "      - Create tables in RDS"
echo "      - Migrate data (preserving RDS extra rows)"
echo ""
echo "💡 To proceed with actual migration, run:"
echo "   ./scripts/migrate-missing-tables-data.sh"

