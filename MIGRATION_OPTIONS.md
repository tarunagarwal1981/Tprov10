# Database Migration Options for RDS PostgreSQL

Since AWS RDS Query Editor only works with Aurora Serverless, here are your options:

## ✅ Option 1: DBeaver (Easiest - Recommended)

**Best for:** Quick one-time migration from your local machine

1. Download DBeaver: https://dbeaver.io/download/
2. Follow the guide: `MIGRATION_DBEAVER_GUIDE.md`
3. **Note:** You may need to temporarily add your IP to RDS security group

**Pros:**
- Free and easy to use
- Visual interface
- Can see results immediately

**Cons:**
- Requires network access to RDS (may need security group update)

---

## ✅ Option 2: Update RDS Security Group (Temporary)

If you want to use DBeaver or the npm scripts, you need to allow your IP:

1. Go to AWS RDS Console → Your instance → **Connectivity & security**
2. Click on the **Security group** (e.g., `sg-xxxxx`)
3. Go to **Inbound rules** → **Edit inbound rules**
4. Click **Add rule**:
   - **Type**: PostgreSQL
   - **Port**: 5432
   - **Source**: My IP (or manually enter your IP)
5. Click **Save rules**
6. Now you can:
   - Use DBeaver to connect
   - Run `npm run migrate` from your local machine
7. **⚠️ IMPORTANT:** Remove the rule after migration for security

---

## ✅ Option 3: Use EC2 Instance (Most Secure)

If you have an EC2 instance in the same VPC as RDS:

1. SSH into your EC2 instance
2. Install PostgreSQL client:
   ```bash
   sudo yum install postgresql15  # Amazon Linux
   # or
   sudo apt-get install postgresql-client  # Ubuntu
   ```
3. Connect and run migration:
   ```bash
   psql -h travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
        -U postgres \
        -d postgres \
        -f migrations/001_phone_auth_schema.sql
   ```
4. Enter password when prompted

**Pros:**
- No security group changes needed
- Most secure approach
- EC2 is already in the VPC

---

## ✅ Option 4: AWS Systems Manager Session Manager

If you have SSM access to an EC2 instance:

1. Install AWS CLI and Session Manager plugin
2. Start session:
   ```bash
   aws ssm start-session --target <your-ec2-instance-id>
   ```
3. From the EC2 instance, run the migration (same as Option 3)

---

## ✅ Option 5: Lambda Function (Production-Ready)

I've already created a Lambda function for this. You would need to:

1. Deploy the Lambda function in the same VPC as RDS
2. Configure VPC settings and security groups
3. Invoke the Lambda to run the migration

**Pros:**
- No manual intervention
- Can be automated
- Production-ready

**Cons:**
- More setup required
- Need to configure VPC, security groups, etc.

---

## 🎯 Recommended Approach

**For quick migration:** Use **Option 1 (DBeaver)** + **Option 2 (temporary security group update)**

1. Temporarily add your IP to RDS security group (5 minutes)
2. Connect with DBeaver
3. Run the migration SQL file
4. Remove your IP from security group (for security)

This is the fastest and easiest approach.

---

## Quick Start with DBeaver

1. **Download DBeaver**: https://dbeaver.io/download/
2. **Open DBeaver** → New Database Connection → PostgreSQL
3. **Enter connection details:**
   - Host: `travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com`
   - Port: `5432`
   - Database: `postgres`
   - Username: `postgres`
   - Password: `ju3vrLHJUW8PqDG4`
4. **If connection fails:**
   - Go to AWS RDS Console
   - Your instance → Security group → Edit inbound rules
   - Add: PostgreSQL (5432) from your IP
   - Try connecting again
5. **Open SQL file**: File → Open File → `migrations/001_phone_auth_schema.sql`
6. **Execute**: Click "Execute SQL Script" (Ctrl+Alt+X)
7. **Done!** ✅

---

## Need Help?

If you need help with any of these options, let me know which one you'd like to use!

