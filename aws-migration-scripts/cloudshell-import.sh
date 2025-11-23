#!/bin/bash
# Phase 2: Import to RDS using AWS CloudShell
# Run this script in AWS CloudShell

set -e

echo "🚀 Phase 2: Importing to RDS via CloudShell"
echo "============================================================"
echo ""

# Configuration
RDS_ENDPOINT="travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com"
RDS_USER="postgres"
RDS_PASSWORD="ju3vrLHJUW8PqDG4"
RDS_DATABASE="postgres"
S3_BUCKET="travel-app-storage-1769"

# Install PostgreSQL client if not already installed
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL client..."
    sudo yum install -y postgresql15
fi

# Download SQL files from S3
echo "📥 Downloading SQL files from S3..."
aws s3 cp s3://${S3_BUCKET}/migration/supabase_schema.sql .
aws s3 cp s3://${S3_BUCKET}/migration/supabase_data.sql .

echo "✅ Files downloaded"
echo ""

# Set password for psql
export PGPASSWORD="${RDS_PASSWORD}"

# Import schema
echo "📥 Importing schema to RDS..."
psql --host=${RDS_ENDPOINT} \
     --port=5432 \
     --username=${RDS_USER} \
     --dbname=${RDS_DATABASE} \
     --file=supabase_schema.sql \
     --quiet

echo "✅ Schema imported"
echo ""

# Import data
echo "📥 Importing data to RDS..."
psql --host=${RDS_ENDPOINT} \
     --port=5432 \
     --username=${RDS_USER} \
     --dbname=${RDS_DATABASE} \
     --file=supabase_data.sql \
     --quiet

echo "✅ Data imported"
echo ""

# Verify migration
echo "🔍 Verifying migration..."
psql --host=${RDS_ENDPOINT} \
     --port=5432 \
     --username=${RDS_USER} \
     --dbname=${RDS_DATABASE} \
     --command="SELECT 'users' as table_name, COUNT(*) as row_count FROM users UNION ALL SELECT 'activity_packages', COUNT(*) FROM activity_packages UNION ALL SELECT 'transfer_packages', COUNT(*) FROM transfer_packages UNION ALL SELECT 'multi_city_packages', COUNT(*) FROM multi_city_packages;"

echo ""
echo "============================================================"
echo "✅ Phase 2 Migration Complete!"
echo "============================================================"
echo ""
echo "💾 Next Steps:"
echo "  1. Make RDS private again (for security)"
echo "  2. Update .env.local with RDS credentials"
echo "  3. Proceed to Phase 3 (Cognito setup)"
echo ""

