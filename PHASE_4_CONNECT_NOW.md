# Phase 4: Connect to EC2 Now! 🔌

## ✅ Setup Complete

- ✅ EC2 Instance: `i-056a065313dae8712` (Running)
- ✅ Security Group: SSH access configured
- ✅ IAM Role: SSM permissions attached
- ✅ Script: Uploaded to S3

---

## 🚀 Connect Now

### **Method 1: Session Manager (Recommended)**

**Via AWS CLI:**
```bash
aws ssm start-session --target i-056a065313dae8712
```

**Via AWS Console:**
1. Go to [EC2 Console](https://console.aws.amazon.com/ec2/)
2. Find instance: `i-056a065313dae8712`
3. Select it → **Connect** → **Session Manager** tab → **Connect**

**Note:** SSM Agent may need 2-3 minutes to register. If it says "None", wait a bit and try again.

---

### **Method 2: EC2 Instance Connect**

1. Go to [EC2 Console](https://console.aws.amazon.com/ec2/)
2. Find instance: `i-056a065313dae8712`
3. Select it → **Connect** → **EC2 Instance Connect** tab → **Connect**

**Note:** SSH access is now configured. If it still fails, wait 1-2 minutes for the instance to fully initialize.

---

## 📋 Once Connected, Run These Commands

```bash
# Install dependencies
sudo yum install -y nodejs npm
sudo npm install -g tsx
cd /tmp
npm init -y
npm install pg @types/pg

# Download script from S3
aws s3 cp s3://travel-app-storage-1769/migration/update-urls.ts /tmp/

# Run the update
tsx /tmp/update-urls.ts
```

---

## ✅ Expected Output

```
🔄 Updating database URLs from Supabase to S3...
📦 Updating activity_package_images table...
✅ Updated 30 public_url records
✅ Updated 30 storage_path records
✅ All URLs updated successfully!
📊 S3 URLs: 30
```

---

## 🧹 After Success

Terminate the instance:
```bash
aws ec2 terminate-instances --instance-ids i-056a065313dae8712
```

---

**Try connecting now!** If Session Manager shows "None", wait 2-3 minutes and try again. 🚀

