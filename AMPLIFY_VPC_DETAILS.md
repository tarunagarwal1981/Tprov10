# Amplify VPC Configuration Details 🔌

## 📋 Save This Information!

You'll need these when configuring Amplify VPC connection in the AWS Console.

---

## ✅ VPC Configuration

### **VPC ID:**
```
vpc-035de28e2067ea386
```

### **Subnet IDs (Private Subnets):**
```
subnet-03492171db95e0412
subnet-0a9c5d406940f11d2
```

### **Security Group (RDS):**
```
sg-0351956ce61a8d1f1
```

---

## ⚠️ Important: Security Group Update

Before connecting Amplify to VPC, you need to update the security group to allow Amplify to connect to RDS.

**Option 1: Update Existing Security Group**

Add inbound rule to `sg-0351956ce61a8d1f1`:
- **Type**: PostgreSQL
- **Port**: 5432
- **Source**: VPC CIDR (or specific Amplify IP range)
- **Description**: Allow Amplify to connect to RDS

**Option 2: Create New Security Group**

Create a new security group for Amplify:
- Allow inbound: PostgreSQL (5432) from VPC
- Attach to RDS instance

---

## 📝 How to Use in Amplify

1. **Go to Amplify Console**
   - Your App → **"App settings"** → **"VPC"**

2. **Configure:**
   - **VPC**: `vpc-035de28e2067ea386`
   - **Subnets**: 
     - `subnet-03492171db95e0412`
     - `subnet-0a9c5d406940f11d2`
   - **Security Group**: `sg-0351956ce61a8d1f1` (or new one)

3. **Save** and wait for restart (~2-3 minutes)

---

**Keep this file safe!** You'll need it during Amplify setup. 🔒

