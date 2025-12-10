# Phase 4: Fix S3 Access on EC2

## ❌ Error: "Unable to locate credentials"

The EC2 instance needs S3 read permissions. I've attached the policy, but you may need to wait a moment for it to propagate.

---

## ✅ Solution 1: Wait and Retry

The IAM policy has been attached. Wait **10-30 seconds** for it to propagate, then try again:

```bash
aws s3 cp s3://travel-app-storage-1769/migration/update-urls.sql /tmp/
```

---

## ✅ Solution 2: Use Instance Metadata (Alternative)

If the above still doesn't work, you can manually configure AWS CLI to use the instance profile:

```bash
# Get instance profile credentials
export AWS_DEFAULT_REGION=us-east-1
aws configure set region us-east-1

# Try again
aws s3 cp s3://travel-app-storage-1769/migration/update-urls.sql /tmp/
```

---

## ✅ Solution 3: Direct SQL (No S3 Download)

If S3 access still fails, you can create the SQL file directly on the instance:

```bash
# Create the SQL file directly
cat > /tmp/update-urls.sql << 'EOF'
-- Update Database URLs from Supabase to S3

-- Update public_url
UPDATE activity_package_images
SET public_url = REPLACE(
  public_url,
  'https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public/activity-package-images/',
  'https://travel-app-storage-1769.s3.us-east-1.amazonaws.com/activity-package-images/'
)
WHERE public_url LIKE '%supabase.co%';

-- Update storage_path
UPDATE activity_package_images
SET storage_path = REPLACE(
  storage_path,
  'https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public/activity-package-images/',
  'activity-package-images/'
)
WHERE storage_path LIKE '%supabase.co%';

-- Verify
SELECT 
  COUNT(*) FILTER (WHERE public_url LIKE '%supabase.co%' OR storage_path LIKE '%supabase.co%') as remaining,
  COUNT(*) FILTER (WHERE public_url LIKE '%s3.amazonaws.com%') as s3_count
FROM activity_package_images;

-- Show sample
SELECT id, LEFT(public_url, 80) as url
FROM activity_package_images
WHERE public_url LIKE '%s3.amazonaws.com%'
LIMIT 3;
EOF

# Then run it
export PGPASSWORD='ju3vrLHJUW8PqDG4'
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=/tmp/update-urls.sql
```

---

## 🎯 Recommended: Try Solution 3

**Solution 3 is the fastest** - it creates the SQL file directly on the instance without needing S3 access.

Copy-paste the entire Solution 3 block into your EC2 terminal!

