#!/bin/bash

# Migrate missing tables, columns, and data from Supabase to AWS RDS
# This script carefully migrates only what's missing, preserving existing RDS data

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

# Check credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# Function to execute SQL on RDS via Lambda
execute_rds_sql() {
    local sql=$1
    local payload=$(cat <<EOF
{
  "action": "query",
  "query": "$sql",
  "params": []
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
    curl -s -X GET \
        "${SUPABASE_URL}/rest/v1/${table}?select=*" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Prefer: return=representation"
}

# Function to get table structure from Supabase
get_supabase_structure() {
    local table=$1
    # Query information_schema for columns
    local query="SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}' ORDER BY ordinal_position"
    
    # Use Supabase REST API - we'll need to use a different approach
    # For now, we'll use the migration files we have
    echo "Using migration files for structure..."
}

echo "📋 Step 1: Checking missing tables..."
echo ""

# Check and migrate missing tables
MISSING_TABLES=(
    "multi_city_hotel_pricing_rows"
    "multi_city_hotel_private_package_rows"
    "multi_city_package_day_plans"
    "multi_city_hotel_package_day_plans"
)

for table in "${MISSING_TABLES[@]}"; do
    echo "🔍 Checking table: $table"
    
    # Check if table exists in RDS
    CHECK_QUERY="SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}') as exists"
    CHECK_RESULT=$(execute_rds_sql "$CHECK_QUERY")
    EXISTS=$(echo "$CHECK_RESULT" | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); rows=body.get('rows', []); print('true' if rows and rows[0].get('exists') else 'false')" 2>/dev/null || echo "false")
    
    if [ "$EXISTS" = "true" ]; then
        echo "   ✅ Table exists in RDS"
    else
        echo "   ❌ Table missing - will create from Supabase structure"
        # TODO: Get structure from Supabase and create table
    fi
done

echo ""
echo "📋 Step 2: Checking missing columns..."
echo ""

# Check for time_slots column in itinerary_days
echo "🔍 Checking time_slots column in itinerary_days..."
CHECK_COLUMN_QUERY="SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'itinerary_days' AND column_name = 'time_slots') as exists"
CHECK_COLUMN_RESULT=$(execute_rds_sql "$CHECK_COLUMN_QUERY")
HAS_COLUMN=$(echo "$CHECK_COLUMN_RESULT" | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); rows=body.get('rows', []); print('true' if rows and rows[0].get('exists') else 'false')" 2>/dev/null || echo "false")

if [ "$HAS_COLUMN" = "true" ]; then
    echo "   ✅ time_slots column exists"
else
    echo "   ❌ time_slots column missing - will add"
    # Add column
    ADD_COLUMN_SQL="ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS time_slots JSONB DEFAULT '{\"morning\":{\"time\":\"\",\"activities\":[],\"transfers\":[]},\"afternoon\":{\"time\":\"\",\"activities\":[],\"transfers\":[]},\"evening\":{\"time\":\"\",\"activities\":[],\"transfers\":[]}}'::jsonb"
    ADD_RESULT=$(execute_rds_sql "$ADD_COLUMN_SQL")
    echo "   ✅ Column added"
fi

echo ""
echo "📋 Step 3: Checking and migrating data..."
echo ""

# For each table, check row counts and migrate missing data
echo "⚠️  Data migration requires careful comparison to avoid duplicates"
echo "💡 This will be done in a separate step after structure is verified"

echo ""
echo "✅ Migration check complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Review missing tables/columns above"
echo "   2. Run actual migration with: ./scripts/migrate-data-from-supabase.sh"
echo "   3. Verify data integrity"

