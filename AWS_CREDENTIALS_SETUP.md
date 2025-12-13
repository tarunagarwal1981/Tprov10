# AWS Credentials Setup Guide

## Required Credentials

To use AWS CLI/SDK for database operations, you'll need:

### 1. AWS Access Credentials
- **AWS Access Key ID** - Your AWS access key
- **AWS Secret Access Key** - Your AWS secret key
- **AWS Region** - e.g., `us-east-1`, `us-west-2`, etc.
- **AWS Session Token** (optional) - If using temporary credentials

### 2. Lambda Function Information
- **Lambda Function Name** - The name of your database service Lambda
  - Default: `travel-app-database-service`
  - Can be found in: AWS Console → Lambda → Functions

### 3. RDS Database Information (for direct connections)
- **RDS Endpoint** - Your RDS instance endpoint
  - Format: `your-db-instance.xxxxx.us-east-1.rds.amazonaws.com`
- **RDS Port** - Usually `5432` for PostgreSQL
- **Database Name** - Usually `postgres`
- **Database Username** - Your RDS master username
- **Database Password** - Your RDS master password

### 4. Secrets Manager (if using)
- **Secret Name** - The name of your Secrets Manager secret
  - Default: `travel-app/dev/secrets`
  - Contains: RDS credentials, etc.

---

## Setting Up Credentials

### Option 1: AWS CLI Configuration (Recommended)

```bash
# Configure AWS CLI
aws configure

# You'll be prompted for:
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key]
# Default region name: us-east-1
# Default output format: json
```

This creates:
- `~/.aws/credentials` - Contains your access keys
- `~/.aws/config` - Contains your region and output format

### Option 2: Environment Variables

```bash
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_REGION=us-east-1
export AWS_SESSION_TOKEN=your-session-token  # If using temporary credentials
```

### Option 3: AWS Credentials File (Manual)

Create `~/.aws/credentials`:
```ini
[default]
aws_access_key_id = your-access-key-id
aws_secret_access_key = your-secret-access-key
```

Create `~/.aws/config`:
```ini
[default]
region = us-east-1
output = json
```

---

## Verification Scripts Environment Variables

For the verification scripts, you may also need:

```bash
# Lambda Database Service
export DATABASE_LAMBDA_NAME=travel-app-database-service

# AWS Region
export AWS_REGION=us-east-1

# RDS Connection (for direct DB scripts)
export RDS_HOSTNAME=your-rds-endpoint.rds.amazonaws.com
export RDS_PORT=5432
export RDS_DATABASE=postgres
export RDS_USERNAME=postgres
export RDS_PASSWORD=your-password
```

---

## Getting Your Credentials

### AWS Access Keys
1. Go to AWS Console → IAM → Users
2. Select your user → Security credentials tab
3. Create access key → Download or copy credentials

### Lambda Function Name
1. Go to AWS Console → Lambda → Functions
2. Find your database service function
3. Copy the function name

### RDS Endpoint
1. Go to AWS Console → RDS → Databases
2. Select your database instance
3. Copy the endpoint from "Connectivity & security" section

---

## Security Best Practices

1. **Never commit credentials to git**
   - Add `~/.aws/` to `.gitignore`
   - Use environment variables in production

2. **Use IAM roles when possible**
   - EC2 instances can use instance roles
   - Lambda functions can use execution roles

3. **Rotate credentials regularly**
   - Change access keys every 90 days
   - Use temporary credentials when possible

4. **Limit permissions**
   - Only grant necessary permissions
   - Use least privilege principle

---

## Testing Your Setup

After configuring credentials, test with:

```bash
# Test AWS CLI
aws sts get-caller-identity

# Should return your AWS account ID and user ARN
```

---

## Next Steps

Once credentials are set up:
1. Run table verification: `./scripts/verify-tables-aws.sh`
2. Run migrations if needed: `./scripts/migrate-tables-aws.sh`
3. Verify database operations work correctly

