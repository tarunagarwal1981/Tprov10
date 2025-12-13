#!/bin/bash

# Migrate Data from Supabase to RDS
# This script carefully migrates data, preserving existing RDS rows

set -e

SUPABASE_URL="https://megmjzszmqnmzdxwzigt.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MTc4NiwiZXhwIjoyMDc1MTI3Nzg2fQ.i2kYiW0n-1uuJuTK5HH6sc0W7Vpjrl4SEXBq8TwL-KA"
LAMBDA_FUNCTION_NAME="${DATABASE_LAMBDA_NAME:-travel-app-database-service}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🚀 Migrating Data from Supabase to RDS"
echo "======================================="
echo ""

# Function to execute SQL on RDS
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

# Function to get row count from RDS
get_rds_count() {
    local table=$1
    local result=$(execute_rds_sql "SELECT COUNT(*) as count FROM ${table}")
    echo "$result" | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); rows=body.get('rows', []); print(rows[0].get('count', 0) if rows else 0)" 2>/dev/null || echo "0"
}

# Function to migrate a single table
migrate_table() {
    local table=$1
    local primary_key=${2:-"id"}
    
    echo "📋 Migrating $table..."
    
    # Get Supabase data
    local supabase_data=$(get_supabase_data "$table")
    
    # Check if we got valid JSON
    if ! echo "$supabase_data" | python3 -c "import sys, json; json.load(sys.stdin)" 2>/dev/null; then
        echo "   ⚠️  No data or invalid response from Supabase"
        return
    fi
    
    local supabase_count=$(echo "$supabase_data" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data) if isinstance(data, list) else 0)" 2>/dev/null || echo "0")
    local rds_count_before=$(get_rds_count "$table")
    
    echo "   📊 Supabase: $supabase_count rows, RDS before: $rds_count_before rows"
    
    if [ "$supabase_count" -eq 0 ]; then
        echo "   ✅ No data to migrate"
        return
    fi
    
    # Process each row and insert
    local inserted=0
    local skipped=0
    local errors=0
    
    echo "$supabase_data" | python3 > /tmp/insert-statements-${table}.sql <<PYTHON_SCRIPT
import sys, json

try:
    data = json.load(sys.stdin)
    if not isinstance(data, list):
        data = []
    
    for idx, row in enumerate(data):
        try:
            # Build column list
            keys = [k for k in row.keys() if row[k] is not None or k == 'id']
            values = []
            
            for k in keys:
                v = row[k]
                
                if v is None:
                    values.append("NULL")
                elif isinstance(v, (dict, list)):
                    # JSON/JSONB
                    json_str = json.dumps(v).replace("'", "''")
                    values.append(f"'{json_str}'::jsonb")
                elif isinstance(v, str):
                    # Escape single quotes
                    escaped = v.replace("'", "''")
                    values.append(f"'{escaped}'")
                elif isinstance(v, bool):
                    values.append("true" if v else "false")
                else:
                    values.append(str(v))
            
            # Build INSERT with ON CONFLICT DO NOTHING
            columns = ", ".join(keys)
            values_str = ", ".join(values)
            
            # Use ON CONFLICT to preserve existing rows
            sql = f"INSERT INTO {table} ({columns}) VALUES ({values_str}) ON CONFLICT ({primary_key}) DO NOTHING"
            
            # Print SQL for execution
            print(sql)
            
        except Exception as e:
            print(f"-- Error processing row {idx}: {str(e)}", file=sys.stderr)
            continue
            
except Exception as e:
    print(f"-- Error: {str(e)}", file=sys.stderr)
PYTHON_SCRIPT
    
    # Execute inserts in batches
    local batch_size=10
    local total_lines=$(wc -l < /tmp/insert-statements-${table}.sql | tr -d ' ')
    
    if [ "$total_lines" -eq 0 ]; then
        echo "   ⚠️  No valid insert statements generated"
        return
    fi
    
    echo "   🔄 Executing $total_lines insert statements..."
    
    # Execute in batches using transaction
    local batch_num=0
    while IFS= read -r sql || [ -n "$sql" ]; do
        # Skip comments
        if [[ "$sql" =~ ^-- ]]; then
            continue
        fi
        
        # Execute insert
        local result=$(execute_rds_sql "$sql")
        local status=$(echo "$result" | python3 -c "import sys, json; print(json.load(sys.stdin).get('statusCode', 0))" 2>/dev/null || echo "0")
        
        if [ "$status" = "200" ]; then
            inserted=$((inserted + 1))
        else
            # Check if it's a conflict (row already exists) - that's OK
            local error=$(echo "$result" | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); print(body.get('message', ''))" 2>/dev/null || echo "")
            if [[ "$error" =~ "duplicate" ]] || [[ "$error" =~ "already exists" ]]; then
                skipped=$((skipped + 1))
            else
                errors=$((errors + 1))
                echo "      ⚠️  Error: $error" >&2
            fi
        fi
        
        # Progress indicator
        if [ $((inserted + skipped + errors)) -eq $((batch_size * (batch_num + 1))) ]; then
            batch_num=$((batch_num + 1))
            echo "      Progress: $((inserted + skipped + errors))/$total_lines"
        fi
    done < /tmp/insert-statements-${table}.sql
    
    local rds_count_after=$(get_rds_count "$table")
    
    echo "   ✅ Migration complete:"
    echo "      Inserted: $inserted, Skipped (existing): $skipped, Errors: $errors"
    echo "      RDS after: $rds_count_after rows"
    echo ""
}

# Migrate tables
echo "📋 Starting data migration..."
echo ""

# Key tables to migrate
TABLES_TO_MIGRATE=(
    "multi_city_package_day_plans"
    "multi_city_hotel_package_day_plans"
    "multi_city_hotel_pricing_rows"
    "multi_city_hotel_private_package_rows"
)

for table in "${TABLES_TO_MIGRATE[@]}"; do
    migrate_table "$table" "id"
done

echo "✅ Data migration complete!"
echo ""
echo "📊 Final Summary:"
for table in "${TABLES_TO_MIGRATE[@]}"; do
    count=$(get_rds_count "$table")
    echo "   $table: $count rows"
done

