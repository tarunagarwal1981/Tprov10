# Quick Start: Database Lambda Solution

## 🎯 Goal
Deploy a dedicated Lambda function in the VPC to handle all database operations, bypassing Amplify's env var and networking issues.

## ⚡ Quick Steps

### 1. Deploy the Lambda (5 minutes)
```powershell
powershell -ExecutionPolicy Bypass -File aws-migration-scripts/deploy-database-lambda.ps1
```

This creates:
- ✅ IAM role with VPC and Secrets Manager access
- ✅ Lambda function in the same VPC as RDS
- ✅ Proper security group configuration
- ✅ Connection to RDS via Secrets Manager

### 2. Install Lambda SDK
```powershell
npm install @aws-sdk/client-lambda
```

### 3. Update Environment Variable
In Amplify Console → Environment Variables, add:
```
DATABASE_LAMBDA_NAME=travel-app-database-service
```

### 4. Deploy Updated Code
The code is already updated to use `lambda-database.ts`. Just:
```powershell
git add .
git commit -m "Switch to Lambda database service"
git push origin dev
```

### 5. Test
After Amplify deployment completes:
- Try login
- Check CloudWatch logs for Lambda invocations
- Should work! 🎉

## 🔍 How It Works

```
User Login
  ↓
Next.js API Route (/api/user/profile)
  ↓
lambda-database.ts (calls Lambda via AWS SDK)
  ↓
Database Lambda (in VPC, reads Secrets Manager)
  ↓
RDS PostgreSQL ✅
```

## ✅ Benefits

- **No more env var issues** - Lambda reads from Secrets Manager
- **Reliable VPC access** - Lambda explicitly in VPC
- **Better security** - IAM roles, security groups properly configured
- **Easier debugging** - CloudWatch logs for Lambda
- **Scalable** - Lambda scales independently

## 🐛 Troubleshooting

### Lambda not found
- Check Lambda exists: `aws lambda get-function --function-name travel-app-database-service`
- Verify IAM role has Lambda invoke permissions

### Still getting timeouts
- Check Lambda CloudWatch logs
- Verify Lambda is in correct VPC/subnet
- Check security group allows Lambda→RDS

### Test Lambda directly
```powershell
aws lambda invoke --function-name travel-app-database-service --payload '{"action":"test"}' response.json
cat response.json
```

## 📝 Files Changed

- ✅ `lambda/database-service/` - New Lambda function
- ✅ `src/lib/aws/lambda-database.ts` - Lambda client
- ✅ `src/app/api/user/profile/route.ts` - Updated to use Lambda
- ✅ `package.json` - Added @aws-sdk/client-lambda

## 🚀 Next Steps After Deployment

1. Monitor CloudWatch logs for Lambda
2. Test all database operations
3. Update other API routes to use Lambda if needed
4. Remove old direct database code once confirmed working

