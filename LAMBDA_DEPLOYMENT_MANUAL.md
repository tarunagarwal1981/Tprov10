# Manual Lambda Deployment Guide

## Issue
AWS CLI is having connectivity issues with IAM endpoint. Here's how to deploy manually or fix the issue.

## Option 1: Fix Network/Credentials (Quick)

### Check AWS Configuration
```powershell
aws configure list
```

### Test IAM Access
```powershell
aws iam list-roles --max-items 1
```

If this fails, check:
- Internet connectivity
- VPN/firewall blocking AWS endpoints
- AWS credentials expired

## Option 2: Create IAM Role via AWS Console

1. **Go to IAM Console**: https://console.aws.amazon.com/iam/
2. **Create Role**:
   - Click "Roles" → "Create role"
   - Trusted entity: "AWS service"
   - Use case: "Lambda"
   - Click "Next"
3. **Attach Policies**:
   - `AWSLambdaVPCAccessExecutionRole` (for VPC access)
   - Click "Next"
4. **Role Name**: `travel-app-database-lambda-role`
5. **Create Role**
6. **Add Inline Policy for Secrets Manager**:
   - Click on the role → "Add permissions" → "Create inline policy"
   - JSON tab, paste:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "secretsmanager:GetSecretValue",
           "secretsmanager:DescribeSecret"
         ],
         "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:travel-app/dev/secrets-*"
       }
     ]
   }
   ```
   - Name: `SecretsManagerAccess`
   - Create policy

## Option 3: Use Existing Role (If Available)

If you have an existing Lambda execution role, you can use it. Update the script to use that role ARN instead.

## Option 4: Deploy Lambda via Console

1. **Build the Lambda package locally**:
   ```powershell
   cd lambda/database-service
   npm install --omit=dev
   npm install --save-dev @types/pg typescript
   npx tsc
   # Create zip: index.js, package.json, node_modules
   ```

2. **Create Lambda via Console**:
   - Go to: https://console.aws.amazon.com/lambda/
   - "Create function"
   - Name: `travel-app-database-service`
   - Runtime: Node.js 20.x
   - Architecture: arm64 or x86_64
   - Use existing role: `travel-app-database-lambda-role` (created above)
   - Create function

3. **Upload Code**:
   - Upload the zip file
   - Handler: `index.handler`

4. **Configure**:
   - General: Timeout 30s, Memory 512 MB
   - VPC: Select VPC `vpc-035de28e2067ea386`
   - Subnets: `subnet-03492171db95e0412`, `subnet-0a9c5d406940f11d2`
   - Security Group: `sg-0351956ce61a8d1f1`
   - Environment variables:
     - `SECRETS_MANAGER_SECRET_NAME` = `travel-app/dev/secrets`
     - `AWS_REGION` = `us-east-1`

5. **Test**:
   - Test tab → Create test event:
   ```json
   {
     "action": "test"
   }
   ```
   - Run test

## After Lambda is Deployed

1. **Get Lambda ARN** from console
2. **Update Next.js code** to use the Lambda (already done)
3. **Set environment variable in Amplify**:
   - `DATABASE_LAMBDA_NAME` = `travel-app-database-service`
4. **Deploy and test**

## Quick Test Command (After Deployment)

```powershell
aws lambda invoke --function-name travel-app-database-service --payload '{"action":"test"}' response.json
cat response.json
```

