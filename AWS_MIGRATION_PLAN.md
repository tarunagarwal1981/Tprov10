# AWS Migration Plan - Complete Guide
## From Supabase to AWS Infrastructure

---

## 📋 Executive Summary

**Current Setup:** Supabase (PostgreSQL + Auth + Storage + Realtime) + Netlify hosting  
**Target Scale:** 2,000-5,000 concurrent users  
**Migration Timeline:** 2-3 weeks (aggressive), 4-6 weeks (recommended)  
**Estimated Monthly Cost:** $250-$450/month at target scale

---

## 🎯 AWS Services Mapping

### 1. **Database → Amazon RDS PostgreSQL**
**Supabase Feature:** PostgreSQL with RLS policies  
**AWS Replacement:** Amazon RDS for PostgreSQL (or Aurora PostgreSQL Serverless v2)

**Why:**
- Fully managed PostgreSQL
- Supports all your current features (RLS, triggers, functions)
- Auto-scaling storage
- Automated backups
- Multi-AZ for high availability

**Configuration:**
- **Instance Type:** db.t4g.medium (2 vCPU, 4 GB RAM) - $80/month
- **Alternative:** Aurora Serverless v2 (0.5-2 ACU) - $90-$180/month
- **Storage:** 100 GB General Purpose SSD (gp3) - $11.50/month
- **Backups:** 7-day retention included

**Cost:** ~$92-$192/month

---

### 2. **Authentication → Amazon Cognito**
**Supabase Feature:** Email/Password + OAuth (Google, GitHub)  
**AWS Replacement:** Amazon Cognito User Pools + Identity Pools

**Why:**
- Native AWS integration
- Supports email/password + social OAuth
- JWT tokens compatible with your current flow
- Built-in MFA, password policies
- Free tier: 50,000 MAU (Monthly Active Users)

**Features Mapping:**
- ✅ Email/Password login → Cognito User Pools
- ✅ OAuth (Google, GitHub) → Federated Identity Providers
- ✅ Password reset → Built-in email templates
- ✅ JWT tokens → Cognito-issued tokens
- ✅ User metadata → Custom attributes
- ✅ Session management → Cognito tokens with refresh

**Cost:** FREE for first 50,000 MAU, then $0.0055/MAU
- For 5,000 concurrent users (~15,000 MAU): **FREE**

---

### 3. **Object Storage → Amazon S3**
**Supabase Feature:** Storage buckets for images  
**AWS Replacement:** Amazon S3 + CloudFront CDN

**Why:**
- Industry standard, 99.999999999% durability
- Intelligent tiering for cost optimization
- CloudFront CDN for fast global delivery
- Versioning, lifecycle policies

**Buckets to Migrate:**
- `activity-package-images`
- `transfer-packages`

**Configuration:**
- **S3 Bucket:** Private with signed URLs or public with CloudFront
- **CloudFront:** Global CDN for image delivery
- **S3 Transfer Acceleration:** For faster uploads (optional)

**Cost:**
- S3 Storage (100 GB): $2.30/month
- S3 Requests (1M PUT, 10M GET): $10/month
- CloudFront (100 GB transfer): $8.50/month
- **Total:** ~$21/month

---

### 4. **Realtime → AWS AppSync or AWS IoT Core**
**Supabase Feature:** Postgres changes subscription for notifications  
**AWS Replacement:** 
- **Option A:** AWS AppSync (GraphQL subscriptions) - **RECOMMENDED**
- **Option B:** AWS IoT Core (WebSocket MQTT)
- **Option C:** API Gateway WebSocket + Lambda

**Why AppSync (Recommended):**
- Real-time GraphQL subscriptions
- Built-in authorization
- DynamoDB or RDS as data source
- Scales automatically
- Most similar to Supabase Realtime

**Implementation:**
- Database triggers → Lambda → AppSync mutation → Subscription broadcast
- Or use DynamoDB Streams for real-time updates

**Cost:**
- AppSync: $4 per million query/mutation operations
- First 250,000 requests/month FREE
- For notifications: ~$5-10/month

---

### 5. **Hosting → AWS Amplify or Elastic Beanstalk**
**Current:** Netlify  
**AWS Replacement:** 
- **Option A:** AWS Amplify Hosting (Next.js SSR) - **RECOMMENDED**
- **Option B:** EC2 + ALB + Auto Scaling
- **Option C:** ECS Fargate + ALB

