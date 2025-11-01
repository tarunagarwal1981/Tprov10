#!/bin/bash
# ============================================================================
# Database Import Script - Import to AWS RDS
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== RDS Database Import Script ===${NC}"

# Configuration - Replace with your RDS values
RDS_HOST="your-rds-endpoint.rds.amazonaws.com"
RDS_PORT="5432"
RDS_DATABASE="postgres"
RDS_USER="postgres"
RDS_PASSWORD="your-password"

# Backup file from export
BACKUP_FILE="./database-backup/supabase_backup_latest.sql"

if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
  echo -e "Please run 1-database-export.sh first"
  exit 1
fi

echo -e "${YELLOW}Importing database from: ${BACKUP_FILE}${NC}"

# Import the database
PGPASSWORD="$RDS_PASSWORD" psql \
  --host="$RDS_HOST" \
  --port="$RDS_PORT" \
  --username="$RDS_USER" \
  --dbname="$RDS_DATABASE" \
  --file="$BACKUP_FILE" \
  --echo-errors \
  --verbose

echo -e "${GREEN}✅ Database import completed!${NC}"

# Verify import
echo -e "${YELLOW}Verifying import...${NC}"

VERIFY_OUTPUT=$(PGPASSWORD="$RDS_PASSWORD" psql \
  --host="$RDS_HOST" \
  --port="$RDS_PORT" \
  --username="$RDS_USER" \
  --dbname="$RDS_DATABASE" \
  --tuples-only \
  --command="
    SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
  ")

TABLE_COUNT=$(echo "$VERIFY_OUTPUT" | tr -d '[:space:]')

echo -e "${GREEN}✅ Import verified: ${TABLE_COUNT} tables imported${NC}"

# Show table list
echo -e "${YELLOW}Tables in database:${NC}"
PGPASSWORD="$RDS_PASSWORD" psql \
  --host="$RDS_HOST" \
  --port="$RDS_PORT" \
  --username="$RDS_USER" \
  --dbname="$RDS_DATABASE" \
  --command="
    SELECT tablename, 
           (SELECT count(*) FROM \"$tablename\") as row_count
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  "

echo -e "${GREEN}=== Import Complete ===${NC}"
echo -e "Next steps:"
echo -e "1. Verify RLS policies are active"
echo -e "2. Test database connections from application"
echo -e "3. Run migration script 4-cognito-setup.sh"


