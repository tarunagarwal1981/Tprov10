# AWS Migration Scripts

This directory contains scripts to help migrate data from Supabase to AWS.

## Scripts

### `migrate-users.ts`
Migrates all users from Supabase to AWS Cognito User Pool.

**Usage:**
```bash
npx ts-node aws-migration-scripts/migrate-users.ts
```

**Required Environment Variables:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `COGNITO_USER_POOL_ID` - AWS Cognito User Pool ID
- `COGNITO_CLIENT_ID` - AWS Cognito App Client ID
- `AWS_REGION` - AWS region (default: us-east-1)

**What it does:**
1. Fetches all users from Supabase
2. Creates users in Cognito with same email
3. Maps old Supabase user IDs to new Cognito user IDs
4. Updates database with `cognito_sub` field

### `migrate-storage.ts`
Migrates all images/files from Supabase Storage to AWS S3.

**Usage:**
```bash
npx ts-node aws-migration-scripts/migrate-storage.ts
```

**Required Environment Variables:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `S3_BUCKET_NAME` - AWS S3 bucket name
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_ACCESS_KEY_ID` - AWS access key (optional, uses default credentials if not set)
- `AWS_SECRET_ACCESS_KEY` - AWS secret key (optional)

**What it does:**
1. Lists all files in Supabase Storage buckets:
   - `activity-package-images`
   - `transfer-packages`
   - `multi-city-packages`
2. Downloads each file from Supabase
3. Uploads to S3 with same folder structure
4. Preserves metadata and content types

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up AWS credentials:
```bash
aws configure
```

Or set environment variables:
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
```

3. Set Supabase credentials:
```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Running Scripts

### Before Running
- Ensure you have completed Phase 1-3 of the migration (AWS setup, RDS, Cognito)
- Have your Supabase credentials ready
- Have your AWS credentials configured

### User Migration
```bash
# Set Cognito credentials
export COGNITO_USER_POOL_ID=us-east-1_xxxxx
export COGNITO_CLIENT_ID=xxxxx

# Run migration
npx ts-node aws-migration-scripts/migrate-users.ts
```

### Storage Migration
```bash
# Set S3 bucket name
export S3_BUCKET_NAME=travel-app-storage-xxx

# Run migration
npx ts-node aws-migration-scripts/migrate-storage.ts
```

## Notes

- Scripts are idempotent - safe to run multiple times
- Already migrated users/files will be skipped
- Scripts provide detailed progress and error reporting
- Database connection is required for user migration (to update cognito_sub)

## Troubleshooting

### "User already exists" errors
This is normal if you run the script multiple times. Users are skipped automatically.

### "File already exists" in S3
Files are checked before migration. Existing files are skipped.

### Connection errors
- Check your AWS credentials are configured correctly
- Verify Supabase credentials are correct
- Ensure network connectivity

### Rate limiting
Scripts include small delays to avoid rate limiting. If you encounter rate limits, increase delays in the scripts.

