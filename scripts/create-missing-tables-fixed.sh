#!/bin/bash

# Create Missing Tables - Fixed for RDS schema (TEXT IDs, no strict FKs)
set -e

LAMBDA_FUNCTION_NAME="${DATABASE_LAMBDA_NAME:-travel-app-database-service}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🔧 Creating missing tables (matching RDS schema)..."
echo ""

# Function to execute SQL
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
    
    local result=$(cat /tmp/rds-response.json)
    local status=$(echo "$result" | python3 -c "import sys, json; print(json.load(sys.stdin).get('statusCode', 0))" 2>/dev/null || echo "0")
    
    if [ "$status" = "200" ]; then
        return 0
    else
        local error=$(echo "$result" | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); print(body.get('message', 'Unknown error'))" 2>/dev/null || echo "Unknown error")
        echo "   ⚠️  Error: $error"
        return 1
    fi
}

# 1. multi_city_hotel_pricing_rows (using TEXT to match RDS schema)
echo "📋 Creating multi_city_hotel_pricing_rows..."
CREATE_HOTEL_PRICING_ROWS=$(cat <<'EOF'
CREATE TABLE IF NOT EXISTS multi_city_hotel_pricing_rows (
  id TEXT PRIMARY KEY,
  pricing_package_id TEXT NOT NULL,
  number_of_adults INTEGER NOT NULL CHECK (number_of_adults >= 0),
  number_of_children INTEGER NOT NULL DEFAULT 0 CHECK (number_of_children >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_multi_city_hotel_pricing_rows_pricing_package_id 
  ON multi_city_hotel_pricing_rows(pricing_package_id);
EOF
)
if execute_rds_sql "$CREATE_HOTEL_PRICING_ROWS"; then
    echo "   ✅ Created"
else
    echo "   ❌ Failed"
fi

# 2. multi_city_hotel_private_package_rows
echo "📋 Creating multi_city_hotel_private_package_rows..."
CREATE_HOTEL_PRIVATE_ROWS=$(cat <<'EOF'
CREATE TABLE IF NOT EXISTS multi_city_hotel_private_package_rows (
  id TEXT PRIMARY KEY,
  pricing_package_id TEXT NOT NULL,
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
EOF
)
if execute_rds_sql "$CREATE_HOTEL_PRIVATE_ROWS"; then
    echo "   ✅ Created"
else
    echo "   ❌ Failed"
fi

# 3. multi_city_package_day_plans
echo "📋 Creating multi_city_package_day_plans..."
CREATE_DAY_PLANS=$(cat <<'EOF'
CREATE TABLE IF NOT EXISTS multi_city_package_day_plans (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL,
  city_id TEXT,
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
EOF
)
if execute_rds_sql "$CREATE_DAY_PLANS"; then
    echo "   ✅ Created"
else
    echo "   ❌ Failed"
fi

# 4. Ensure multi_city_hotel_package_day_plans has time_slots and title
echo "📋 Updating multi_city_hotel_package_day_plans..."
ALTER_HOTEL_DAY_PLANS=$(cat <<'EOF'
ALTER TABLE multi_city_hotel_package_day_plans 
  ADD COLUMN IF NOT EXISTS time_slots JSONB DEFAULT '{"morning":{"time":"","activities":[],"transfers":[]},"afternoon":{"time":"","activities":[],"transfers":[]},"evening":{"time":"","activities":[],"transfers":[]}}'::jsonb;

ALTER TABLE multi_city_hotel_package_day_plans 
  ADD COLUMN IF NOT EXISTS title VARCHAR(255);
EOF
)
if execute_rds_sql "$ALTER_HOTEL_DAY_PLANS"; then
    echo "   ✅ Updated"
else
    echo "   ❌ Failed"
fi

echo ""
echo "✅ Table creation complete!"
echo ""
echo "🔍 Verifying tables..."
aws lambda invoke \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$AWS_REGION" \
    --payload '{"action":"query","query":"SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' AND table_name IN ('\''multi_city_hotel_pricing_rows'\'', '\''multi_city_hotel_private_package_rows'\'', '\''multi_city_package_day_plans'\'') ORDER BY table_name"}' \
    /tmp/verify-final.json &> /dev/null

cat /tmp/verify-final.json | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); rows=body.get('rows', []); print(f'✅ Found {len(rows)} tables:'); [print(f'   - {r[\"table_name\"]}') for r in rows]"

