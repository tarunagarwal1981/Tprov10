# Phase 4: Update RDS Security Group for CloudShell Access

## Problem
CloudShell can't connect to RDS because the security group doesn't allow CloudShell's network access.

## Solution: Update Security Group

### **Step 1: Get Your CloudShell IP**

In CloudShell, run:
```bash
curl -s https://checkip.amazonaws.com
```

This will show your current IP address.

### **Step 2: Update RDS Security Group**

**Option A: Via AWS Console**

1. Go to **RDS Console** → **Databases**
2. Click on `travel-app-db`
3. Go to **Connectivity & security** tab
4. Click on the **Security group** (e.g., `sg-xxxxx`)
5. Click **Edit inbound rules**
6. Click **Add rule**
7. Configure:
   - **Type:** PostgreSQL
   - **Protocol:** TCP
   - **Port:** 5432
   - **Source:** 
     - Option 1: `0.0.0.0/0` (allows all IPs - less secure but works)
     - Option 2: Your CloudShell IP from Step 1 (more secure)
8. Click **Save rules**

**Option B: Via AWS CLI**

```bash
# Get your CloudShell IP
CLOUDSHELL_IP=$(curl -s https://checkip.amazonaws.com)

# Get the security group ID (from RDS console or describe-db-instances)
SG_ID="sg-xxxxx"  # Replace with your RDS security group ID

# Add rule
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr ${CLOUDSHELL_IP}/32
```

### **Step 3: Test Connection**

After updating the security group, wait 10-30 seconds, then test:

```bash
psql "postgresql://postgres:ju3vrLHJUW8PqDG4@travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com:5432/postgres" -c "SELECT version();"
```

---

## Alternative: Use API Route (Easier!)

Since your app is deployed on Amplify (which has VPC access), you can use the API route instead:

1. **Deploy the API route** (if not already deployed)
2. **Call it from your browser** (on the deployed app):

```javascript
fetch('/api/admin/update-urls', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

This will work because Amplify has VPC access to RDS!

---

**Recommendation:** Use the API route approach - it's easier and doesn't require security group changes! 🚀

