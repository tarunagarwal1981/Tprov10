# Delete Existing Queries - Instructions

## Option 1: Via API Endpoint (Recommended - Easiest)

If your development server is running:

```bash
# Start the dev server (if not running)
npm run dev

# In another terminal, run:
curl -X POST http://localhost:3000/api/admin/delete-queries
```

**Response will show:**
- Number of queries deleted
- Verification count (should be 0)

**To check count before/after:**
```bash
curl http://localhost:3000/api/admin/delete-queries
```

## Option 2: Via AWS CLI (If AWS CLI is installed)

**Prerequisites:**
- AWS CLI installed: `brew install awscli` (macOS) or visit https://aws.amazon.com/cli/
- AWS credentials configured: `aws configure`

**Run the script:**
```bash
bash scripts/run-delete-queries.sh
```

**Or manually via AWS CLI:**
```bash
# Set variables
LAMBDA_FUNCTION_NAME="travel-app-database-service"
AWS_REGION="us-east-1"

# Delete queries
aws lambda invoke \
  --function-name "$LAMBDA_FUNCTION_NAME" \
  --region "$AWS_REGION" \
  --payload '{"action":"query","query":"DELETE FROM itinerary_queries","params":[]}' \
  /tmp/delete-result.json

# Verify
aws lambda invoke \
  --function-name "$LAMBDA_FUNCTION_NAME" \
  --region "$AWS_REGION" \
  --payload '{"action":"query","query":"SELECT COUNT(*) as remaining FROM itinerary_queries","params":[]}' \
  /tmp/verify-result.json

cat /tmp/verify-result.json
```

## Option 4: Direct SQL (If you have direct database access)

If you have direct access to the RDS database (via psql, DBeaver, etc.):

```sql
-- Delete all queries
DELETE FROM itinerary_queries;

-- Verify deletion
SELECT COUNT(*) as remaining_queries FROM itinerary_queries;
```

## Verification

After running any of the above methods, you can verify by:

1. **Via API** (if server is running):
   ```bash
   curl http://localhost:3000/api/admin/delete-queries
   ```

2. **Via Database Query**:
   ```sql
   SELECT COUNT(*) FROM itinerary_queries;
   ```

Expected result: `0` queries remaining.
