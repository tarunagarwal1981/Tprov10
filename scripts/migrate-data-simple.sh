#!/bin/bash

# Simplified Data Migration - Direct SQL generation
set -e

SUPABASE_URL="https://megmjzszmqnmzdxwzigt.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MTc4NiwiZXhwIjoyMDc1MTI3Nzg2fQ.i2kYiW0n-1uuJuTK5HH6sc0W7Vpjrl4SEXBq8TwL-KA"
LAMBDA_FUNCTION_NAME="${DATABASE_LAMBDA_NAME:-travel-app-database-service}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🚀 Migrating Data from Supabase to RDS (Simplified)"
echo "==================================================="
echo ""

# Get data and create SQL
TABLE="multi_city_package_day_plans"
echo "📋 Migrating $TABLE..."

# Fetch data
DATA=$(curl -s -X GET \
    "${SUPABASE_URL}/rest/v1/${TABLE}?select=*" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}")

# Check if valid JSON
if ! echo "$DATA" | python3 -c "import sys, json; json.load(sys.stdin)" 2>/dev/null; then
    echo "   ⚠️  Invalid response from Supabase"
    echo "   Response: ${DATA:0:200}"
    exit 1
fi

COUNT=$(echo "$DATA" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data) if isinstance(data, list) else 0)")
echo "   Found $COUNT rows in Supabase"

if [ "$COUNT" -eq 0 ]; then
    echo "   ✅ No data to migrate"
    exit 0
fi

# Generate and execute inserts
echo "$DATA" | python3 > /tmp/inserts.sql <<'PYTHON'
import sys, json

data = json.load(sys.stdin)
if not isinstance(data, list):
    data = []

for row in data:
    keys = list(row.keys())
    values = []
    
    for k in keys:
        v = row[k]
        if v is None:
            values.append("NULL")
        elif isinstance(v, (dict, list)):
            json_str = json.dumps(v).replace("'", "''")
            values.append(f"'{json_str}'::jsonb")
        elif isinstance(v, str):
            escaped = v.replace("'", "''")
            values.append(f"'{escaped}'")
        elif isinstance(v, bool):
            values.append("true" if v else "false")
        else:
            values.append(str(v))
    
    columns = ", ".join(keys)
    values_str = ", ".join(values)
    print(f"INSERT INTO multi_city_package_day_plans ({columns}) VALUES ({values_str}) ON CONFLICT (id) DO NOTHING;")
PYTHON

# Execute via Lambda
echo "   🔄 Executing inserts..."
INSERTED=0
while IFS= read -r sql; do
    if [ -z "$sql" ] || [[ "$sql" =~ ^[[:space:]]*$ ]]; then
        continue
    fi
    
    ESCAPED_SQL=$(echo "$sql" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read().strip()))")
    PAYLOAD=$(cat <<EOF
{
  "action": "query",
  "query": $ESCAPED_SQL,
  "params": []
}
EOF
)
    
    RESULT=$(aws lambda invoke \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --region "$AWS_REGION" \
        --payload "$(echo "$PAYLOAD" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin)))")" \
        /tmp/result.json 2>&1)
    
    STATUS=$(cat /tmp/result.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('statusCode', 0))" 2>/dev/null || echo "0")
    
    if [ "$STATUS" = "200" ]; then
        INSERTED=$((INSERTED + 1))
        echo "      ✅ Inserted row $INSERTED"
    else
        ERROR=$(cat /tmp/result.json | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); print(body.get('message', 'Unknown'))" 2>/dev/null || echo "Unknown")
        if [[ "$ERROR" =~ "duplicate" ]] || [[ "$ERROR" =~ "already exists" ]]; then
            echo "      ⏭️  Skipped (already exists)"
        else
            echo "      ⚠️  Error: $ERROR"
        fi
    fi
done < /tmp/inserts.sql

echo ""
echo "✅ Migration complete! Inserted: $INSERTED rows"

