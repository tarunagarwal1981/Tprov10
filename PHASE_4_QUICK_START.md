# Phase 4: Quick Start - Update Database URLs 🚀

## ✅ What's Ready

- ✅ EC2 Instance: `i-056a065313dae8712` (Running)
- ✅ Update Script: Uploaded to S3
- ✅ RDS: Accessible from EC2

---

## 🚀 3-Step Process

### **Step 1: Connect to EC2**

1. Open [EC2 Console](https://console.aws.amazon.com/ec2/)
2. Search for instance: `i-056a065313dae8712`
3. Select it → **Connect** → **EC2 Instance Connect** → **Connect**

---

### **Step 2: Run These Commands**

Copy and paste these commands one by one:

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

### **Step 3: Verify & Clean Up**

**Expected Output:**
```
✅ Updated 30 public_url records
✅ Updated 30 storage_path records
✅ All URLs updated successfully!
📊 S3 URLs: 30
```

**After success, terminate instance:**
```bash
# From your local machine
aws ec2 terminate-instances --instance-ids i-056a065313dae8712
```

---

## ⚡ That's It!

The entire process takes about 5 minutes:
- 2 min: Connect to EC2
- 2 min: Install dependencies
- 1 min: Run script

---

**Ready?** Connect to EC2 now! 🚀