**Why Amplify (Recommended):**
- Built for Next.js, supports SSR/SSG
- Automatic CI/CD from Git
- Global CDN included
- Preview deployments
- Free SSL certificates
- Built-in monitoring

**Cost:**
- Build time: $0.01/minute (typically 5-10 min/build)
- Hosting: $0.15/GB stored, $0.15/GB served
- Estimated: $15-30/month

---

### 6. **Backend API → AWS Lambda + API Gateway**
**Supabase Feature:** PostgREST API auto-generated from database  
**AWS Replacement:** AWS Lambda functions + API Gateway REST/HTTP API

**Why:**
- Serverless, pay per request
- Auto-scaling
- Integrate with Cognito for auth
- Can use existing Next.js API routes

**Implementation:**
- Option 1: Keep Next.js API routes (deploy with Amplify)
- Option 2: Separate Lambda functions + API Gateway
- **Recommended:** Use Next.js API routes (simpler migration)

**Cost:**
- Lambda: 1M requests FREE, then $0.20/1M requests
- API Gateway: 1M requests = $3.50
- For your scale: ~$10-20/month

---

## 💰 Total Cost Breakdown

### Monthly Costs at 2,000-5,000 Concurrent Users

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| **RDS PostgreSQL** | db.t4g.medium | $92 |
| **OR Aurora Serverless v2** | 0.5-2 ACU | $90-$180 |
| **Cognito** | <50K MAU | FREE |
| **S3 + CloudFront** | 100GB storage + CDN | $21 |
| **AppSync** | Real-time notifications | $10 |
| **Amplify Hosting** | Next.js + CDN | $25 |
| **Lambda + API Gateway** | Serverless functions | $15 |
| **CloudWatch** | Monitoring & Logs | $10 |
| **Data Transfer** | Outbound traffic | $20-50 |
| **Backup & Misc** | Additional services | $20 |
| | | |
| **TOTAL (RDS)** | | **$213-$243** |
| **TOTAL (Aurora)** | | **$291-$381** |

**Recommended Starting Budget:** $250-$300/month

**Cost Optimization Tips:**
1. Use Aurora Serverless v2 to scale down during low traffic
2. S3 Intelligent-Tiering for image storage
3. CloudFront caching to reduce origin requests
4. Reserved Instances for predictable workloads (save 30-40%)

---

## 📅 Migration Timeline

### 🚀 FAST TRACK: 2-3 Weeks (Aggressive)

#### Week 1: Infrastructure Setup
**Days 1-2: AWS Account & Core Services**
- [ ] Create AWS Organization & Account
- [ ] Set up IAM roles and policies
- [ ] Provision RDS PostgreSQL instance
- [ ] Configure VPC, Security Groups, Subnets
- [ ] Set up S3 buckets for storage
- [ ] Configure CloudFront distribution

**Days 3-4: Database Migration**
- [ ] Export Supabase database schema (pg_dump)
- [ ] Import schema to RDS
- [ ] Migrate all tables, indexes, triggers, functions
- [ ] Verify RLS policies work correctly
- [ ] Test all database operations

**Days 5-7: Authentication Setup**
- [ ] Configure Cognito User Pool
- [ ] Set up OAuth providers (Google, GitHub)
- [ ] Create custom authentication UI (or use Cognito Hosted UI)
- [ ] Implement JWT token handling in Next.js
- [ ] Migrate user data (create migration script)

#### Week 2: Storage, Realtime & Backend
**Days 8-9: Object Storage**
- [ ] Copy all images from Supabase Storage to S3
- [ ] Update upload functions to use S3 SDK
- [ ] Configure CloudFront signed URLs (if needed)
- [ ] Test upload/download flows

**Days 10-11: Realtime Notifications**
- [ ] Set up AWS AppSync
- [ ] Create GraphQL schema for notifications
- [ ] Configure DynamoDB table (or RDS as data source)
- [ ] Implement Lambda triggers for database changes
- [ ] Update frontend to use AppSync subscriptions

**Days 12-14: Backend API**
- [ ] Update database connection to RDS
- [ ] Replace Supabase client with AWS SDK
- [ ] Update authentication middleware for Cognito
- [ ] Test all API endpoints
- [ ] Update environment variables

