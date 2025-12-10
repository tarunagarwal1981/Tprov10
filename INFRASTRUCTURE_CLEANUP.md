# Infrastructure Cleanup & Security Hardening 🔒

## 🎯 Goal
1. Delete EC2 bastion instance (no longer needed)
2. Make RDS private (security best practice)
3. Optimize costs

---

## Current Status

### EC2 Instance
- **Instance ID**: `i-0cf90a4dc4f39debd`
- **Purpose**: Migration bastion host
- **Status**: No longer needed (migration complete)
- **Action**: Delete

### RDS Instance
- **Instance ID**: `travel-app-db`
- **Current**: Publicly accessible (for migration)
- **Action**: Make private

---

## Steps

### Step 1: Delete EC2 Instance

```powershell
aws ec2 terminate-instances --instance-ids i-0cf90a4dc4f39debd
```

**Note**: This will permanently delete the instance. It cannot be undone.

### Step 2: Make RDS Private

```powershell
aws rds modify-db-instance `
    --db-instance-identifier travel-app-db `
    --no-publicly-accessible `
    --apply-immediately
```

**Note**: After this, RDS will only be accessible from within the VPC.

---

## ⚠️ Important Considerations

### After Making RDS Private:

1. **Application Access**: 
   - If your application runs outside the VPC (e.g., on Netlify/Vercel), you'll need:
     - AWS Lambda function as a proxy
     - Or use AWS AppSync/API Gateway
     - Or deploy application to EC2/ECS within the VPC

2. **Development Access**:
   - Use AWS Systems Manager Session Manager
   - Or create a new temporary bastion when needed
   - Or use AWS CloudShell

3. **Database Connection**:
   - Update connection strings to use private endpoint
   - Ensure security groups allow connections from your application

---

## ✅ Benefits

- **Cost Savings**: No EC2 instance running
- **Security**: RDS not exposed to internet
- **Best Practices**: Follows AWS security recommendations

---

**Ready to proceed?** I'll help you execute these steps!

