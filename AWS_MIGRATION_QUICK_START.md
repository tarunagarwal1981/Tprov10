# AWS Migration - Quick Start Guide
## Get Started in 3 Days (Proof of Concept)

---

## 🎯 Goal: Validate AWS Setup in 3 Days

This quick-start guide helps you test AWS infrastructure **in parallel** with your existing Supabase setup (no risk to production).

---

## 📅 3-Day Quick Start Plan

### Day 1: Core AWS Setup (4-6 hours)

#### Morning (2-3 hours)
**1. AWS Account Setup**
```bash
# Create AWS account
https://aws.amazon.com/free/

# Install AWS CLI
# Windows (PowerShell)
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
# AWS Access Key ID: [your-key]
# AWS Secret Access Key: [your-secret]
# Default region: us-east-1
# Default output format: json
```

**2. Set up IAM (Identity and Access Management)**
```bash
# Create admin user (don't use root account)
aws iam create-user --user-name admin-user

# Attach admin policy
aws iam attach-user-policy \
  --user-name admin-user \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Create access keys
aws iam create-access-key --user-name admin-user
```

#### Afternoon (2-3 hours)
**3. Deploy Test RDS Instance**
```bash
# Run the setup script
cd aws-migration-scripts
chmod +x 2-rds-setup.sh
./2-rds-setup.sh

# Or manually create a small test instance
aws rds create-db-instance \
  --db-instance-identifier test-travel-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --publicly-accessible true \
  --no-deletion-protection

# Wait for instance (10-15 min)
aws rds wait db-instance-available --db-instance-identifier test-travel-db

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier test-travel-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

**4. Test Database Connection**
```bash
# Install PostgreSQL client if needed
# Windows: Download from postgresql.org
# macOS: brew install postgresql
# Linux: sudo apt install postgresql-client

# Connect to RDS
psql -h <rds-endpoint> -U postgres -d postgres

# Create test table
CREATE TABLE test_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

# Insert test data
INSERT INTO test_users (email) VALUES ('test@example.com');

# Verify
SELECT * FROM test_users;
```

---

### Day 2: Auth & Storage (4-6 hours)

#### Morning (2-3 hours)
**5. Set up Cognito**
```bash
# Run Cognito setup script
cd aws-migration-scripts
chmod +x 4-cognito-setup.sh

# Edit the script first - set your callback URLs
nano 4-cognito-setup.sh
# Change: CALLBACK_URLS="https://yourdomain.com/auth/callback"

# Run script
./4-cognito-setup.sh

# Save the output (User Pool ID, Client ID, etc.)
```

**6. Test Cognito Authentication**
```bash
# Install AWS SDK for JavaScript
npm install @aws-sdk/client-cognito-identity-provider

# Create test user
aws cognito-idp admin-create-user \
  --user-pool-id <your-pool-id> \
  --username test@example.com \
  --user-attributes Name=email,Value=test@example.com Name=email_verified,Value=true \
  --temporary-password TempPass123!

# Test login with hosted UI
open "https://<your-domain>.auth.us-east-1.amazoncognito.com/login?client_id=<client-id>&response_type=code&redirect_uri=http://localhost:3000/auth/callback"
```

#### Afternoon (2-3 hours)
**7. Set up S3 & CloudFront**
```bash
# Run S3 setup script
chmod +x 6-s3-storage-setup.sh
./6-s3-storage-setup.sh

# Or manually create bucket
BUCKET_NAME="test-travel-app-$(date +%s)"

aws s3 mb s3://$BUCKET_NAME

# Upload test image
echo "Test file" > test.txt
aws s3 cp test.txt s3://$BUCKET_NAME/test.txt

# Make it public (for testing only)
aws s3api put-object-acl \
  --bucket $BUCKET_NAME \
  --key test.txt \
  --acl public-read

# Get URL
echo "https://${BUCKET_NAME}.s3.amazonaws.com/test.txt"
```

**8. Test File Upload/Download**
```bash
# Install AWS SDK for S3
npm install @aws-sdk/client-s3

# Create test upload script
cat > test-s3.ts << 'EOF'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

const s3 = new S3Client({ region: "us-east-1" });

async function uploadFile() {
  const fileContent = fs.readFileSync("test-image.jpg");
  
  const command = new PutObjectCommand({
    Bucket: "your-bucket-name",
    Key: "test-upload.jpg",
    Body: fileContent,
    ContentType: "image/jpeg",
  });
  
  await s3.send(command);
  console.log("✅ File uploaded successfully");
}

uploadFile();
EOF

