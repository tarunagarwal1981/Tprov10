#!/bin/bash
# Run Database Migration from EC2 Instance
# This script should be run on the EC2 instance in the same VPC as RDS

set -e

echo "🚀 Starting database migration from EC2..."

# RDS Configuration
RDS_HOST="travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com"
RDS_PORT="5432"
RDS_DB="postgres"
RDS_USER="postgres"
RDS_PASSWORD="ju3vrLHJUW8PqDG4"

# Migration file path (adjust if needed)
MIGRATION_FILE="/home/ec2-user/migration/001_phone_auth_schema.sql"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL client..."
    sudo yum install -y postgresql15
fi

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    echo "Please upload the migration file to the EC2 instance first."
    echo ""
    echo "From your local machine, run:"
    echo "scp -i ~/.ssh/your-key.pem migrations/001_phone_auth_schema.sql ec2-user@<EC2-IP>:/home/ec2-user/migration/"
    exit 1
fi

echo "📄 Migration file found: $MIGRATION_FILE"
echo "🔌 Connecting to RDS: $RDS_HOST"

# Set password as environment variable
export PGPASSWORD="$RDS_PASSWORD"

# Test connection first
echo "Testing connection..."
psql -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Connection successful!"
else
    echo "❌ Connection failed. Check RDS credentials and security group."
    exit 1
fi

# Run migration
echo ""
echo "📝 Running migration..."
psql -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    
    # Verify migration
    echo ""
    echo "🔍 Verifying migration..."
    psql -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" << EOF
-- Check users table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('country_code', 'phone_number', 'phone_verified', 'email_verified', 'auth_method', 'profile_completion_percentage', 'onboarding_completed')
ORDER BY column_name;

-- Check new tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('otp_codes', 'account_details', 'brand_details', 'business_details', 'documents', 'otp_rate_limits')
ORDER BY table_name;
EOF
    
    echo ""
    echo "✅ Migration verification complete!"
else
    echo ""
    echo "❌ Migration failed. Check the error messages above."
    exit 1
fi

# Clean up password
unset PGPASSWORD

echo ""
echo "🎉 All done! You can now terminate the EC2 instance if you want."

