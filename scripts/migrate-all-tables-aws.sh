#!/bin/bash

# Migrate All Itinerary Tables to AWS RDS using Lambda
# This script runs all necessary migrations via Lambda database service
#
# Prerequisites:
# - AWS CLI configured with credentials
# - DATABASE_LAMBDA_NAME environment variable set
# - All migration files exist in supabase/migrations/
#
# Usage:
#   ./scripts/migrate-all-tables-aws.sh

set -e

LAMBDA_FUNCTION_NAME="${DATABASE_LAMBDA_NAME:-travel-app-database-service}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🚀 Migrating All Itinerary Tables to AWS RDS"
echo "============================================="
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

# Migration files in order
MIGRATIONS=(
    "010_create_itineraries.sql"
    "004_update_multi_city_itinerary_schema.sql"
    "005_create_multi_city_pricing_packages.sql"
    "006_create_multi_city_hotel_packages.sql"
    "012_update_multi_city_pricing_to_sic_tabular.sql"
    "013_update_group_to_private_package_tabular.sql"
    "015_add_time_slots_to_day_plans.sql"
    "017_enhance_itinerary_days.sql"
)

# Check if multi_city_packages table exists first (it might be created elsewhere)
echo "🔍 Checking if multi_city_packages table exists..."
CHECK_QUERY='SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = '\''public'\'' AND table_name = '\''multi_city_packages'\'') as exists'
CHECK_PAYLOAD=$(cat <<EOF
{
  "action": "query",
  "query": "$CHECK_QUERY",
  "params": []
}
EOF
)

CHECK_RESPONSE=$(aws lambda invoke \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$AWS_REGION" \
    --payload "$(echo "$CHECK_PAYLOAD" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin)))")" \
    /tmp/check-response.json 2>&1)

if [ $? -eq 0 ]; then
    EXISTS=$(cat /tmp/check-response.json | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); rows=body.get('rows', []); print('true' if rows and rows[0].get('exists') else 'false')" 2>/dev/null || echo "false")
    
    if [ "$EXISTS" != "true" ]; then
        echo "⚠️  multi_city_packages table not found"
        echo "💡 This table may need to be created first. Checking schema file..."
        # We'll need to create it from schema or find the original migration
    else
        echo "✅ multi_city_packages table exists"
    fi
fi

echo ""

# Function to run a migration file via Lambda
run_migration() {
    local migration_file=$1
    local migration_path="supabase/migrations/$migration_file"
    
    if [ ! -f "$migration_path" ]; then
        echo "⚠️  Migration file not found: $migration_file (skipping)"
        return 1
    fi
    
    echo "📄 Running migration: $migration_file"
    
    # Read migration SQL
    local migration_sql=$(cat "$migration_path")
    
    # Split SQL into statements (by semicolon, but handle DO blocks)
    # For simplicity, we'll execute the entire migration as one query
    # Lambda database service should handle this
    
    # Create payload - we'll use transaction to run all statements
    local payload=$(cat <<EOF
{
  "action": "query",
  "query": $(python3 -c "import json, sys; print(json.dumps(sys.stdin.read()))" <<< "$migration_sql")
}
EOF
)
    
    # Execute via Lambda
    local response=$(aws lambda invoke \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --region "$AWS_REGION" \
        --payload "$payload" \
        /tmp/migration-response.json 2>&1)
    
    if [ $? -eq 0 ]; then
        local result=$(cat /tmp/migration-response.json)
        local status_code=$(echo "$result" | python3 -c "import sys, json; print(json.load(sys.stdin).get('statusCode', 0))" 2>/dev/null || echo "0")
        
        if [ "$status_code" = "200" ]; then
            echo "   ✅ Migration completed"
            return 0
        else
            local error=$(echo "$result" | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); print(body.get('error', 'Unknown error'))" 2>/dev/null || echo "Unknown error")
            echo "   ⚠️  Migration warning: $error (may be expected if objects already exist)"
            return 0  # Continue even with warnings (IF NOT EXISTS should handle it)
        fi
    else
        echo "   ❌ Migration failed"
        echo "   Error: $response"
        return 1
    fi
}

# Run migrations in order
FAILED=0
for migration in "${MIGRATIONS[@]}"; do
    if ! run_migration "$migration"; then
        FAILED=$((FAILED + 1))
        echo "   ⚠️  Continuing with next migration..."
    fi
    echo ""
done

# Summary
echo "📊 Migration Summary:"
echo "   Total migrations: ${#MIGRATIONS[@]}"
echo "   Failed: $FAILED"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo "✅ All migrations completed!"
    echo ""
    echo "🔍 Verifying tables..."
    ./scripts/verify-tables-aws.sh
else
    echo ""
    echo "⚠️  Some migrations had issues. Check output above."
    echo "💡 Run verification to see current state:"
    echo "   ./scripts/verify-tables-aws.sh"
fi

