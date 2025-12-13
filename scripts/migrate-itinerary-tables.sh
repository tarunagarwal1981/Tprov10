#!/bin/bash

# Migrate Itinerary Tables to AWS RDS
# This script runs the migration for itinerary-related tables if needed
# 
# Prerequisites:
# - AWS CLI configured
# - Access to RDS instance
# - psql installed
#
# Usage:
#   ./scripts/migrate-itinerary-tables.sh

set -e

RDS_HOSTNAME="${RDS_HOSTNAME:-${RDS_HOST}}"
RDS_PORT="${RDS_PORT:-5432}"
RDS_DATABASE="${RDS_DATABASE:-${RDS_DB:-postgres}}"
RDS_USERNAME="${RDS_USERNAME:-${RDS_USER}}"
RDS_PASSWORD="${RDS_PASSWORD}"

if [ -z "$RDS_HOSTNAME" ] || [ -z "$RDS_USERNAME" ] || [ -z "$RDS_PASSWORD" ]; then
  echo "❌ Error: RDS connection details not set"
  echo "Please set: RDS_HOSTNAME, RDS_USERNAME, RDS_PASSWORD"
  exit 1
fi

echo "🚀 Starting itinerary tables migration..."
echo "📡 Connecting to: $RDS_HOSTNAME:$RDS_PORT/$RDS_DATABASE"

# Check if migration 017 exists
MIGRATION_FILE="supabase/migrations/017_enhance_itinerary_days.sql"

if [ -f "$MIGRATION_FILE" ]; then
  echo "📄 Found migration file: $MIGRATION_FILE"
  echo "🔄 Running migration..."
  
  PGPASSWORD="$RDS_PASSWORD" psql \
    --host="$RDS_HOSTNAME" \
    --port="$RDS_PORT" \
    --username="$RDS_USERNAME" \
    --dbname="$RDS_DATABASE" \
    --file="$MIGRATION_FILE" \
    --quiet

  if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
  else
    echo "❌ Migration failed!"
    exit 1
  fi
else
  echo "⚠️  Migration file not found: $MIGRATION_FILE"
  echo "   Skipping migration (code handles missing columns gracefully)"
fi

# Verify tables
echo ""
echo "🔍 Verifying tables..."
node scripts/verify-itinerary-tables.js

echo ""
echo "✅ Migration process complete!"

