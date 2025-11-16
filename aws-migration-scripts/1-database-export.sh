#!/bin/bash
# ============================================================================
# Database Export Script - Supabase to AWS RDS
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Supabase Database Export Script ===${NC}"

# Configuration - Replace with your values
SUPABASE_DB_HOST="db.xxx.supabase.co"
SUPABASE_DB_PORT="5432"
SUPABASE_DB_NAME="postgres"
SUPABASE_DB_USER="postgres"
SUPABASE_DB_PASSWORD="your-password"

# Output directory
OUTPUT_DIR="./database-backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${OUTPUT_DIR}/supabase_backup_${TIMESTAMP}.sql"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${YELLOW}Starting database export...${NC}"

# Export schema and data
PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
  --host="$SUPABASE_DB_HOST" \
  --port="$SUPABASE_DB_PORT" \
  --username="$SUPABASE_DB_USER" \
  --dbname="$SUPABASE_DB_NAME" \
  --schema=public \
  --no-owner \
  --no-acl \
  --format=plain \
  --file="$BACKUP_FILE" \
  --verbose

echo -e "${GREEN}✅ Database exported successfully!${NC}"
echo -e "Backup file: ${BACKUP_FILE}"

# Get file size
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "File size: ${FILE_SIZE}"

# Create a separate export for table counts (verification)
VERIFY_FILE="${OUTPUT_DIR}/table_counts_${TIMESTAMP}.txt"
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  --host="$SUPABASE_DB_HOST" \
  --port="$SUPABASE_DB_PORT" \
  --username="$SUPABASE_DB_USER" \
  --dbname="$SUPABASE_DB_NAME" \
  --output="$VERIFY_FILE" \
  --command="
    SELECT 
      schemaname,
      tablename,
      (SELECT count(*) FROM (SELECT * FROM \"$schemaname\".\"$tablename\") as t) as row_count
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  "

echo -e "${GREEN}✅ Table counts exported for verification${NC}"
echo -e "Verification file: ${VERIFY_FILE}"

# Export RLS policies separately
RLS_FILE="${OUTPUT_DIR}/rls_policies_${TIMESTAMP}.sql"
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  --host="$SUPABASE_DB_HOST" \
  --port="$SUPABASE_DB_PORT" \
  --username="$SUPABASE_DB_USER" \
  --dbname="$SUPABASE_DB_NAME" \
  --output="$RLS_FILE" \
  --command="
    SELECT 
      'CREATE POLICY ' || quote_ident(policyname) || ' ON ' || 
      quote_ident(schemaname) || '.' || quote_ident(tablename) ||
      ' FOR ' || cmd ||
      CASE WHEN qual IS NOT NULL THEN ' USING (' || pg_get_expr(qual, oid) || ')' ELSE '' END ||
      CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || pg_get_expr(with_check, oid) || ')' ELSE '' END ||
      ';' as policy_definition
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  "

echo -e "${GREEN}✅ RLS policies exported${NC}"
echo -e "RLS file: ${RLS_FILE}"

echo -e "${GREEN}=== Export Complete ===${NC}"
echo -e "Next steps:"
echo -e "1. Review the backup file: ${BACKUP_FILE}"
echo -e "2. Import to RDS using script: 2-database-import.sh"
echo -e "3. Verify using table counts: ${VERIFY_FILE}"


