#!/bin/bash

# Script to run the invoice enhancement database migration using AWS RDS connection from .env.local
# Usage: ./run-invoice-migration.sh

echo "🚀 Running migration: 028_add_enhanced_invoice_fields.sql"
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
  echo ""
  echo "Please create .env.local with the following RDS credentials:"
  echo "  RDS_HOSTNAME=your_rds_host.rds.amazonaws.com"
  echo "  RDS_PORT=5432"
  echo "  RDS_DATABASE=postgres"
  echo "  RDS_USERNAME=postgres"
  echo "  RDS_PASSWORD=your_password"
  echo ""
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

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo "❌ Error: psql is not installed"
  echo ""
  echo "Please install PostgreSQL client:"
  echo "  macOS: brew install postgresql"
  echo "  Ubuntu: sudo apt-get install postgresql-client"
  echo "  Windows: Download from https://www.postgresql.org/download/windows/"
  echo ""
  exit 1
fi

# Run the migration using psql
echo "Running migration..."
psql "$DB_URL" -f supabase/migrations/028_add_enhanced_invoice_fields.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully!"
  echo ""
  echo "The following changes have been applied:"
  echo "  ✓ Added lead_id column to invoices table"
  echo "  ✓ Added billing_address (JSONB) column"
  echo "  ✓ Added tax_rate, tax_amount, subtotal columns"
  echo "  ✓ Added payment_terms, notes, currency columns"
  echo "  ✓ Added line_items (JSONB) column"
  echo "  ✓ Created index on lead_id"
  echo "  ✓ Updated existing invoices with lead_id from itineraries"
  echo ""
  exit 0
else
  echo ""
  echo "❌ Migration failed. Please check:"
  echo "  1. RDS connection parameters are correct in .env.local"
  echo "  2. Your IP is allowed in RDS security group"
  echo "  3. Network connectivity to RDS endpoint"
  echo "  4. Database user has ALTER TABLE permissions"
  echo ""
  exit 1
fi