#### Week 3: Testing & Deployment
**Days 15-17: Integration Testing**
- [ ] End-to-end testing (auth, CRUD, file upload, realtime)
- [ ] Load testing (simulate 2,000-5,000 concurrent users)
- [ ] Security audit (IAM, CORS, API Gateway)
- [ ] Performance optimization

**Days 18-19: Deployment**
- [ ] Set up Amplify Hosting
- [ ] Configure CI/CD pipeline
- [ ] Deploy to staging environment
- [ ] Final smoke tests

**Days 20-21: Go Live**
- [ ] DNS cutover (or blue-green deployment)
- [ ] Monitor logs and metrics
- [ ] Gradual traffic migration (if possible)
- [ ] Post-deployment monitoring

---

### 🛡️ RECOMMENDED: 4-6 Weeks (Safer)

This timeline adds:
- More thorough testing (1 week)
- Staging environment validation (1 week)
- Rollback planning and documentation
- Team training on AWS services
- Buffer for unexpected issues

---

## 🔧 Detailed Implementation Guide

### Phase 1: Database Migration (RDS PostgreSQL)

#### Step 1.1: Export Supabase Database
```bash
# SSH into Supabase or use their dashboard export
pg_dump --host=<supabase-host> \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --schema=public \
  --no-owner \
  --no-acl \
  --format=plain \
  --file=supabase_backup.sql
```

#### Step 1.2: Provision RDS Instance
```bash
aws rds create-db-instance \
  --db-instance-identifier travel-app-db \
  --db-instance-class db.t4g.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --backup-retention-period 7 \
  --vpc-security-group-ids <security-group-id> \
  --db-subnet-group-name <subnet-group> \
  --publicly-accessible false \
  --multi-az false  # true for production
```

#### Step 1.3: Import Database
```bash
psql --host=<rds-endpoint> \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --file=supabase_backup.sql
```

#### Step 1.4: Verify Migration
```sql
-- Check table count
SELECT count(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verify RLS policies
SELECT * FROM pg_policies;

-- Test sample queries
SELECT * FROM users LIMIT 5;
SELECT * FROM activity_packages LIMIT 5;
```

---

### Phase 2: Authentication Migration (Cognito)

#### Step 2.1: Create Cognito User Pool
```bash
aws cognito-idp create-user-pool \
  --pool-name travel-app-users \
  --auto-verified-attributes email \
  --mfa-configuration OFF \
  --email-configuration EmailSendingAccount=COGNITO_DEFAULT \
  --password-policy MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true \
  --schema Name=email,AttributeDataType=String,Required=true,Mutable=true \
  --schema Name=role,AttributeDataType=String,Required=false,Mutable=true
```

#### Step 2.2: Configure OAuth Providers
```bash
# Google OAuth
aws cognito-idp create-identity-provider \
  --user-pool-id <user-pool-id> \
  --provider-name Google \
  --provider-type Google \
  --provider-details client_id=<google-client-id>,client_secret=<google-client-secret>,authorize_scopes="email profile openid" \
  --attribute-mapping email=email

# GitHub OAuth
aws cognito-idp create-identity-provider \
  --user-pool-id <user-pool-id> \
  --provider-name GitHub \
  --provider-type GitHub \
  --provider-details client_id=<github-client-id>,client_secret=<github-client-secret> \
  --attribute-mapping email=email
```

#### Step 2.3: Create App Client
```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id <user-pool-id> \
  --client-name travel-app-client \
  --generate-secret false \
  --supported-identity-providers COGNITO Google GitHub \
  --callback-urls https://yourdomain.com/auth/callback \
  --logout-urls https://yourdomain.com/logout \
  --allowed-o-auth-flows code implicit \
  --allowed-o-auth-scopes email openid profile \
  --allowed-o-auth-flows-user-pool-client true
```

