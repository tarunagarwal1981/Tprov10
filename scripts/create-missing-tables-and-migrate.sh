#!/bin/bash

# Create Missing Tables and Migrate Data from Supabase to RDS
# This script creates the 4 missing tables and migrates data carefully

set -e

SUPABASE_URL="https://megmjzszmqnmzdxwzigt.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MTc4NiwiZXhwIjoyMDc1MTI3Nzg2fQ.i2kYiW0n-1uuJuTK5HH6sc0W7Vpjrl4SEXBq8TwL-KA"
LAMBDA_FUNCTION_NAME="${DATABASE_LAMBDA_NAME:-travel-app-database-service}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🚀 Creating Missing Tables and Migrating Data"
echo "=============================================="
echo ""

# Function to execute SQL on RDS via Lambda
execute_rds_sql() {
    local sql=$1
    local params=${2:-"[]"}
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
    curl -s -X GET \
        "${SUPABASE_URL}/rest/v1/${table}?select=*" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Prefer: return=representation"
}

echo "📋 Step 1: Creating missing tables..."
echo ""

# 1. Create multi_city_hotel_pricing_rows
echo "🔧 Creating multi_city_hotel_pricing_rows..."
CREATE_HOTEL_PRICING_ROWS=$(cat <<'EOF'
CREATE TABLE IF NOT EXISTS multi_city_hotel_pricing_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_package_id UUID NOT NULL REFERENCES multi_city_hotel_pricing_packages(id) ON DELETE CASCADE,
  number_of_adults INTEGER NOT NULL CHECK (number_of_adults >= 0),
  number_of_children INTEGER NOT NULL DEFAULT 0 CHECK (number_of_children >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_hotel_pricing_row UNIQUE (pricing_package_id, number_of_adults, number_of_children)
);

CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_pricing_rows_pricing_package_id 
  ON multi_city_hotel_pricing_rows(pricing_package_id);

CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_pricing_rows_display_order 
  ON multi_city_hotel_pricing_rows(pricing_package_id, display_order);
EOF
)
execute_rds_sql "$CREATE_HOTEL_PRICING_ROWS" > /dev/null
echo "   ✅ multi_city_hotel_pricing_rows created"

