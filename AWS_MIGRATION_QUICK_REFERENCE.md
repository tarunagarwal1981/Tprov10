# AWS Migration - Quick Reference Guide

## 🚀 Quick Start Checklist

### Phase 1: AWS Setup (Day 1-2)
- [ ] Create AWS account, enable MFA
- [ ] Set up billing alerts ($100, $200, $300)
- [ ] Configure AWS CLI
- [ ] Create VPC with public/private subnets
- [ ] Create security groups (RDS, App)

### Phase 2: Database (Day 3-5)
- [ ] Export Supabase schema: `pg_dump --schema-only`
- [ ] Export Supabase data: `pg_dump --data-only`
- [ ] Create RDS PostgreSQL instance (db.t4g.medium)
- [ ] Import schema to RDS
- [ ] Import data to RDS
- [ ] Verify data integrity

### Phase 3: Authentication (Day 6-8)
- [ ] Create Cognito User Pool
- [ ] Configure OAuth providers (Google, GitHub)
- [ ] Create app client
- [ ] Run user migration script
- [ ] Update auth context code

### Phase 4: Storage (Day 9-11)
- [ ] Create S3 bucket
- [ ] Create CloudFront distribution
- [ ] Run storage migration script
- [ ] Update upload/download functions

### Phase 5: Code Migration (Day 12-16)
- [ ] Replace Supabase client with PostgreSQL
- [ ] Update all service files
- [ ] Update API routes
- [ ] Update environment variables
- [ ] Test locally

### Phase 6: Deployment (Day 17-21)
- [ ] Deploy to staging
- [ ] Integration testing
- [ ] Deploy to production
- [ ] Monitor and verify

---

## 📋 Environment Variables

### Before (Supabase)
```bash
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### After (AWS)
```bash
# Database
RDS_HOSTNAME=xxx.rds.amazonaws.com
RDS_PORT=5432
RDS_DATABASE=postgres
RDS_USERNAME=postgres
RDS_PASSWORD=xxx

# Cognito
COGNITO_USER_POOL_ID=us-east-1_xxx
COGNITO_CLIENT_ID=xxx
AWS_REGION=us-east-1

# S3 & CloudFront
S3_BUCKET_NAME=travel-app-storage-xxx
CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net
```

---

## 🔧 Key Commands

### Database Export
```bash
# Schema only
pg_dump --host=[SUPABASE_HOST] \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --schema-only \
  --no-owner \
  --no-acl \
  --file=supabase_schema.sql

# Data only
pg_dump --host=[SUPABASE_HOST] \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --data-only \
  --no-owner \
  --no-acl \
  --file=supabase_data.sql
```

### Database Import
```bash
psql --host=[RDS_ENDPOINT] \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --file=supabase_schema.sql
```

### User Migration
```bash
npx ts-node aws-migration-scripts/migrate-users.ts
```

### Storage Migration
```bash
npx ts-node aws-migration-scripts/migrate-storage.ts
```

---

## 🔄 Code Changes Summary

### Database Queries

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

**After (PostgreSQL):**
```typescript
import { queryOne } from '@/lib/aws/database';

const user = await queryOne<User>(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
```

### Authentication

**Before (Supabase):**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

**After (Cognito):**
```typescript
import { signIn } from '@/lib/aws/cognito';

const { accessToken, idToken } = await signIn(email, password);
```

### File Upload

**Before (Supabase):**
```typescript
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload(fileName, file);
```

**After (S3):**
```typescript
import { uploadFile } from '@/lib/aws/s3-upload';

const { path, publicUrl } = await uploadFile(file, 'folder-name');
```

---

## 📊 Cost Estimates

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| RDS PostgreSQL | db.t4g.medium | $92 |
| Cognito | <50K MAU | FREE |
| S3 + CloudFront | 100GB | $21 |
| AppSync (optional) | Notifications | $10 |
| Amplify Hosting | Next.js | $25 |
| Lambda + API Gateway | Serverless | $15 |
| **TOTAL** | | **~$163/month** |

---

## 🚨 Common Issues & Solutions

### Issue: RDS Connection Timeout
**Solution:** Check security group allows connections from your IP/VPC

### Issue: Cognito User Already Exists
**Solution:** User migration script handles this automatically

### Issue: S3 Upload Permission Denied
**Solution:** Check IAM role has s3:PutObject permission

### Issue: CloudFront 403 Forbidden
**Solution:** Check Origin Access Control configuration

---

## 📞 Support Resources

- **AWS Documentation:** https://docs.aws.amazon.com/
- **RDS:** https://docs.aws.amazon.com/rds/
- **Cognito:** https://docs.aws.amazon.com/cognito/
- **S3:** https://docs.aws.amazon.com/s3/
- **CloudFront:** https://docs.aws.amazon.com/cloudfront/

---

## ✅ Post-Migration Checklist

- [ ] All functionality working
- [ ] Performance acceptable
- [ ] Cost monitoring active
- [ ] Backups configured
- [ ] Monitoring dashboards set up
- [ ] Team documentation updated
- [ ] Old Supabase resources decommissioned (after 2 weeks)

---

**For detailed instructions, see: `AWS_MIGRATION_STEP_BY_STEP.md`**

