#!/bin/bash

# Script to run the database migration using AWS RDS connection from .env.local
# Usage: ./run-migration.sh

echo "🚀 Running migration: 021_restructure_time_slots_schema.sql"
echo ""

# Load environment variables from .env.local
if [ -f .env.local ]; then
  # Export variables, skipping comments and empty lines
  while IFS= read -r line; do
    # Skip comments and empty lines
    if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ -n "$line" ]]; then
      # Export the variable
      export "$line" 2>/dev/null || true
    fi
  done < .env.local
  echo "✅ Loaded environment variables from .env.local"
else
  echo "❌ Error: .env.local file not found"
  exit 1
fi

# Get RDS connection parameters (with fallbacks)
RDS_HOST=${RDS_HOSTNAME:-${RDS_HOST:-}}
RDS_PORT=${RDS_PORT:-5432}
RDS_DB=${RDS_DATABASE:-${RDS_DB:-postgres}}
RDS_USER=${RDS_USERNAME:-${RDS_USER:-}}
RDS_PASSWORD=${RDS_PASSWORD:-}

# Check if required parameters are set
if [ -z "$RDS_HOST" ] || [ -z "$RDS_USER" ] || [ -z "$RDS_PASSWORD" ]; then
  echo "❌ Error: Missing required RDS connection parameters"
  echo ""
  echo "Please set these in .env.local:"
  echo "  RDS_HOSTNAME or RDS_HOST (e.g., travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com)"
  echo "  RDS_USERNAME or RDS_USER (e.g., postgres)"
  echo "  RDS_PASSWORD (your database password)"
  echo "  RDS_PORT (optional, defaults to 5432)"
  echo "  RDS_DATABASE or RDS_DB (optional, defaults to postgres)"
  echo ""
  exit 1
fi

# Construct PostgreSQL connection string
DB_URL="postgresql://${RDS_USER}:${RDS_PASSWORD}@${RDS_HOST}:${RDS_PORT}/${RDS_DB}"

echo "Connecting to AWS RDS..."
echo "  Host: $RDS_HOST"
echo "  Port: $RDS_PORT"
echo "  Database: $RDS_DB"
echo "  User: $RDS_USER"
echo ""

# Run the migration using psql
echo "Running migration..."
psql "$DB_URL" -f supabase/migrations/021_restructure_time_slots_schema.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully!"
  exit 0
else
  echo ""
  echo "❌ Migration failed. Please check:"
  echo "  1. RDS connection parameters are correct"
  echo "  2. Your IP is allowed in RDS security group"
  echo "  3. psql is installed (install with: brew install postgresql)"
  echo "  4. Network connectivity to RDS endpoint"
  exit 1
fi
