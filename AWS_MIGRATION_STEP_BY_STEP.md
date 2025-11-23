# AWS Migration - Complete Step-by-Step Guide
## From Supabase to AWS Infrastructure

---

## 📋 Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Phase 1: AWS Account & Infrastructure Setup](#phase-1-aws-account--infrastructure-setup)
3. [Phase 2: Database Migration (RDS PostgreSQL)](#phase-2-database-migration-rds-postgresql)
4. [Phase 3: Authentication Migration (Cognito)](#phase-3-authentication-migration-cognito)
5. [Phase 4: Storage Migration (S3 + CloudFront)](#phase-4-storage-migration-s3--cloudfront)
6. [Phase 5: Backend Code Migration](#phase-5-backend-code-migration)
7. [Phase 6: Testing & Deployment](#phase-6-testing--deployment)
8. [Rollback Plan](#rollback-plan)
9. [Post-Migration Checklist](#post-migration-checklist)

---

## 🎯 Pre-Migration Checklist

Before starting, ensure you have:

- [ ] AWS Account with billing alerts configured
- [ ] Access to Supabase dashboard and database credentials
- [ ] Database backup from Supabase
- [ ] List of all environment variables currently in use
- [ ] Documentation of all Supabase features being used
- [ ] Staging environment for testing
- [ ] Rollback plan documented

**Estimated Time:** 4-6 weeks  
**Estimated Cost:** $250-450/month at target scale

---

## Phase 1: AWS Account & Infrastructure Setup

### Step 1.1: Create AWS Account & Organization

1. **Create AWS Account**
   - Go to https://aws.amazon.com/
   - Sign up for new account
   - Enable MFA on root account
   - Set up billing alerts ($100, $200, $300 thresholds)

2. **Set Up IAM User**
   ```bash
   # Create IAM user for migration
   # AWS Console → IAM → Users → Create User
   # Attach policies: AdministratorAccess (temporary, for migration)
   # Generate access keys
   ```

3. **Configure AWS CLI**
   ```bash
   # Install AWS CLI
   # Windows: Download from AWS website
   # Or use: winget install Amazon.AWSCLI
   
   # Configure credentials
   aws configure
   # Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)
   ```

### Step 1.2: Set Up VPC & Networking

1. **Create VPC**
   ```bash
   # Using AWS Console:
   # VPC → Create VPC
   # Name: travel-app-vpc
   # IPv4 CIDR: 10.0.0.0/16
   # Tenancy: Default
   ```

2. **Create Subnets**
   ```bash
   # Create 2 public subnets (for RDS if needed, ALB)
   # Create 2 private subnets (for RDS)
   # Availability Zones: us-east-1a, us-east-1b
   
   # Public Subnet 1: 10.0.1.0/24 (us-east-1a)
   # Public Subnet 2: 10.0.2.0/24 (us-east-1b)
   # Private Subnet 1: 10.0.3.0/24 (us-east-1a)
   # Private Subnet 2: 10.0.4.0/24 (us-east-1b)
   ```

3. **Create Internet Gateway & Route Tables**
   ```bash
   # Internet Gateway → Attach to VPC
   # Route Table (Public) → Add route: 0.0.0.0/0 → Internet Gateway
   # Route Table (Private) → No internet route (for RDS)
   ```

4. **Create Security Groups**
   ```bash
   # Security Group: rds-sg
   # Inbound: PostgreSQL (5432) from VPC CIDR (10.0.0.0/16)
   # Outbound: All traffic
   
   # Security Group: app-sg
   # Inbound: HTTP (80), HTTPS (443) from 0.0.0.0/0
   # Outbound: All traffic
   ```

### Step 1.3: Install Required Tools

```bash
# Install Node.js packages for AWS SDK
npm install @aws-sdk/client-rds @aws-sdk/client-s3 @aws-sdk/client-cognito-identity-provider @aws-sdk/s3-request-presigner
npm install pg @types/pg  # PostgreSQL client
npm install aws-sdk  # AWS SDK v2 (for some services)

# Install PostgreSQL client tools (for migration)
# Windows: Download from https://www.postgresql.org/download/windows/
# Or use: winget install PostgreSQL.PostgreSQL
```

**✅ Phase 1 Complete When:**
- AWS account created with billing alerts
- VPC and subnets configured
- Security groups created
- AWS CLI configured
- Required tools installed

---

## Phase 2: Database Migration (RDS PostgreSQL)

### Step 2.1: Export Supabase Database Schema

1. **Get Supabase Connection String**
   - Go to Supabase Dashboard → Settings → Database
   - Copy connection string (or use connection pooling URL)
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

2. **Export Schema Only**
   ```bash
   # Export schema (structure only, no data)
   pg_dump --host=[SUPABASE_HOST] \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --schema-only \
     --no-owner \
     --no-acl \
     --file=supabase_schema.sql
   ```

3. **Export Data**
   ```bash
   # Export data (all tables)
   pg_dump --host=[SUPABASE_HOST] \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --data-only \
     --no-owner \
     --no-acl \
     --file=supabase_data.sql
   ```

4. **Export Everything (Full Backup)**
   ```bash
   # Complete backup (schema + data)
   pg_dump --host=[SUPABASE_HOST] \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --no-owner \
     --no-acl \
     --format=plain \
     --file=supabase_full_backup.sql
   ```

### Step 2.2: Provision RDS PostgreSQL Instance

1. **Create DB Subnet Group**
   ```bash
   # AWS Console → RDS → Subnet Groups → Create
   # Name: travel-app-db-subnet-group
   # VPC: travel-app-vpc
   # Availability Zones: us-east-1a, us-east-1b
   # Subnets: Private Subnet 1, Private Subnet 2
   ```

2. **Create RDS Instance**
   ```bash
   # AWS Console → RDS → Databases → Create Database
   # Engine: PostgreSQL
   # Version: 15.4 (or latest compatible)
   # Template: Production (or Dev/Test for staging)
   # DB Instance Identifier: travel-app-db
   # Master Username: postgres
   # Master Password: [STRONG_PASSWORD] (save this!)
   # DB Instance Class: db.t4g.medium (2 vCPU, 4 GB RAM)
   # Storage: 100 GB, gp3, Enable storage autoscaling
   # VPC: travel-app-vpc
   # Subnet Group: travel-app-db-subnet-group
   # Public Access: No (private subnet)
   # Security Group: rds-sg
   # Database Name: postgres
   # Backup Retention: 7 days
   # Enable Encryption: Yes
   ```

3. **Wait for Instance to be Available**
   - Takes 10-15 minutes
   - Note the endpoint: `travel-app-db.xxxxx.us-east-1.rds.amazonaws.com`

### Step 2.3: Import Schema to RDS

1. **Connect to RDS**
   ```bash
   # From your local machine (or EC2 instance in same VPC)
   psql --host=[RDS_ENDPOINT] \
     --port=5432 \
     --username=postgres \
     --dbname=postgres
   ```

2. **Import Schema**
   ```bash
   psql --host=[RDS_ENDPOINT] \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=supabase_schema.sql
   ```

3. **Verify Schema Import**
   ```sql
   -- Check tables
   \dt
   
   -- Check specific tables
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Check RLS policies
   SELECT * FROM pg_policies;
   ```

### Step 2.4: Import Data

1. **Import Data**
   ```bash
   psql --host=[RDS_ENDPOINT] \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=supabase_data.sql
   ```

2. **Verify Data Import**
   ```sql
   -- Check row counts
   SELECT 
     'users' as table_name, COUNT(*) as row_count FROM users
   UNION ALL
   SELECT 'activity_packages', COUNT(*) FROM activity_packages
   UNION ALL
   SELECT 'transfer_packages', COUNT(*) FROM transfer_packages
   UNION ALL
   SELECT 'multi_city_packages', COUNT(*) FROM multi_city_packages;
   ```

### Step 2.5: Update Database Connection in Code

1. **Create Database Connection Utility**
   ```typescript
   // src/lib/aws/database.ts
   import { Pool } from 'pg';
   
   const pool = new Pool({
     host: process.env.RDS_HOSTNAME,
     port: parseInt(process.env.RDS_PORT || '5432'),
     database: process.env.RDS_DATABASE || 'postgres',
     user: process.env.RDS_USERNAME,
     password: process.env.RDS_PASSWORD,
     ssl: {
       rejectUnauthorized: false, // For RDS, use proper cert in production
     },
     max: 20, // Connection pool size
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   
   export { pool };
   ```

2. **Update Environment Variables**
   ```bash
   # .env.local
   RDS_HOSTNAME=travel-app-db.xxxxx.us-east-1.rds.amazonaws.com
   RDS_PORT=5432
   RDS_DATABASE=postgres
   RDS_USERNAME=postgres
   RDS_PASSWORD=[YOUR_PASSWORD]
   ```

**✅ Phase 2 Complete When:**
- RDS instance created and accessible
- Schema imported successfully
- Data imported and verified
- Database connection utility created
- Environment variables configured

---

## Phase 3: Authentication Migration (Cognito)

### Step 3.1: Create Cognito User Pool

1. **Create User Pool via AWS Console**
   ```bash
   # AWS Console → Cognito → User Pools → Create User Pool
   # Sign-in options: Email
   # Password policy: Custom (match your current requirements)
   # MFA: Optional (can enable later)
   # User pool name: travel-app-users
   ```

2. **Configure User Attributes**
   ```bash
   # Required attributes: email
   # Custom attributes:
   #   - role (String, Mutable)
   #   - user_id (String, Mutable) - to map to old Supabase IDs
   ```

3. **Create App Client**
   ```bash
   # App client name: travel-app-client
   # Generate client secret: No (for public clients)
   # Authentication flows: ALLOW_USER_PASSWORD_AUTH, ALLOW_REFRESH_TOKEN_AUTH
   # OAuth 2.0: Enable
   # Allowed callback URLs: http://localhost:3000/auth/callback, https://yourdomain.com/auth/callback
   # Allowed sign-out URLs: http://localhost:3000, https://yourdomain.com
   # Allowed OAuth scopes: email, openid, profile
   ```

### Step 3.2: Configure OAuth Providers (Google, GitHub)

1. **Google OAuth Setup**
   ```bash
   # AWS Console → Cognito → User Pools → Identity Providers → Add Provider
   # Provider: Google
   # Client ID: [From Google Cloud Console]
   # Client Secret: [From Google Cloud Console]
   # Authorized scopes: email profile openid
   # Attribute mapping: email → email
   ```

2. **GitHub OAuth Setup**
   ```bash
   # AWS Console → Cognito → User Pools → Identity Providers → Add Provider
   # Provider: GitHub
   # Client ID: [From GitHub Developer Settings]
   # Client Secret: [From GitHub Developer Settings]
   # Attribute mapping: email → email
   ```

### Step 3.3: Migrate Users from Supabase

1. **Create Migration Script**
   ```typescript
   // scripts/migrate-users.ts
   import { CognitoIdentityProviderClient, AdminCreateUserCommand } from "@aws-sdk/client-cognito-identity-provider";
   import { createClient } from "@supabase/supabase-js";
   import { pool } from '../src/lib/aws/database';
   
   const supabase = createClient(
     process.env.SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
   );
   
   const cognito = new CognitoIdentityProviderClient({ 
     region: process.env.AWS_REGION || 'us-east-1' 
   });
   
   async function migrateUsers() {
     // Get all users from Supabase
     const { data: users, error } = await supabase
       .from('users')
       .select('*');
     
     if (error) {
       console.error('Error fetching users:', error);
       return;
     }
     
     console.log(`Found ${users?.length || 0} users to migrate`);
     
     for (const user of users || []) {
       try {
         // Create user in Cognito
         const command = new AdminCreateUserCommand({
           UserPoolId: process.env.COGNITO_USER_POOL_ID!,
           Username: user.email,
           UserAttributes: [
             { Name: 'email', Value: user.email },
             { Name: 'email_verified', Value: 'true' },
             { Name: 'custom:role', Value: user.role || 'CLIENT' },
             { Name: 'custom:user_id', Value: user.id },
           ],
           MessageAction: 'SUPPRESS', // Don't send welcome email
           TemporaryPassword: generateTempPassword(), // Users will need to reset
         });
         
         await cognito.send(command);
         
         // Update user record in database with Cognito sub
         // Note: You'll need to get the Cognito sub after creation
         console.log(`✅ Migrated user: ${user.email}`);
       } catch (error: any) {
         if (error.name === 'UsernameExistsException') {
           console.log(`⚠️  User already exists: ${user.email}`);
         } else {
           console.error(`❌ Failed to migrate ${user.email}:`, error);
         }
       }
     }
   }
   
   function generateTempPassword(): string {
     // Generate secure temporary password
     return Math.random().toString(36).slice(-12) + 'A1!';
   }
   
   migrateUsers();
   ```

2. **Run Migration**
   ```bash
   # Set environment variables
   export SUPABASE_URL=your_supabase_url
   export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   export COGNITO_USER_POOL_ID=your_user_pool_id
   export AWS_REGION=us-east-1
   
   # Run migration
   npx ts-node scripts/migrate-users.ts
   ```

### Step 3.4: Create Cognito Client Library

1. **Install Cognito SDK**
   ```bash
   npm install @aws-sdk/client-cognito-identity-provider
   ```

2. **Create Cognito Auth Client**
   ```typescript
   // src/lib/aws/cognito.ts
   import { 
     CognitoIdentityProviderClient, 
     InitiateAuthCommand,
     SignUpCommand,
     ConfirmSignUpCommand,
     ForgotPasswordCommand,
     ConfirmForgotPasswordCommand,
     GetUserCommand,
   } from "@aws-sdk/client-cognito-identity-provider";
   
   const client = new CognitoIdentityProviderClient({ 
     region: process.env.AWS_REGION || 'us-east-1' 
   });
   
   const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;
   const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;
   
   export async function signIn(email: string, password: string) {
     const command = new InitiateAuthCommand({
       AuthFlow: 'USER_PASSWORD_AUTH',
       ClientId: CLIENT_ID,
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
   
   export async function signUp(email: string, password: string, attributes: Record<string, string> = {}) {
     const command = new SignUpCommand({
       ClientId: CLIENT_ID,
       Username: email,
       Password: password,
       UserAttributes: Object.entries(attributes).map(([key, value]) => ({
         Name: key,
         Value: value,
       })),
     });
     
     return await client.send(command);
   }
   
   export async function getUser(accessToken: string) {
     const command = new GetUserCommand({
       AccessToken: accessToken,
     });
     
     return await client.send(command);
   }
   ```

### Step 3.5: Update Authentication Context

1. **Replace Supabase Auth with Cognito**
   ```typescript
   // src/context/AuthContext.tsx (new file)
   // Replace SupabaseAuthContext with Cognito-based auth
   // See detailed implementation in Phase 5
   ```

**✅ Phase 3 Complete When:**
- Cognito User Pool created
- OAuth providers configured
- Users migrated (or migration script ready)
- Cognito client library created
- Authentication context updated

---

## Phase 4: Storage Migration (S3 + CloudFront)

### Step 4.1: Create S3 Buckets

1. **Create Storage Bucket**
   ```bash
   # AWS Console → S3 → Create Bucket
   # Bucket name: travel-app-storage-[unique-suffix]
   # Region: us-east-1
   # Block Public Access: Enable (we'll use CloudFront)
   # Versioning: Enable
   # Encryption: Enable (SSE-S3 or KMS)
   ```

2. **Create Bucket Policy**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowAppUploads",
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::[ACCOUNT-ID]:role/amplify-role"
         },
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::travel-app-storage-[suffix]/*"
       }
     ]
   }
   ```

3. **Create Folder Structure**
   ```bash
   # Create folders matching Supabase buckets:
   # - activity-package-images/
   # - transfer-packages/
   # - multi-city-packages/
   ```

### Step 4.2: Configure CloudFront Distribution

1. **Create CloudFront Distribution**
   ```bash
   # AWS Console → CloudFront → Create Distribution
   # Origin Domain: travel-app-storage-[suffix].s3.us-east-1.amazonaws.com
   # Origin Access: Origin Access Control (recommended)
   # Viewer Protocol Policy: Redirect HTTP to HTTPS
   # Allowed HTTP Methods: GET, HEAD, OPTIONS
   # Cache Policy: CachingOptimized
   # Price Class: Use All Edge Locations
   ```

2. **Note CloudFront Domain**
   - Save the CloudFront domain: `d1234567890.cloudfront.net`

### Step 4.3: Migrate Images from Supabase to S3

1. **Create Migration Script**
   ```typescript
   // scripts/migrate-storage.ts
   import { createClient } from "@supabase/supabase-js";
   import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
   import axios from "axios";
   
   const supabase = createClient(
     process.env.SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
   );
   
   const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
   const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
   
   async function migrateImages() {
     const buckets = [
       'activity-package-images',
       'transfer-packages',
       'multi-city-packages'
     ];
     
     for (const bucketName of buckets) {
       console.log(`\n📦 Migrating bucket: ${bucketName}`);
       
       // List all files in Supabase bucket
       const { data: files, error } = await supabase.storage
         .from(bucketName)
         .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
       
       if (error) {
         console.error(`Error listing files in ${bucketName}:`, error);
         continue;
       }
       
       console.log(`Found ${files?.length || 0} files`);
       
       for (const file of files || []) {
         try {
           // Download from Supabase
           const { data: fileData, error: downloadError } = await supabase.storage
             .from(bucketName)
             .download(file.name);
           
           if (downloadError) {
             console.error(`Error downloading ${file.name}:`, downloadError);
             continue;
           }
           
           // Convert Blob to Buffer
           const arrayBuffer = await fileData.arrayBuffer();
           const buffer = Buffer.from(arrayBuffer);
           
           // Upload to S3
           const key = `${bucketName}/${file.name}`;
           await s3.send(new PutObjectCommand({
             Bucket: BUCKET_NAME,
             Key: key,
             Body: buffer,
             ContentType: file.metadata?.mimetype || 'image/jpeg',
             Metadata: {
               'original-bucket': bucketName,
               'migrated-from': 'supabase',
             },
           }));
           
           console.log(`✅ Migrated: ${file.name}`);
         } catch (error) {
           console.error(`❌ Failed to migrate ${file.name}:`, error);
         }
       }
     }
   }
   
   migrateImages();
   ```

2. **Run Migration**
   ```bash
   export SUPABASE_URL=your_supabase_url
   export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   export S3_BUCKET_NAME=travel-app-storage-[suffix]
   export AWS_REGION=us-east-1
   
   npx ts-node scripts/migrate-storage.ts
   ```

### Step 4.4: Update Upload Functions

1. **Create S3 Upload Utility**
   ```typescript
   // src/lib/aws/s3-upload.ts
   import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
   import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
   
   const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
   const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
   const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN!;
   
   export async function uploadFile(
     file: File | Buffer,
     folder: string,
     fileName?: string
   ) {
     const key = fileName 
       ? `${folder}/${fileName}`
       : `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}`;
   
     const command = new PutObjectCommand({
       Bucket: BUCKET_NAME,
       Key: key,
       Body: file instanceof File ? await file.arrayBuffer() : file,
       ContentType: file instanceof File ? file.type : 'application/octet-stream',
     });
   
     await s3.send(command);
   
     // Return CloudFront URL
     const publicUrl = `https://${CLOUDFRONT_DOMAIN}/${key}`;
     return { path: key, publicUrl };
   }
   
   export async function getPresignedUploadUrl(
     fileName: string,
     folder: string,
     contentType: string
   ) {
     const key = `${folder}/${Date.now()}-${fileName}`;
   
     const command = new PutObjectCommand({
       Bucket: BUCKET_NAME,
       Key: key,
       ContentType: contentType,
     });
   
     const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
     return { signedUrl, key };
   }
   
   export function getPublicUrl(key: string): string {
     return `https://${CLOUDFRONT_DOMAIN}/${key}`;
   }
   ```

2. **Update File Upload Services**
   ```typescript
   // Update src/lib/supabase/file-upload.ts
   // Replace Supabase storage calls with S3 upload functions
   ```

**✅ Phase 4 Complete When:**
- S3 buckets created
- CloudFront distribution configured
- Images migrated from Supabase
- Upload/download functions updated
- Public URLs updated to use CloudFront

---

## Phase 5: Backend Code Migration

### Step 5.1: Replace Supabase Client with PostgreSQL

1. **Update Database Service Layer**
   ```typescript
   // src/lib/services/database.ts (new file)
   import { pool } from '../aws/database';
   import { QueryResult } from 'pg';
   
   export async function query<T = any>(
     text: string,
     params?: any[]
   ): Promise<QueryResult<T>> {
     return await pool.query(text, params);
   }
   
   export async function queryOne<T = any>(
     text: string,
     params?: any[]
   ): Promise<T | null> {
     const result = await pool.query<T>(text, params);
     return result.rows[0] || null;
   }
   
   export async function queryMany<T = any>(
     text: string,
     params?: any[]
   ): Promise<T[]> {
     const result = await pool.query<T>(text, params);
     return result.rows;
   }
   ```

2. **Update All Service Files**
   - Replace `supabase.from('table').select()` with SQL queries
   - Update: `src/lib/services/queryService.ts`
   - Update: `src/lib/services/itineraryService.ts`
   - Update: `src/lib/services/marketplaceService.ts`
   - Update: `src/lib/supabase/activity-packages.ts`
   - Update: `src/lib/supabase/transfer-packages.ts`

### Step 5.2: Update Authentication Context

1. **Replace Supabase Auth Context**
   ```typescript
   // src/context/AuthContext.tsx
   // Complete replacement of SupabaseAuthContext
   // Use Cognito for authentication
   // See detailed implementation guide
   ```

### Step 5.3: Update API Routes

1. **Update User Profile Route**
   ```typescript
   // src/app/api/user/profile/route.ts
   // Replace Supabase admin client with:
   // - Cognito token verification
   // - PostgreSQL queries
   ```

### Step 5.4: Update Environment Variables

1. **Create New .env.local**
   ```bash
   # Database
   RDS_HOSTNAME=travel-app-db.xxxxx.us-east-1.rds.amazonaws.com
   RDS_PORT=5432
   RDS_DATABASE=postgres
   RDS_USERNAME=postgres
   RDS_PASSWORD=[PASSWORD]
   
   # Cognito
   COGNITO_USER_POOL_ID=us-east-1_xxxxx
   COGNITO_CLIENT_ID=xxxxx
   AWS_REGION=us-east-1
   
   # S3 & CloudFront
   S3_BUCKET_NAME=travel-app-storage-[suffix]
   CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net
   
   # Remove Supabase variables:
   # NEXT_PUBLIC_SUPABASE_URL (remove)
   # NEXT_PUBLIC_SUPABASE_ANON_KEY (remove)
   # SUPABASE_SERVICE_ROLE_KEY (remove)
   ```

**✅ Phase 5 Complete When:**
- All Supabase client calls replaced
- Database queries use PostgreSQL directly
- Authentication uses Cognito
- File uploads use S3
- All environment variables updated
- Code compiles without errors

---

## Phase 6: Testing & Deployment

### Step 6.1: Local Testing

1. **Run Local Development**
   ```bash
   npm run dev
   ```

2. **Test Checklist**
   - [ ] User registration
   - [ ] User login (email/password)
   - [ ] OAuth login (Google, GitHub)
   - [ ] Database queries (all CRUD operations)
   - [ ] File uploads
   - [ ] File downloads
   - [ ] All package types (Activity, Transfer, Multi-City)
   - [ ] Itinerary creation
   - [ ] Marketplace functionality

### Step 6.2: Staging Deployment

1. **Set Up Staging Environment**
   - Create separate RDS instance for staging
   - Create separate S3 bucket for staging
   - Deploy to staging URL

2. **Integration Testing**
   - Full end-to-end testing
   - Load testing
   - Security testing

### Step 6.3: Production Deployment

1. **Pre-Deployment Checklist**
   - [ ] All tests passing
   - [ ] Database backups taken
   - [ ] Rollback plan ready
   - [ ] Monitoring configured
   - [ ] Alerts configured

2. **Deployment Steps**
   - Deploy to production
   - Monitor logs
   - Verify functionality
   - Gradual traffic migration (if possible)

**✅ Phase 6 Complete When:**
- All tests passing
- Staging environment validated
- Production deployment successful
- Monitoring active
- Team trained on new infrastructure

---

## Rollback Plan

### If Migration Fails

1. **Database Rollback**
   - Keep Supabase instance running for 2 weeks
   - Update environment variables to point back to Supabase
   - Redeploy application

2. **Authentication Rollback**
   - Keep Supabase Auth active
   - Use feature flag to switch back
   - Update code to use Supabase Auth

3. **Storage Rollback**
   - Keep Supabase Storage active
   - Update upload functions to use Supabase
   - Images remain in Supabase

---

## Post-Migration Checklist

- [ ] All functionality working
- [ ] Performance metrics acceptable
- [ ] Cost monitoring active
- [ ] Backups configured
- [ ] Monitoring dashboards set up
- [ ] Team documentation updated
- [ ] Old Supabase resources decommissioned (after 2 weeks)
- [ ] Cost optimization review completed

---

## 📞 Support & Resources

- **AWS Documentation:** https://docs.aws.amazon.com/
- **RDS PostgreSQL:** https://docs.aws.amazon.com/rds/
- **Cognito:** https://docs.aws.amazon.com/cognito/
- **S3:** https://docs.aws.amazon.com/s3/
- **CloudFront:** https://docs.aws.amazon.com/cloudfront/

---

## Next Steps

1. Review this guide with your team
2. Set up AWS account and billing alerts
3. Start with Phase 1 (Infrastructure Setup)
4. Proceed phase by phase
5. Test thoroughly at each phase
6. Document any issues or deviations

**Good luck with your migration! 🚀**

