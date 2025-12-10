# Run Migration from EC2 Instance

Since direct connection from your local machine is timing out, we'll use an EC2 instance in the same VPC as RDS.

## Option 1: Use Existing EC2 Instance (Easiest)

If you already have an EC2 instance in the same VPC:

1. **SSH into your EC2 instance:**
   ```bash
   ssh -i ~/.ssh/your-key.pem ec2-user@<your-ec2-ip>
   ```

2. **Install PostgreSQL client:**
   ```bash
   sudo yum install -y postgresql15
   ```

3. **Upload migration file to EC2:**
   From your local machine:
   ```bash
   scp -i ~/.ssh/your-key.pem migrations/001_phone_auth_schema.sql ec2-user@<your-ec2-ip>:/home/ec2-user/
   ```

4. **Run migration:**
   ```bash
   # On EC2 instance
   export PGPASSWORD="ju3vrLHJUW8PqDG4"
   psql -h travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
        -U postgres \
        -d postgres \
        -f /home/ec2-user/001_phone_auth_schema.sql
   ```

5. **Verify:**
   ```bash
   psql -h travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
        -U postgres \
        -d postgres \
        -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('otp_codes', 'account_details', 'brand_details', 'business_details', 'documents', 'otp_rate_limits');"
   ```

## Option 2: Create New EC2 Instance

If you don't have an EC2 instance:

### Step 1: Create EC2 Instance via AWS Console

1. **Go to EC2 Console** → Launch Instance
2. **Configure:**
   - Name: `migration-helper`
   - AMI: Amazon Linux 2023
   - Instance type: t3.micro (free tier)
   - Key pair: Select or create one
   - Network settings:
     - **VPC**: Same VPC as your RDS (check RDS → Connectivity & security → VPC)
     - **Subnet**: Any subnet in that VPC
     - **Security group**: Use existing `rds-sg` or create new one allowing SSH (port 22)
   - Launch instance

### Step 2: SSH into EC2

```bash
ssh -i ~/.ssh/your-key.pem ec2-user@<ec2-public-ip>
```

### Step 3: Install PostgreSQL Client

```bash
sudo yum update -y
sudo yum install -y postgresql15
```

### Step 4: Upload Migration File

From your local machine (PowerShell):

```powershell
scp -i C:\Users\train\.ssh\your-key.pem migrations\001_phone_auth_schema.sql ec2-user@<ec2-ip>:/home/ec2-user/
```

### Step 5: Run Migration

On EC2 instance:

```bash
# Set password
export PGPASSWORD="ju3vrLHJUW8PqDG4"

# Run migration
psql -h travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d postgres \
     -f /home/ec2-user/001_phone_auth_schema.sql
```

### Step 6: Verify

```bash
psql -h travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d postgres \
     -c "\dt"  # List all tables

# Check specific tables
psql -h travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d postgres \
     -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('otp_codes', 'account_details', 'brand_details', 'business_details', 'documents', 'otp_rate_limits');"
```

## Option 3: Use AWS Systems Manager Session Manager

If you have SSM access configured:

1. **Start session:**
   ```bash
   aws ssm start-session --target <instance-id>
   ```

2. **Then follow steps 3-6 from Option 2**

## Quick One-Liner (If you have EC2 ready)

```bash
# On EC2 instance
sudo yum install -y postgresql15 && \
export PGPASSWORD="ju3vrLHJUW8PqDG4" && \
psql -h travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com -U postgres -d postgres -f /home/ec2-user/001_phone_auth_schema.sql
```

## Troubleshooting

### "psql: command not found"
```bash
sudo yum install -y postgresql15
```

### "Connection refused"
- Check RDS security group allows connections from EC2 security group
- Verify EC2 and RDS are in same VPC

### "Permission denied" for scp
- Check key file permissions: `chmod 400 ~/.ssh/your-key.pem`
- Verify you're using the correct username (ec2-user for Amazon Linux)

## After Migration

1. ✅ Verify tables were created
2. ✅ Terminate EC2 instance if you created it just for migration (optional)
3. ✅ Continue with AWS services setup (SNS, SES, S3, reCAPTCHA)

---

**This approach works because EC2 instances in the same VPC can connect to RDS without needing public accessibility!**

