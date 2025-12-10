# 🚀 Migration Phase 1: AWS Infrastructure Setup

## ✅ Current Status

- ✅ AWS CLI installed and configured
- ✅ AWS Account: 815660521604 (tarunagarwal)
- ✅ Dependencies installed
- ✅ Ready to start Phase 1

---

## 📋 Phase 1 Checklist

### **Step 1: Create VPC and Networking** (15 minutes)

We'll create the network infrastructure for your AWS resources.

#### **1.1 Create VPC**

```powershell
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=travel-app-vpc}]"
```

**Save the VpcId from output** - you'll need it for next steps.

#### **1.2 Create Internet Gateway**

```powershell
# Create Internet Gateway
aws ec2 create-internet-gateway --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=travel-app-igw}]"

# Attach to VPC (replace VPC_ID with your VPC ID)
aws ec2 attach-internet-gateway --internet-gateway-id <IGW_ID> --vpc-id <VPC_ID>
```

#### **1.3 Create Subnets**

```powershell
# Get availability zones
aws ec2 describe-availability-zones --region us-east-1

# Create Public Subnet 1 (us-east-1a)
aws ec2 create-subnet --vpc-id <VPC_ID> --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=travel-app-public-1a}]"

# Create Public Subnet 2 (us-east-1b)
aws ec2 create-subnet --vpc-id <VPC_ID> --cidr-block 10.0.2.0/24 --availability-zone us-east-1b --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=travel-app-public-1b}]"

# Create Private Subnet 1 (us-east-1a)
aws ec2 create-subnet --vpc-id <VPC_ID> --cidr-block 10.0.3.0/24 --availability-zone us-east-1a --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=travel-app-private-1a}]"

# Create Private Subnet 2 (us-east-1b)
aws ec2 create-subnet --vpc-id <VPC_ID> --cidr-block 10.0.4.0/24 --availability-zone us-east-1b --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=travel-app-private-1b}]"
```

#### **1.4 Create Route Tables**

```powershell
# Create Public Route Table
aws ec2 create-route-table --vpc-id <VPC_ID> --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=travel-app-public-rt}]"

# Add route to Internet Gateway
aws ec2 create-route --route-table-id <PUBLIC_RT_ID> --destination-cidr-block 0.0.0.0/0 --gateway-id <IGW_ID>

# Associate public subnets with public route table
aws ec2 associate-route-table --subnet-id <PUBLIC_SUBNET_1_ID> --route-table-id <PUBLIC_RT_ID>
aws ec2 associate-route-table --subnet-id <PUBLIC_SUBNET_2_ID> --route-table-id <PUBLIC_RT_ID>
```

---

### **Step 2: Create Security Groups** (5 minutes)

```powershell
# Security Group for RDS (allows PostgreSQL from VPC)
aws ec2 create-security-group --group-name rds-sg --description "Security group for RDS PostgreSQL" --vpc-id <VPC_ID>

# Add inbound rule for PostgreSQL (port 5432) from VPC
aws ec2 authorize-security-group-ingress --group-id <RDS_SG_ID> --protocol tcp --port 5432 --cidr 10.0.0.0/16

# Security Group for Application
aws ec2 create-security-group --group-name app-sg --description "Security group for application" --vpc-id <VPC_ID>

# Add inbound rules for HTTP/HTTPS
aws ec2 authorize-security-group-ingress --group-id <APP_SG_ID> --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id <APP_SG_ID> --protocol tcp --port 443 --cidr 0.0.0.0/0
```

---

### **Step 3: Create DB Subnet Group** (5 minutes)

```powershell
# Create DB Subnet Group (required for RDS)
aws rds create-db-subnet-group \
  --db-subnet-group-name travel-app-db-subnet-group \
  --db-subnet-group-description "Subnet group for RDS PostgreSQL" \
  --subnet-ids <PRIVATE_SUBNET_1_ID> <PRIVATE_SUBNET_2_ID> \
  --tags "Key=Name,Value=travel-app-db-subnet-group"
```

---

### **Step 4: Create RDS PostgreSQL Instance** (15 minutes setup, 10-15 minutes creation)

