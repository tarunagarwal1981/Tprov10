# Amplify VPC Configuration Details 🔌

## 📋 Information Needed for VPC Connection

Save this information - you'll need it when configuring Amplify VPC connection.

---

## 🔍 Getting VPC Information

I'll help you get:
1. VPC ID
2. Subnet IDs (private subnets)
3. Security Group ID

---

## ⚠️ Important Notes

### **Security Group Configuration:**

Amplify needs a security group that:
- **Allows inbound**: PostgreSQL (5432) from Amplify
- **Allows outbound**: All traffic (for RDS connection)

**Option 1: Create New Security Group**
- Create dedicated security group for Amplify
- Allow port 5432 from Amplify's IP range

**Option 2: Update Existing Security Group**
- Add rule to existing RDS security group
- Allow port 5432 from Amplify

---

## 📝 Configuration Steps

1. **Get VPC ID** (where RDS is)
2. **Get Subnet IDs** (private subnets)
3. **Get/Create Security Group**
4. **Configure in Amplify**

---

**Let me get this information for you now...**

