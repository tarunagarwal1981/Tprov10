#!/bin/bash
# Run import on EC2 instance via AWS Systems Manager
# Run this in CloudShell or your local terminal

INSTANCE_ID="i-0cf90a4dc4f39debd"
RDS_ENDPOINT="travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com"
RDS_PASSWORD="ju3vrLHJUW8PqDG4"

echo "🚀 Running import on EC2 instance via SSM..."
echo ""

# Command to run on EC2 instance
COMMAND=$(cat <<'EOF'
export PGPASSWORD='ju3vrLHJUW8PqDG4'

# Download files if not already there
if [ ! -f /tmp/supabase_schema.sql ]; then
  aws s3 cp s3://travel-app-storage-1769/migration/supabase_schema.sql /tmp/
fi
if [ ! -f /tmp/supabase_data.sql ]; then
  aws s3 cp s3://travel-app-storage-1769/migration/supabase_data.sql /tmp/
fi

# Import schema
echo "📥 Importing schema..."
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=/tmp/supabase_schema.sql

# Import data
echo "📥 Importing data..."
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=/tmp/supabase_data.sql

# Verify
echo "🔍 Verifying..."
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --command="SELECT 'users' as table_name, COUNT(*) FROM users UNION ALL SELECT 'activity_packages', COUNT(*) FROM activity_packages;"

echo "✅ Import complete!"
EOF
)

# Send command via SSM
aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters "commands=[$(echo "$COMMAND" | jq -Rs .)]" \
  --output text \
  --query "Command.CommandId"

echo ""
echo "Command sent! Check status with:"
echo "  aws ssm list-command-invocations --command-id <COMMAND_ID> --details"

