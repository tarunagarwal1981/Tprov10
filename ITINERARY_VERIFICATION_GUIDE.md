# Itinerary Tables Verification Guide

## Overview

This guide explains how to verify that all required tables for the itinerary flow exist in AWS RDS.

---

## 🔍 Verification Methods

### Method 1: API Endpoint (Recommended)

The easiest way to verify tables is via the API endpoint:

```bash
# Local development
curl http://localhost:3000/api/admin/verify-tables

# Production/Staging
curl https://your-app.amplifyapp.com/api/admin/verify-tables
```

Or use the provided script:

```bash
./scripts/verify-tables-curl.sh http://localhost:3000
./scripts/verify-tables-curl.sh https://your-app.amplifyapp.com
```

**Response Format:**
```json
{
  "success": true,
  "summary": {
    "total": 16,
    "found": 16,
    "missing": 0,
    "timeSlotsColumn": "EXISTS",
    "allTablesExist": true
  },
  "tables": {
    "exists": ["itineraries", "itinerary_days", ...],
    "missing": []
  },
  "timeSlots": {
    "exists": true,
    "note": "time_slots column exists in itinerary_days"
  },
  "recommendations": ["All tables exist and time_slots column is present"]
}
```

### Method 2: AWS SDK Script (Node.js)

If you have Node.js and AWS credentials configured:

```bash
# Set Lambda function name
export DATABASE_LAMBDA_NAME=travel-app-database-service
export AWS_REGION=us-east-1

# Run verification
node scripts/verify-itinerary-tables-aws.js
```

**Prerequisites:**
- Node.js installed
- AWS credentials configured (via environment variables, IAM role, or `~/.aws/credentials`)
- `@aws-sdk/client-lambda` package (already in package.json)

### Method 3: Direct Database Connection

If you have direct access to RDS (via EC2, VPN, or bastion host):

```bash
# Set connection details
export RDS_HOSTNAME=your-rds-endpoint.rds.amazonaws.com
export RDS_PORT=5432
export RDS_DATABASE=postgres
export RDS_USERNAME=postgres
export RDS_PASSWORD=your-password

# Run verification
node scripts/verify-itinerary-tables.js
```

---

## 📋 Required Tables

### Itinerary Tables
- ✅ `itineraries`
- ✅ `itinerary_days` (with optional `time_slots` column)
- ✅ `itinerary_items`

### Multi-City Package Tables
- ✅ `multi_city_packages`
- ✅ `multi_city_hotel_packages`
- ✅ `multi_city_pricing_packages`
- ✅ `multi_city_hotel_pricing_packages`
- ✅ `multi_city_pricing_rows`
- ✅ `multi_city_hotel_pricing_rows`
- ✅ `multi_city_private_package_rows`
- ✅ `multi_city_hotel_private_package_rows`
- ✅ `multi_city_package_day_plans`
- ✅ `multi_city_hotel_package_day_plans`
- ✅ `multi_city_package_cities`
- ✅ `multi_city_hotel_package_cities`
- ✅ `multi_city_hotel_package_city_hotels`
- ✅ `multi_city_package_images`
- ✅ `multi_city_hotel_package_images`

**Total: 16 tables**

---

## 🔧 Running Migrations

If tables are missing, run the migration:

### Using Migration Script

```bash
# Set RDS connection details
export RDS_HOSTNAME=your-rds-endpoint.rds.amazonaws.com
export RDS_PORT=5432
export RDS_DATABASE=postgres
export RDS_USERNAME=postgres
export RDS_PASSWORD=your-password

# Run migration
./scripts/migrate-itinerary-tables.sh
```

### Using Lambda Migration Executor

If you have a Lambda function for migrations:

```bash
aws lambda invoke \
  --function-name travel-app-migration-executor \
  --payload '{"migration": "017_enhance_itinerary_days"}' \
  response.json
```

---

## ⚠️ Important Notes

### time_slots Column

The `time_slots` column in `itinerary_days` is **optional**:
- ✅ Code handles missing column gracefully (backward compatible)
- ✅ If missing, operations work without it
- ✅ To add it: Run migration `017_enhance_itinerary_days.sql`

### Backward Compatibility

All API routes and code handle:
- Missing `time_slots` column
- Missing tables (with proper error messages)
- Database connection issues

---

## 🚀 Quick Start

1. **Verify tables exist:**
   ```bash
   curl http://localhost:3000/api/admin/verify-tables | jq
   ```

2. **If tables are missing:**
   ```bash
   ./scripts/migrate-itinerary-tables.sh
   ```

3. **Re-verify:**
   ```bash
   curl http://localhost:3000/api/admin/verify-tables | jq
   ```

---

## 📊 Expected Output

### All Tables Exist
```json
{
  "success": true,
  "summary": {
    "total": 16,
    "found": 16,
    "missing": 0,
    "allTablesExist": true
  }
}
```

### Some Tables Missing
```json
{
  "success": true,
  "summary": {
    "total": 16,
    "found": 14,
    "missing": 2,
    "allTablesExist": false
  },
  "tables": {
    "missing": ["table1", "table2"]
  },
  "recommendations": [
    "Run migrations to create missing tables"
  ]
}
```

---

## 🔗 Related Files

- `src/app/api/admin/verify-tables/route.ts` - API endpoint
- `scripts/verify-itinerary-tables-aws.js` - AWS SDK script
- `scripts/verify-itinerary-tables.js` - Direct DB script
- `scripts/verify-tables-curl.sh` - cURL wrapper script
- `scripts/migrate-itinerary-tables.sh` - Migration script
- `supabase/migrations/017_enhance_itinerary_days.sql` - Migration file

---

**Last Updated**: 2025-12-13