# Run test
npx ts-node test-s3.ts
```

---

### Day 3: Integration & Testing (4-6 hours)

#### Morning (2-3 hours)
**9. Create Test Next.js API Route**
```typescript
// pages/api/test-aws.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// RDS Connection
const pool = new Pool({
  host: process.env.RDS_HOSTNAME,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.RDS_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Test database
    const dbResult = await pool.query('SELECT NOW() as time, version()');
    
    res.status(200).json({
      success: true,
      database: {
        connected: true,
        time: dbResult.rows[0].time,
        version: dbResult.rows[0].version,
      },
      message: "AWS infrastructure working!"
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
```

**10. Test Environment Variables**
```bash
# Create .env.aws file
cat > .env.aws << 'EOF'
# AWS RDS
RDS_HOSTNAME=your-rds-endpoint.rds.amazonaws.com
RDS_DATABASE=postgres
RDS_USERNAME=postgres
RDS_PASSWORD=your-password

# AWS Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxx
NEXT_PUBLIC_COGNITO_REGION=us-east-1

# AWS S3
S3_BUCKET_NAME=your-bucket-name
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# CloudFront
CLOUDFRONT_DOMAIN=xxxxx.cloudfront.net
EOF

# Load and test
source .env.aws
curl http://localhost:3000/api/test-aws
```

#### Afternoon (2-3 hours)
**11. Load Test**
```bash
# Install Apache Bench (ab) or use online tool
# macOS/Linux: usually pre-installed
ab -V

# Test API endpoint
ab -n 1000 -c 10 http://localhost:3000/api/test-aws

# Or use Artillery for more advanced testing
npm install -g artillery
artillery quick --count 100 --num 10 http://localhost:3000/api/test-aws
```

**12. Compare Performance: Supabase vs AWS**
```typescript
// Create performance comparison script
// test-performance.ts

async function testSupabase() {
  const start = Date.now();
  
  // Your current Supabase query
  const { data } = await supabase
    .from('users')
    .select('*')
    .limit(100);
  
  const end = Date.now();
  console.log(`Supabase: ${end - start}ms`);
}

async function testAWS() {
  const start = Date.now();
  
  // Equivalent AWS RDS query
  const result = await pool.query('SELECT * FROM users LIMIT 100');
  
  const end = Date.now();
  console.log(`AWS RDS: ${end - start}ms`);
}

// Run comparison
Promise.all([testSupabase(), testAWS()]);
```

---

## 📊 Evaluation Checklist

After 3 days, evaluate these metrics:

### ✅ Performance
- [ ] Database query speed (compare Supabase vs RDS)
- [ ] API response time
- [ ] File upload/download speed
- [ ] Authentication speed

### ✅ Cost (Estimated)
- [ ] RDS instance cost
- [ ] S3 storage cost
- [ ] Data transfer cost
- [ ] Compare with current Supabase bill

### ✅ Complexity
- [ ] Setup difficulty (1-10)
- [ ] Code changes required
- [ ] Maintenance burden
- [ ] Team learning curve

### ✅ Features
- [ ] All database features work (RLS, triggers, etc.)
- [ ] Authentication works (email, OAuth)
- [ ] File storage works
- [ ] Can we implement realtime? (optional for Day 3)

---

## 🎯 Decision Point

After 3 days, you should be able to answer:

### ❓ Is AWS Right for Us?

**Proceed with full migration if:**
- ✅ Performance is equal or better
- ✅ Cost is acceptable
- ✅ Team is comfortable with AWS
- ✅ No major technical blockers
- ✅ Benefits justify migration effort

**Stay with Supabase if:**
- ❌ Performance is worse
- ❌ Cost is higher
- ❌ Team struggles with AWS complexity
- ❌ Migration effort too high
- ❌ No compelling reason to switch

---

## 🧹 Cleanup (Save Costs)

If you decide NOT to migrate:

```bash
# Delete RDS instance
aws rds delete-db-instance \
  --db-instance-identifier test-travel-db \
  --skip-final-snapshot

# Delete S3 bucket
aws s3 rb s3://your-test-bucket --force

# Delete Cognito User Pool
aws cognito-idp delete-user-pool \
  --user-pool-id <your-pool-id>

# Delete CloudFront distribution (takes 15-20 min)
# First disable
aws cloudfront get-distribution-config \
  --id <distribution-id> > dist-config.json

# Edit dist-config.json, set Enabled: false
aws cloudfront update-distribution \
  --id <distribution-id> \
  --if-match <etag> \
  --distribution-config file://dist-config.json

# Wait, then delete
aws cloudfront delete-distribution \
  --id <distribution-id>
```

**Total Cost for 3-Day Test:** ~$5-10

---

## 💡 Pro Tips

1. **Keep Supabase Running:** Don't touch production during this test
2. **Use Smallest Instances:** db.t4g.micro for RDS (Free Tier eligible)
3. **Set Billing Alerts:** $10, $20, $50
4. **Document Everything:** Time spent, issues encountered, costs
5. **Test One Feature at a Time:** Don't try to migrate everything
6. **Ask for Help:** AWS has great support forums

---

## 📚 Resources

- AWS Free Tier: https://aws.amazon.com/free/
- RDS Documentation: https://docs.aws.amazon.com/rds/
- Cognito Documentation: https://docs.aws.amazon.com/cognito/
- S3 Documentation: https://docs.aws.amazon.com/s3/
- AWS Cost Calculator: https://calculator.aws/

---

## 🚀 Next Steps

**If you decide to proceed:**
1. Read the full migration plan: `AWS_MIGRATION_PLAN.md`
2. Review cost optimization: `7-cost-optimization.md`
3. Schedule 4-6 weeks for full migration
4. Set up staging environment on AWS
5. Create detailed migration runbook

**If you decide to stay with Supabase:**
1. Focus on optimizing current setup
2. Implement caching strategies
3. Optimize database queries
4. Consider hybrid approach (S3 for storage only)

---

**Good luck with your evaluation! Remember: The best infrastructure is the one that lets you focus on building your product.**

