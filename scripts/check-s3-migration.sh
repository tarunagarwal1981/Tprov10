#!/bin/bash

# Check S3 Objects Migration Status
# Compare Supabase Storage with AWS S3

set -e

S3_BUCKET="${S3_BUCKET_NAME:-travel-app-storage-1769}"
AWS_REGION="${AWS_REGION:-us-east-1}"
SUPABASE_URL="https://megmjzszmqnmzdxwzigt.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MTc4NiwiZXhwIjoyMDc1MTI3Nzg2fQ.i2kYiW0n-1uuJuTK5HH6sc0W7Vpjrl4SEXBq8TwL-KA"

echo "🔍 Checking S3 Objects Migration Status"
echo "======================================="
echo "📦 S3 Bucket: $S3_BUCKET"
echo "🌍 Region: $AWS_REGION"
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

# Check if bucket exists
echo "📋 Checking S3 bucket..."
if aws s3 ls "s3://${S3_BUCKET}" &> /dev/null; then
    echo "   ✅ Bucket exists and is accessible"
else
    echo "   ❌ Bucket not found or not accessible"
    exit 1
fi

echo ""

# Count objects in S3
echo "📊 Counting objects in S3..."
S3_COUNT=$(aws s3 ls "s3://${S3_BUCKET}" --recursive --summarize 2>/dev/null | grep "Total Objects" | awk '{print $3}' || echo "0")
echo "   ✅ S3 Total Objects: $S3_COUNT"

# Get S3 object list (sample)
echo ""
echo "📋 Sample S3 objects (first 20):"
aws s3 ls "s3://${S3_BUCKET}" --recursive 2>/dev/null | head -20 | while read -r line; do
    size=$(echo "$line" | awk '{print $3}')
    path=$(echo "$line" | awk '{print $4}')
    echo "   📄 $path ($size bytes)"
done

# Check S3 bucket size
echo ""
echo "📊 S3 Bucket Size:"
aws s3 ls "s3://${S3_BUCKET}" --recursive --summarize 2>/dev/null | grep "Total Size" | awk '{print "   Total: " $3 " " $4}'

# Check common folders/prefixes
echo ""
echo "📁 Checking common prefixes:"
PREFIXES=(
    "activity-packages"
    "multi-city-packages"
    "transfer-packages"
    "hotel-packages"
    "itineraries"
    "users"
    "documents"
)

for prefix in "${PREFIXES[@]}"; do
    count=$(aws s3 ls "s3://${S3_BUCKET}/${prefix}/" --recursive 2>/dev/null | wc -l | tr -d ' ' || echo "0")
    if [ "$count" -gt 0 ]; then
        echo "   ✅ $prefix/: $count objects"
    fi
done

# Try to get Supabase storage info (if possible via API)
echo ""
echo "📋 Supabase Storage Status:"
echo "   💡 Supabase storage objects can be checked via Supabase Dashboard"
echo "   💡 Or via Supabase Storage API (requires additional setup)"

# Check if there are any database references to S3
echo ""
echo "📋 Checking database references to S3 objects..."
LAMBDA_FUNCTION_NAME="${DATABASE_LAMBDA_NAME:-travel-app-database-service}"

# Check image URLs in database
check_image_urls() {
    local table=$1
    local column=$2
    
    local query="SELECT COUNT(*) as count FROM ${table} WHERE ${column} IS NOT NULL AND ${column} LIKE '%s3%' OR ${column} LIKE '%amazonaws%'"
    
    local payload=$(cat <<EOF
{
  "action": "query",
  "query": "$query",
  "params": []
}
EOF
)
    
    local result=$(aws lambda invoke \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --region "$AWS_REGION" \
        --payload "$(echo "$payload" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin)))")" \
        /tmp/s3-check.json 2>&1)
    
    if [ $? -eq 0 ]; then
        local count=$(cat /tmp/s3-check.json | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('body', '{}')); rows=body.get('rows', []); print(rows[0].get('count', 0) if rows else 0)" 2>/dev/null || echo "0")
        echo "   $table.${column}: $count rows with S3 URLs"
    fi
}

echo "   Checking image URL columns..."
check_image_urls "activity_package_images" "public_url" 2>/dev/null || true
check_image_urls "multi_city_package_images" "public_url" 2>/dev/null || true
check_image_urls "multi_city_hotel_package_images" "public_url" 2>/dev/null || true

echo ""
echo "✅ S3 Migration Check Complete!"
echo ""
echo "📝 Summary:"
echo "   S3 Bucket: $S3_BUCKET"
echo "   Total Objects: $S3_COUNT"
echo "   Status: ✅ Accessible"

