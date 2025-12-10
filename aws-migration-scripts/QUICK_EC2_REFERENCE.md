# Quick EC2 Bastion Reference 🚀

## When You Need EC2

Use an EC2 bastion instance when you need to:
- Connect to RDS with a GUI tool (pgAdmin, DBeaver, etc.)
- Run long-running database scripts
- Debug database connection issues
- Temporarily access RDS from outside the VPC

**Note:** For most operations, you can use:
- ✅ AWS RDS Query Editor v2 (in AWS Console)
- ✅ Lambda functions (via `travel-app-database-service`)
- ✅ Local migration scripts (via Lambda proxy)

---

## Quick Create EC2 Bastion (5 minutes)

### **Step 1: Get Your VPC Details**

```powershell
# Get VPC ID
$vpcId = aws ec2 describe-vpcs --filters "Name=tag:Name,Values=travel-app-vpc" --query "Vpcs[0].VpcId" --output text
Write-Host "VPC ID: $vpcId"

# Get Public Subnet ID
$publicSubnet = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Name,Values=*Public*" --query "Subnets[0].SubnetId" --output text
Write-Host "Public Subnet: $publicSubnet"

# Get Security Group ID (app-sg or create new)
$sgId = aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$vpcId" "Name=group-name,Values=app-sg" --query "SecurityGroups[0].GroupId" --output text
Write-Host "Security Group: $sgId"
```

### **Step 2: Create EC2 Instance**

```powershell
# Create t3.micro instance (free-tier eligible, ~$7-10/month if running 24/7)
aws ec2 run-instances `
  --image-id ami-0c55b159cbfafe1f0 `
  --instance-type t3.micro `
  --subnet-id $publicSubnet `
  --security-group-ids $sgId `
  --associate-public-ip-address `
  --iam-instance-profile Name=EC2InstanceProfile `
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=migration-bastion},{Key=Purpose,Value=temporary-bastion}]" `
  --user-data "#!/bin/bash
yum update -y
yum install -y postgresql15
"

# Get the instance ID
$instanceId = aws ec2 describe-instances --filters "Name=tag:Name,Values=migration-bastion" "Name=instance-state-name,Values=pending,running" --query "Reservations[0].Instances[0].InstanceId" --output text
Write-Host "Instance ID: $instanceId"

# Wait for instance to be running (1-2 minutes)
Write-Host "Waiting for instance to start..."
aws ec2 wait instance-running --instance-ids $instanceId

# Get public IP
$publicIp = aws ec2 describe-instances --instance-ids $instanceId --query "Reservations[0].Instances[0].PublicIpAddress" --output text
Write-Host "Public IP: $publicIp"
```

### **Step 3: Connect to EC2**

**Option A: EC2 Instance Connect (No SSH keys needed)**
1. Go to [EC2 Console](https://console.aws.amazon.com/ec2/)
2. Find instance: `migration-bastion`
3. Select → Click **"Connect"** → **"EC2 Instance Connect"** tab
4. Click **"Connect"** → Browser terminal opens!

**Option B: Session Manager**
1. Same as above, but use **"Session Manager"** tab

### **Step 4: Connect to RDS from EC2**

Once connected to EC2:

```bash
# Set RDS password (get from AWS Secrets Manager or your .env.local)
export PGPASSWORD='[YOUR_RDS_PASSWORD]'

# Connect to RDS
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres
```

---

## Quick Delete EC2 Instance

```powershell
# Find instance ID
$instanceId = aws ec2 describe-instances --filters "Name=tag:Name,Values=migration-bastion" "Name=instance-state-name,Values=running,stopped" --query "Reservations[0].Instances[0].InstanceId" --output text

# Terminate instance
aws ec2 terminate-instances --instance-ids $instanceId

# Verify termination
aws ec2 describe-instances --instance-ids $instanceId --query "Reservations[0].Instances[0].State.Name"
```

**Note:** Termination is permanent. Instance will be deleted in 1-2 minutes.

---

## Cost Estimate

- **t3.micro** (1 vCPU, 1 GiB RAM): ~$7-10/month if running 24/7
- **t3.small** (2 vCPU, 2 GiB RAM): ~$15-20/month if running 24/7
- **EBS Storage** (20-50 GiB): ~$2-5/month

**Recommendation:** Only create when needed, terminate immediately after use.

---

## Alternative: Use AWS Systems Manager Session Manager

If you have Session Manager configured, you can connect to EC2 without SSH keys:

```powershell
# Install Session Manager plugin (one-time)
# Download from: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html

# Connect via Session Manager
aws ssm start-session --target $instanceId
```

---

## Quick One-Liner Scripts

### Create EC2 Bastion
```powershell
aws ec2 run-instances --image-id ami-0c55b159cbfafe1f0 --instance-type t3.micro --subnet-id subnet-043c87443f8ef0263 --security-group-ids sg-03d1d3d0c41a29e7a --associate-public-ip-address --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=migration-bastion}]"
```

### Delete EC2 Bastion
```powershell
aws ec2 describe-instances --filters "Name=tag:Name,Values=migration-bastion" --query "Reservations[*].Instances[*].InstanceId" --output text | ForEach-Object { aws ec2 terminate-instances --instance-ids $_ }
```

---

**Last Updated:** After Supabase → AWS migration completion