#### Step 2.4: Migrate Users (Script)
```typescript
// migrate-users.ts
import { CognitoIdentityProviderClient, AdminCreateUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const cognito = new CognitoIdentityProviderClient({ region: "us-east-1" });

async function migrateUsers() {
  // Get all users from Supabase
  const { data: users } = await supabase.from('users').select('*');
  
  for (const user of users) {
    try {
      await cognito.send(new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: user.email,
        UserAttributes: [
          { Name: 'email', Value: user.email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'custom:role', Value: user.role },
          { Name: 'custom:user_id', Value: user.id },
        ],
        MessageAction: 'SUPPRESS', // Don't send welcome email
      }));
      
      console.log(`✅ Migrated user: ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to migrate ${user.email}:`, error);
    }
  }
}
```

#### Step 2.5: Update Next.js Auth Code
```typescript
// lib/aws/cognito-client.ts
import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export async function signIn(email: string, password: string) {
  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });
  
  const response = await client.send(command);
  return {
    accessToken: response.AuthenticationResult?.AccessToken,
    idToken: response.AuthenticationResult?.IdToken,
    refreshToken: response.AuthenticationResult?.RefreshToken,
  };
}
```

---

### Phase 3: Object Storage Migration (S3)

#### Step 3.1: Create S3 Buckets
```bash
# Main storage bucket
aws s3 mb s3://travel-app-storage --region us-east-1

# Configure bucket policy
aws s3api put-bucket-policy --bucket travel-app-storage --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::ACCOUNT-ID:role/amplify-role"},
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::travel-app-storage/*"
  }]
}'

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket travel-app-storage \
  --versioning-configuration Status=Enabled
```

#### Step 3.2: Configure CloudFront
```bash
aws cloudfront create-distribution \
  --origin-domain-name travel-app-storage.s3.us-east-1.amazonaws.com \
  --default-root-object index.html \
  --enabled \
  --comment "Travel App CDN"
```

#### Step 3.3: Migrate Images from Supabase to S3
```typescript
// migrate-storage.ts
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const s3 = new S3Client({ region: "us-east-1" });

async function migrateImages() {
  const buckets = ['activity-package-images', 'transfer-packages'];
  
  for (const bucket of buckets) {
    // List all files in Supabase bucket
    const { data: files } = await supabase.storage.from(bucket).list();
    
    for (const file of files) {
      // Download from Supabase
      const { data: supabaseUrl } = supabase.storage.from(bucket).getPublicUrl(file.name);
      const response = await axios.get(supabaseUrl.publicUrl, { responseType: 'arraybuffer' });
      
      // Upload to S3
      await s3.send(new PutObjectCommand({
        Bucket: 'travel-app-storage',
        Key: `${bucket}/${file.name}`,
        Body: response.data,
        ContentType: file.metadata?.mimetype || 'image/jpeg',
      }));
      
      console.log(`✅ Migrated: ${file.name}`);
    }
  }
}
```

#### Step 3.4: Update Upload Functions
```typescript
// lib/aws/s3-upload.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function uploadFile(file: File, folder: string) {
  const key = `${folder}/${Date.now()}-${file.name}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: file.type,
  });
  
  await s3.send(command);
  
  // Get CloudFront URL
  const publicUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`;
  return { path: key, publicUrl };
}

// Generate presigned URL for direct browser upload (more efficient)
export async function getPresignedUploadUrl(fileName: string, folder: string) {
  const key = `${folder}/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });
  
  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return { signedUrl, key };
}
```

---

### Phase 4: Realtime Notifications (AppSync)

#### Step 4.1: Create AppSync API
```bash
aws appsync create-graphql-api \
  --name travel-app-notifications \
  --authentication-type API_KEY \
  --additional-authentication-providers authenticationType=AMAZON_COGNITO_USER_POOLS,userPoolConfig={userPoolId=<pool-id>,awsRegion=us-east-1}
```

#### Step 4.2: Define GraphQL Schema
```graphql
# schema.graphql
type Notification {
  id: ID!
  userId: String!
  title: String!
  message: String!
  type: String!
  isRead: Boolean!
  timestamp: AWSDateTime!
}

type Query {
  getNotification(id: ID!): Notification
  listNotifications(userId: String!): [Notification]
}

type Mutation {
  createNotification(input: CreateNotificationInput!): Notification
  markAsRead(id: ID!): Notification
}

type Subscription {
  onNotificationCreated(userId: String!): Notification
    @aws_subscribe(mutations: ["createNotification"])
}

