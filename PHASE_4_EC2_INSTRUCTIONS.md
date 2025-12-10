# Phase 4: Update URLs via EC2 Instance 🔄

## ✅ EC2 Instance Created

**Instance ID:** `i-056a065313dae8712`  
**Status:** Running  
**Name:** migration-bastion

---

## 🚀 Quick Steps

### **Step 1: Connect to EC2 Instance**

**Option A: EC2 Instance Connect (Easiest - No SSH keys needed)**

1. Go to [EC2 Console](https://console.aws.amazon.com/ec2/)
2. Find instance: `i-056a065313dae8712` (or search "migration-bastion")
3. Select it → Click **"Connect"** button
4. Go to **"EC2 Instance Connect"** tab
5. Click **"Connect"** → Browser terminal opens!

**Option B: Session Manager**

1. Same as above, but use **"Session Manager"** tab instead

---

### **Step 2: Install Dependencies**

Once connected, run:

```bash
# Install Node.js and npm
sudo yum install -y nodejs npm

# Install tsx globally
sudo npm install -g tsx

# Install pg package
cd /tmp
npm init -y
npm install pg @types/pg
```

---

### **Step 3: Upload and Run Update Script**

**Option A: Copy-paste script**

Copy the entire contents of `aws-migration-scripts/update-urls.ts` and paste into EC2 terminal:

```bash
# Create the script file
cat > /tmp/update-urls.ts << 'SCRIPT_EOF'
[paste script content here]
SCRIPT_EOF

# Run it
tsx /tmp/update-urls.ts
```

**Option B: Upload from S3 (if you upload it)**

```bash
# Upload script to S3 first (from your local machine)
aws s3 cp aws-migration-scripts/update-urls.ts s3://travel-app-storage-1769/migration/

# Then download on EC2
aws s3 cp s3://travel-app-storage-1769/migration/update-urls.ts /tmp/
tsx /tmp/update-urls.ts
```

---

### **Step 4: Verify Results**

You should see:
```
✅ Updated 30 public_url records
✅ Updated 30 storage_path records
✅ All URLs updated successfully!
📊 S3 URLs: 30
📊 Remaining Supabase URLs: 0
```

---

### **Step 5: Clean Up**

After successful update, terminate the EC2 instance:

```bash
# From your local machine
aws ec2 terminate-instances --instance-ids i-056a065313dae8712
```

---

## 📋 Quick Copy-Paste Commands

**Full sequence to run on EC2:**

```bash
# Install dependencies
sudo yum install -y nodejs npm
sudo npm install -g tsx
cd /tmp
npm init -y
npm install pg @types/pg

# Create script (copy from update-urls.ts file)
cat > /tmp/update-urls.ts << 'EOF'
[paste script content]
EOF

# Run update
tsx /tmp/update-urls.ts
```

---

**Ready to connect!** Go to EC2 Console and connect via EC2 Instance Connect! 🚀