```powershell
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier travel-app-db \
  --db-instance-class db.t4g.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password "YourSecurePassword123!" \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --backup-retention-period 7 \
  --vpc-security-group-ids <RDS_SG_ID> \
  --db-subnet-group-name travel-app-db-subnet-group \
  --publicly-accessible false \
  --multi-az false \
  --tags "Key=Name,Value=travel-app-db"
```

**⚠️ IMPORTANT:** 
- Replace `YourSecurePassword123!` with a strong password
- Save this password - you'll need it for database connection
- Instance creation takes 10-15 minutes

**Check status:**
```powershell
aws rds describe-db-instances --db-instance-identifier travel-app-db --query 'DBInstances[0].DBInstanceStatus'
```

Wait until status is `available`.

**Get endpoint:**
```powershell
aws rds describe-db-instances --db-instance-identifier travel-app-db --query 'DBInstances[0].Endpoint.Address' --output text
```

---

### **Step 5: Create S3 Bucket** (5 minutes)

```powershell
# Create S3 bucket (bucket name must be globally unique)
$bucketName = "travel-app-storage-$(Get-Random -Minimum 1000 -Maximum 9999)"
aws s3 mb s3://$bucketName --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning --bucket $bucketName --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption --bucket $bucketName --server-side-encryption-configuration '{
  "Rules": [{
    "ApplyServerSideEncryptionByDefault": {
      "SSEAlgorithm": "AES256"
    }
  }]
}'

# Block public access (we'll use CloudFront for public access)
aws s3api put-public-access-block --bucket $bucketName --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

**Save the bucket name** - you'll need it for CloudFront and environment variables.

---

### **Step 6: Create CloudFront Distribution** (10 minutes setup, 15-20 minutes creation)

```powershell
# Create CloudFront Origin Access Control
aws cloudfront create-origin-access-control --origin-access-control-config '{
  "Name": "travel-app-oac",
  "OriginAccessControlOriginType": "s3",
  "SigningBehavior": "always",
  "SigningProtocol": "sigv4"
}'

# Get OAC ID from output, then create distribution
aws cloudfront create-distribution --distribution-config '{
  "CallerReference": "travel-app-' + (Get-Date -Format "yyyyMMddHHmmss") + '",
  "Comment": "Travel App CDN",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-travel-app-storage",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-travel-app-storage",
      "DomainName": "' + $bucketName + '.s3.us-east-1.amazonaws.com",
      "S3OriginConfig": {
        "OriginAccessIdentity": ""
      },
      "OriginAccessControlId": "<OAC_ID>"
    }]
  },
  "Enabled": true,
  "PriceClass": "PriceClass_100"
}'
```

**Note:** CloudFront distribution creation takes 15-20 minutes. You can continue with other steps while it's creating.

**Get CloudFront domain:**
```powershell
aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='Travel App CDN'].DomainName" --output text
```

---

## 📝 Save Your Configuration

After completing each step, save these values to `.env.local`:

```env
# RDS Database
RDS_HOSTNAME=<RDS_ENDPOINT>
RDS_PORT=5432
RDS_DATABASE=postgres
RDS_USERNAME=postgres
RDS_PASSWORD=<YOUR_PASSWORD>

# S3 & CloudFront
S3_BUCKET_NAME=<BUCKET_NAME>
CLOUDFRONT_DOMAIN=<CLOUDFRONT_DOMAIN>

# Keep Supabase for migration scripts
SUPABASE_URL=https://megmjzszmqnmzdxwzigt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY>
```

---

## ✅ Phase 1 Complete When:

- [ ] VPC created with subnets
- [ ] Security groups created
- [ ] DB subnet group created
- [ ] RDS PostgreSQL instance created and available
- [ ] S3 bucket created
- [ ] CloudFront distribution created (can be in progress)
- [ ] All values saved to `.env.local`

---

## 🎯 Next Steps

After Phase 1 is complete:
1. **Phase 2:** Export and import database
2. **Phase 3:** Set up Cognito and migrate users
3. **Phase 4:** Migrate storage to S3
4. **Phase 5:** Update code
5. **Phase 6:** Test and deploy

---

## 💡 Pro Tips

1. **Use AWS Console** for visual verification of resources
2. **Tag everything** for easy identification
3. **Save all IDs** in a text file for reference
4. **RDS takes time** - start it early and continue with other steps
5. **CloudFront takes time** - can continue while it's creating

---

**Ready to start? Begin with Step 1: Create VPC! 🚀**