input CreateNotificationInput {
  userId: String!
  title: String!
  message: String!
  type: String!
}
```

#### Step 4.3: Create DynamoDB Table
```bash
aws dynamodb create-table \
  --table-name notifications \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=userId-index,KeySchema=[{AttributeName=userId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --billing-mode PAY_PER_REQUEST
```

#### Step 4.4: Lambda Trigger from RDS
```typescript
// lambda/db-notification-trigger.ts
import { AppSyncClient, EvaluateCodeCommand } from "@aws-sdk/client-appsync";

const appsync = new AppSyncClient({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  // This Lambda is triggered by EventBridge from RDS events
  // Or by a custom trigger mechanism
  
  const notification = {
    userId: event.detail.userId,
    title: event.detail.title,
    message: event.detail.message,
    type: event.detail.type,
  };
  
  // Send mutation to AppSync
  const mutation = `
    mutation CreateNotification($input: CreateNotificationInput!) {
      createNotification(input: $input) {
        id userId title message type timestamp
      }
    }
  `;
  
  // Execute GraphQL mutation
  // This will trigger subscriptions for all connected clients
  await appsync.send(new EvaluateCodeCommand({
    code: mutation,
    context: JSON.stringify({ arguments: { input: notification } }),
  }));
};
```

#### Step 4.5: Update Frontend to Use AppSync
```typescript
// lib/aws/appsync-client.ts
import { AWSAppSyncClient } from 'aws-appsync';
import { AUTH_TYPE } from 'aws-appsync-auth-link';

const client = new AWSAppSyncClient({
  url: process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT!,
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  auth: {
    type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
    jwtToken: async () => {
      // Get current Cognito token
      return localStorage.getItem('idToken') || '';
    },
  },
});

// Subscribe to notifications
const subscription = client.subscribe({
  query: gql`
    subscription OnNotificationCreated($userId: String!) {
      onNotificationCreated(userId: $userId) {
        id title message type timestamp
      }
    }
  `,
  variables: { userId: currentUserId },
}).subscribe({
  next: (data) => {
    console.log('New notification:', data);
    // Update UI
  },
});
```

---

### Phase 5: Hosting & Deployment (Amplify)

#### Step 5.1: Initialize Amplify Project
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize
amplify init

# Add hosting
amplify add hosting
# Choose: Amazon CloudFront and S3

# Configure for Next.js SSR
amplify configure hosting
```

#### Step 5.2: Update amplify.yml
```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

#### Step 5.3: Environment Variables
Add these in Amplify Console:
```bash
AWS_REGION=us-east-1
RDS_HOSTNAME=<rds-endpoint>
RDS_DATABASE=postgres
RDS_USERNAME=postgres
RDS_PASSWORD=<password>
COGNITO_USER_POOL_ID=<pool-id>
COGNITO_CLIENT_ID=<client-id>
S3_BUCKET_NAME=travel-app-storage
CLOUDFRONT_DOMAIN=<cloudfront-domain>
APPSYNC_ENDPOINT=<appsync-endpoint>
```

#### Step 5.4: Deploy
```bash
git push origin main
# Amplify auto-deploys on git push
```

---

## 🔒 Security Checklist

- [ ] Enable encryption at rest for RDS
- [ ] Use SSL/TLS for all connections
- [ ] Configure VPC with private subnets for RDS
- [ ] Set up Security Groups with least privilege
- [ ] Enable S3 bucket encryption
- [ ] Use CloudFront signed URLs for private content
- [ ] Configure WAF rules on CloudFront
- [ ] Enable CloudTrail for audit logging
- [ ] Set up IAM roles with minimum permissions
- [ ] Enable MFA for AWS root account
- [ ] Use AWS Secrets Manager for credentials
- [ ] Configure CORS properly on API Gateway
- [ ] Enable Cognito advanced security features
- [ ] Set up AWS Config for compliance monitoring

---

## 📊 Monitoring & Logging

### CloudWatch Dashboards
```bash
# Create custom dashboard
aws cloudwatch put-dashboard --dashboard-name travel-app-monitoring --dashboard-body '{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/RDS", "CPUUtilization", {"stat": "Average"}],
          ["AWS/RDS", "DatabaseConnections"],
          ["AWS/Lambda", "Invocations"],
          ["AWS/Lambda", "Errors"],
          ["AWS/S3", "NumberOfObjects"],
          ["AWS/CloudFront", "Requests"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "System Overview"
      }
    }
  ]
}'
```

### Alerts
```bash
# High CPU alert
aws cloudwatch put-metric-alarm \
  --alarm-name rds-high-cpu \
  --alarm-description "Alert when RDS CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## 🚨 Rollback Plan

