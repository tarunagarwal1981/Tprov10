# Fix Exposed AWS Credentials - Complete Guide

## ⚠️ Critical Security Issue

If your AWS credentials were:
- ✅ Used in terminal/command line
- ✅ Pushed to GitHub (public or private)
- ✅ Committed to git history

Then **AWS will keep reapplying the quarantine policy** until you:
1. **Rotate/regenerate the credentials**
2. **Remove them from git history**
3. **Ensure they're not exposed anywhere**

## Why AWS Reapplies the Policy

AWS continuously monitors for:
- Credentials in public GitHub repositories
- Credentials in public code sharing sites
- Unusual access patterns
- Credentials in logs or error messages

If they detect your credentials are exposed, they **automatically reapply** the quarantine policy to protect your account.

## Complete Fix Process

### Step 1: Check if Credentials Are Exposed

#### Check GitHub

1. Go to: https://github.com/search
2. Search for your access key: `AKIA332JH3CCMUBDOGU3`
3. Search for your secret key (first few characters): `nfLlhkojNW9TEU0cyDDDjihlThCv4461nK6XEn`
4. If found, they're exposed and need to be removed

#### Check Git History

```bash
# Search git history for your access key
git log --all --full-history -p -S "AKIA332JH3CCMUBDOGU3"

# Search for secret key
git log --all --full-history -p -S "nfLlhkojNW9TEU0cyDDDjihlThCv4461nK6XEn"
```

If found, they're in your git history.

### Step 2: Rotate/Create New Credentials

**DO THIS FIRST** - Don't just remove the policy!

#### Option A: Create New IAM User (RECOMMENDED)

1. **Go to IAM Console**: https://console.aws.amazon.com/iam/
2. **Create New User**:
   - Click "Users" → "Create user"
   - Name: `travel-app-production` (or similar)
   - Access type: **Programmatic access only** (no console)
3. **Attach Minimal Policy**:
   - Click "Attach policies directly"
   - Create custom policy with only what you need:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketCORS",
        "s3:PutBucketCORS"
      ],
      "Resource": [
        "arn:aws:s3:::travel-app-storage-1769",
        "arn:aws:s3:::travel-app-storage-1769/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:us-east-1:815660521604:function:travel-app-database-service"
    }
  ]
}
```

4. **Get New Access Keys**:
   - Go to "Security credentials" tab
   - Click "Create access key"
   - **Save these immediately** (you can only see secret once)

#### Option B: Rotate Existing User's Credentials

1. **Go to IAM → Users → tarunagarwal**
2. **Security credentials tab**
3. **Delete old access key** (the exposed one: `AKIA332JH3CCMUBDOGU3`)
4. **Create new access key**
5. **Save new credentials**

### Step 3: Remove Credentials from Git History

**⚠️ CRITICAL**: If credentials were pushed to GitHub, they're compromised forever. Even if you delete them, they're in git history.

#### Option A: Use git-filter-repo (Recommended)

```bash
# Install git-filter-repo if needed
pip install git-filter-repo

# Remove access key from entire history
git filter-repo --replace-text <(echo "AKIA332JH3CCMUBDOGU3==>REDACTED")

# Remove secret key from entire history
git filter-repo --replace-text <(echo "nfLlhkojNW9TEU0cyDDDjihlThCv4461nK6XEn==>REDACTED")
```

#### Option B: Use BFG Repo-Cleaner

```bash
# Download BFG: https://rtyley.github.io/bfg-repo-cleaner/

# Remove credentials
java -jar bfg.jar --replace-text credentials.txt

# Where credentials.txt contains:
# AKIA332JH3CCMUBDOGU3==>REDACTED
# nfLlhkojNW9TEU0cyDDDjihlThCv4461nK6XEn==>REDACTED
```

#### Option C: Manual Cleanup (If repo is small)

```bash
# Create a script to replace in all files
find . -type f -name "*.env*" -o -name "*.local" | xargs sed -i '' 's/AKIA332JH3CCMUBDOGU3/REDACTED/g'
find . -type f -name "*.env*" -name "*.local" | xargs sed -i '' 's/nfLlhkojNW9TEU0cyDDDjihlThCv4461nK6XEn/REDACTED/g'

# Force push (WARNING: This rewrites history)
git add -A
git commit -m "Remove exposed credentials"
git push --force
```

**⚠️ WARNING**: Force pushing rewrites history. Coordinate with your team first!

### Step 4: Update Local Environment

1. **Update `.env.local`** with new credentials:
```bash
AWS_ACCESS_KEY_ID=<new-access-key>
AWS_SECRET_ACCESS_KEY=<new-secret-key>
AWS_REGION=us-east-1
```

2. **Add `.env.local` to `.gitignore`** (if not already):
```bash
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore
```

3. **Verify `.gitignore`**:
```bash
cat .gitignore | grep env
```

### Step 5: Remove Quarantine Policy (After New Credentials Work)

**Only after**:
- ✅ New credentials are created
- ✅ Old credentials are deleted
- ✅ Credentials removed from git
- ✅ New credentials tested and working

Then you can:
1. Go to IAM → Users → tarunagarwal → Permissions
2. Remove or update `AWSCompromisedKeyQuarantineV3` policy
3. Or better: **Detach it and don't use that user anymore**

### Step 6: Prevent Future Exposure

#### Use Environment Variables (Never Commit)

```bash
# .env.local (in .gitignore)
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# Never commit this file!
```

#### Use AWS Secrets Manager (Production)

For production, use AWS Secrets Manager instead of environment variables:

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });
const secret = await client.send(
  new GetSecretValueCommand({ SecretId: "travel-app-credentials" })
);
```

#### Use IAM Roles (Best for AWS Services)

If running on AWS (Lambda, EC2, ECS), use IAM roles instead of access keys.

## Will AWS Reapply the Policy?

**YES**, if:
- ❌ Old credentials are still active
- ❌ Credentials are still in public GitHub
- ❌ Credentials are still in git history (even if deleted)
- ❌ AWS detects the same credentials being used

**NO**, if:
- ✅ Old credentials are deleted/rotated
- ✅ Credentials removed from all public places
- ✅ Using new, never-exposed credentials
- ✅ Credentials properly secured (not in git)

## Quick Checklist

- [ ] Check GitHub for exposed credentials
- [ ] Check git history for credentials
- [ ] Create new IAM user with minimal permissions
- [ ] Get new access keys
- [ ] Delete old access keys
- [ ] Remove credentials from git history
- [ ] Update `.env.local` with new credentials
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Test application with new credentials
- [ ] Remove/update quarantine policy (only after above is done)
- [ ] Monitor for policy reappearance

## Important Notes

1. **GitHub History is Permanent**: Even if you delete a file, it's in git history. You must rewrite history.

2. **AWS Monitors Continuously**: AWS scans public repos and can detect exposed credentials even months later.

3. **Quarantine Policy is Protection**: Don't just remove it - fix the root cause (exposed credentials).

4. **New Credentials = New Start**: Once you rotate credentials and remove them from git, AWS should stop reapplying the policy.

5. **Consider Using AWS Secrets Manager**: For production, use Secrets Manager or IAM roles instead of access keys in code.

## After Fixing

1. **Wait 24-48 hours** after rotating credentials
2. **Monitor AWS Security Hub** for any alerts
3. **Check IAM Access Analyzer** for any unusual access
4. **Set up CloudWatch alarms** for credential usage

If the policy reappears after fixing everything, contact AWS Support - there may be other exposed credentials you're not aware of.
