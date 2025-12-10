#!/bin/bash
# Update Database URLs from Supabase to S3
# Run this in AWS CloudShell (which has VPC access to RDS)

# Don't exit on error - we want to see what happened
set +e

echo "🔄 Updating database URLs from Supabase to S3..."
echo ""

# Get RDS endpoint from environment or use default
RDS_HOST="${RDS_HOST:-travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com}"
RDS_PORT="${RDS_PORT:-5432}"
RDS_DB="${RDS_DB:-postgres}"
RDS_USER="${RDS_USER:-postgres}"

# Get password from AWS Secrets Manager or environment
if [ -z "$RDS_PASSWORD" ]; then
    echo "⚠️  RDS_PASSWORD not set."
    echo ""
    echo "Please set it first:"
    echo "   export RDS_PASSWORD='your_rds_password'"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL client..."
    sudo yum install -y postgresql15
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install PostgreSQL client"
        exit 1
    fi
fi

S3_BASE_URL="https://travel-app-storage-1769.s3.us-east-1.amazonaws.com"
SUPABASE_STORAGE_URL="https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public"

echo "📦 Updating activity_package_images table..."
echo ""
echo "Connecting to: ${RDS_HOST}:${RDS_PORT}/${RDS_DB}"
echo ""

# Test connection first
echo "Testing connection..."
psql "postgresql://${RDS_USER}:${RDS_PASSWORD}@${RDS_HOST}:${RDS_PORT}/${RDS_DB}" -c "SELECT version();" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Failed to connect to RDS database"
    echo "   Please check:"
    echo "   - RDS_HOST is correct: ${RDS_HOST}"
    echo "   - RDS_PASSWORD is correct"
    echo "   - Security group allows CloudShell access"
    exit 1
fi

echo "✅ Connection successful!"
echo ""

# Update public_url
echo "Updating public_url..."
psql "postgresql://${RDS_USER}:${RDS_PASSWORD}@${RDS_HOST}:${RDS_PORT}/${RDS_DB}" <<EOF
-- Update public_url
UPDATE activity_package_images
SET public_url = REPLACE(
  public_url,
  '${SUPABASE_STORAGE_URL}/activity-package-images/',
  '${S3_BASE_URL}/activity-package-images/'
)
WHERE public_url LIKE '%supabase.co%';

SELECT 'Updated public_url: ' || ROW_COUNT() || ' rows' FROM (SELECT COUNT(*) as ROW_COUNT FROM activity_package_images WHERE public_url LIKE '%s3.amazonaws.com%') t;
EOF

if [ $? -ne 0 ]; then
    echo "❌ Error updating public_url"
    exit 1
fi

echo "✅ public_url updated"
echo ""

# Update storage_path
echo "Updating storage_path..."
psql "postgresql://${RDS_USER}:${RDS_PASSWORD}@${RDS_HOST}:${RDS_PORT}/${RDS_DB}" <<EOF

-- Update storage_path
UPDATE activity_package_images
SET storage_path = REPLACE(
  storage_path,
  '${SUPABASE_STORAGE_URL}/activity-package-images/',
  'activity-package-images/'
)
WHERE storage_path LIKE '%supabase.co%';

SELECT 'Updated storage_path: ' || ROW_COUNT() || ' rows' FROM (SELECT COUNT(*) as ROW_COUNT FROM activity_package_images WHERE storage_path NOT LIKE '%supabase.co%') t;
EOF

if [ $? -ne 0 ]; then
    echo "❌ Error updating storage_path"
    exit 1
fi

echo "✅ storage_path updated"
echo ""

# Verify updates
echo "🔍 Verifying updates..."
psql "postgresql://${RDS_USER}:${RDS_PASSWORD}@${RDS_HOST}:${RDS_PORT}/${RDS_DB}" <<EOF
-- Verify updates
SELECT 
  COUNT(*) FILTER (WHERE public_url LIKE '%supabase.co%' OR storage_path LIKE '%supabase.co%') as remaining_supabase_urls,
  COUNT(*) FILTER (WHERE public_url LIKE '%s3.amazonaws.com%') as s3_urls
FROM activity_package_images;

-- Show sample of updated URLs
SELECT 'Sample URLs:' as info;
SELECT id, LEFT(public_url, 80) as public_url_preview, LEFT(storage_path, 50) as storage_path_preview
FROM activity_package_images
WHERE public_url LIKE '%s3.amazonaws.com%'
LIMIT 5;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database URL update completed successfully!"
else
    echo ""
    echo "⚠️  Update completed but verification failed. Please check manually."
fi