### Emergency Rollback Procedure

1. **Database Rollback**
   - Keep Supabase instance running for 2 weeks post-migration
   - Take RDS snapshot before cutover
   - Document rollback steps

2. **DNS Rollback**
   - Keep old Netlify deployment active
   - Use Route 53 weighted routing for gradual migration
   - Can instantly switch back DNS

3. **Authentication Rollback**
   - Keep Supabase Auth active during transition
   - Use feature flags to switch between providers

---

## ✅ Post-Migration Checklist

- [ ] All database queries working
- [ ] Authentication (email, Google, GitHub) functional
- [ ] File upload/download working
- [ ] Realtime notifications functioning
- [ ] Performance metrics within acceptable range
- [ ] All environment variables set correctly
- [ ] SSL certificates configured
- [ ] Monitoring dashboards active
- [ ] Backup strategy verified
- [ ] Cost monitoring enabled
- [ ] Documentation updated
- [ ] Team trained on AWS console

---

## 📈 Scaling Recommendations

### At 2,000 concurrent users:
- db.t4g.medium RDS instance
- Single-AZ deployment
- Basic CloudWatch monitoring

### At 5,000 concurrent users:
- db.t4g.large RDS instance OR Aurora Serverless v2
- Multi-AZ deployment
- Enhanced monitoring
- Read replicas (if read-heavy)

### Beyond 10,000 users:
- Aurora PostgreSQL Cluster with read replicas
- ElastiCache Redis for session storage
- Multiple Amplify instances in different regions
- AWS Shield Advanced for DDoS protection

---

## 🤝 Alternative: Hybrid Approach

**Why Consider:** Faster migration, lower risk

**Strategy:**
1. Keep Supabase for auth + database (month 1)
2. Migrate storage to S3 + CloudFront (week 1-2)
3. Migrate hosting to Amplify (week 2-3)
4. Migrate database to RDS (week 4-6)
5. Migrate auth to Cognito (week 7-8)

**Benefits:**
- Lower risk
- Can test each component independently
- Easier rollback

**Downside:**
- Pay for both platforms during transition
- More complex architecture temporarily

---

## 📞 Next Steps

1. **Decision Point:** Choose timeline (2-3 weeks vs 4-6 weeks)
2. **AWS Account Setup:** Create organization, set up billing alerts
3. **Provision RDS:** Start with database (longest setup time)
4. **Schema Export:** Export current Supabase schema
5. **Create Migration Scripts:** User migration, data migration
6. **Set up Staging Environment:** Test everything before production

---

## 💡 Pro Tips

1. **Use AWS CDK or Terraform** for infrastructure as code
2. **Enable AWS Cost Explorer** from day 1
3. **Set up billing alerts** at $100, $200, $300
4. **Use AWS Free Tier** where possible (first 12 months)
5. **Consider Aurora Serverless v2** if traffic is variable
6. **Use Lambda@Edge** for advanced CloudFront customization
7. **Implement connection pooling** for RDS (pgBouncer or RDS Proxy)
8. **Use S3 Intelligent-Tiering** for automatic cost optimization

---

## 🎓 Team Training Resources

- AWS Free Training: https://aws.amazon.com/training/
- AWS Well-Architected Labs: https://wellarchitectedlabs.com/
- Amplify Documentation: https://docs.amplify.aws/
- Cognito Documentation: https://docs.aws.amazon.com/cognito/

---

## Summary

**Fastest Migration:** 2-3 weeks (aggressive, requires dedicated team)  
**Recommended:** 4-6 weeks (safer, includes thorough testing)  
**Monthly Cost:** $250-$450 for 2,000-5,000 concurrent users  
**Risk Level:** Medium (with proper testing and rollback plan)

**Primary Concern:** Authentication migration is most complex  
**Easiest Part:** Storage migration to S3  
**Performance:** Should match or exceed Supabase performance

Ready to start? Begin with Phase 1 (Database Setup) while I can help you create the migration scripts.