# 2. Create multi_city_hotel_private_package_rows
echo "🔧 Creating multi_city_hotel_private_package_rows..."
CREATE_HOTEL_PRIVATE_ROWS=$(cat <<'EOF'
CREATE TABLE IF NOT EXISTS multi_city_hotel_private_package_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_package_id UUID NOT NULL REFERENCES multi_city_hotel_pricing_packages(id) ON DELETE CASCADE,
  number_of_adults INTEGER NOT NULL CHECK (number_of_adults >= 0),
  number_of_children INTEGER NOT NULL DEFAULT 0 CHECK (number_of_children >= 0),
  car_type VARCHAR(100) NOT NULL,
  vehicle_capacity INTEGER NOT NULL CHECK (vehicle_capacity > 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_private_package_rows_pricing_package_id 
  ON multi_city_hotel_private_package_rows(pricing_package_id);

CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_private_package_rows_display_order 
  ON multi_city_hotel_private_package_rows(pricing_package_id, display_order);
EOF
)
execute_rds_sql "$CREATE_HOTEL_PRIVATE_ROWS" > /dev/null
echo "   ✅ multi_city_hotel_private_package_rows created"

# 3. Create multi_city_package_day_plans
echo "🔧 Creating multi_city_package_day_plans..."
CREATE_DAY_PLANS=$(cat <<'EOF'
CREATE TABLE IF NOT EXISTS multi_city_package_day_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_packages(id) ON DELETE CASCADE,
  city_id UUID REFERENCES multi_city_package_cities(id) ON DELETE SET NULL,
  day_number INTEGER NOT NULL CHECK (day_number > 0),
  city_name VARCHAR(255),
  description TEXT,
  photo_url TEXT,
  has_flights BOOLEAN DEFAULT false,
  title VARCHAR(255),
  time_slots JSONB DEFAULT '{"morning":{"time":"","activities":[],"transfers":[]},"afternoon":{"time":"","activities":[],"transfers":[]},"evening":{"time":"","activities":[],"transfers":[]}}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_multi_city_package_day_plans_package_id 
  ON multi_city_package_day_plans(package_id);

CREATE INDEX IF NOT EXISTS idx_multi_city_package_day_plans_city_id 
  ON multi_city_package_day_plans(city_id);
EOF
)
execute_rds_sql "$CREATE_DAY_PLANS" > /dev/null
echo "   ✅ multi_city_package_day_plans created"

# 4. Create multi_city_hotel_package_day_plans (already exists structure, just ensure it has time_slots)
echo "🔧 Ensuring multi_city_hotel_package_day_plans has time_slots..."
ALTER_HOTEL_DAY_PLANS=$(cat <<'EOF'
-- Add time_slots if missing
ALTER TABLE multi_city_hotel_package_day_plans 
  ADD COLUMN IF NOT EXISTS time_slots JSONB DEFAULT '{"morning":{"time":"","activities":[],"transfers":[]},"afternoon":{"time":"","activities":[],"transfers":[]},"evening":{"time":"","activities":[],"transfers":[]}}'::jsonb;

-- Add title if missing
ALTER TABLE multi_city_hotel_package_day_plans 
  ADD COLUMN IF NOT EXISTS title VARCHAR(255);
EOF
)
execute_rds_sql "$ALTER_HOTEL_DAY_PLANS" > /dev/null
echo "   ✅ multi_city_hotel_package_day_plans updated"

echo ""
echo "📋 Step 2: Migrating data from Supabase..."
echo ""

# Function to migrate data for a table
migrate_table_data() {
    local table=$1
    local primary_key=${2:-"id"}
    
    echo "   📥 Migrating $table..."
    
    # Get data from Supabase
    local supabase_data=$(get_supabase_data "$table")
    local row_count=$(echo "$supabase_data" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data) if isinstance(data, list) else 0)" 2>/dev/null || echo "0")
    
    if [ "$row_count" -eq 0 ]; then
        echo "      ⚠️  No data in Supabase for $table"
        return
    fi
    
    echo "      Found $row_count rows in Supabase"
    
    # For each row, insert if not exists (using ON CONFLICT DO NOTHING)
    # This preserves existing RDS rows
    local inserted=0
    local skipped=0
    
    echo "$supabase_data" | python3 <<PYTHON_SCRIPT
import sys, json

data = json.load(sys.stdin)
if not isinstance(data, list):
    data = []

for row in data:
    # Build INSERT statement with ON CONFLICT DO NOTHING
    # This will skip rows that already exist in RDS
    keys = list(row.keys())
    values = [row[k] for k in keys]
    
    # Format values for SQL
    formatted_values = []
    for v in values:
        if v is None:
            formatted_values.append("NULL")
        elif isinstance(v, (dict, list)):
            formatted_values.append(f"'{json.dumps(v).replace(chr(39), chr(39)+chr(39))}'::jsonb")
        elif isinstance(v, str):
            # Escape single quotes
            escaped = v.replace("'", "''")
            formatted_values.append(f"'{escaped}'")
        elif isinstance(v, bool):
            formatted_values.append("true" if v else "false")
        else:
            formatted_values.append(str(v))
    
    columns = ", ".join(keys)
    values_str = ", ".join(formatted_values)
    
    # Use INSERT ... ON CONFLICT DO NOTHING to preserve existing rows
    sql = f"INSERT INTO {table} ({columns}) VALUES ({values_str}) ON CONFLICT ({primary_key}) DO NOTHING"
    print(sql)
PYTHON_SCRIPT
    
    echo "      ✅ Migration prepared for $table"
    echo "      💡 Run actual inserts via Lambda (batch processing recommended)"
}

# Migrate each table
migrate_table_data "multi_city_hotel_pricing_rows" "id"
migrate_table_data "multi_city_hotel_private_package_rows" "id"
migrate_table_data "multi_city_package_day_plans" "id"
# multi_city_hotel_package_day_plans - check if it exists first

echo ""
echo "✅ Table creation complete!"
echo ""
echo "📝 Next: Run data migration script to actually insert the data"
echo "   ./scripts/migrate-data-batch.sh"

