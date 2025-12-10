# Quick Lambda Deployment - Manual Steps

Since AWS CLI IAM commands are having connectivity issues, here's the fastest way to deploy:

## Step 1: Create IAM Role (AWS Console - 2 minutes)

1. **Go to IAM Console**: https://console.aws.amazon.com/iam/home#/roles
2. **Click "Create role"**
3. **Select**:
   - Trusted entity: **AWS service**
   - Service: **Lambda**
   - Click **Next**
4. **Attach policies**:
   - Search and select: **AWSLambdaVPCAccessExecutionRole**
   - Click **Next**
5. **Role name**: `travel-app-database-lambda-role`
6. **Click "Create role"**
7. **Add Secrets Manager policy**:
   - Click on the role name
   - "Add permissions" → "Create inline policy"
   - **JSON** tab, paste:
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
   - **Create policy**

## Step 2: Build Lambda Package (Local - 3 minutes)

```powershell
cd lambda/database-service

# Install dependencies
npm install --omit=dev

# Install TypeScript
npm install --save-dev typescript @types/pg

# Compile
npx tsc

# Create zip (include: index.js, package.json, node_modules)
Compress-Archive -Path index.js,package.json,node_modules -DestinationPath function.zip -Force
```

## Step 3: Create Lambda Function (AWS Console - 5 minutes)

1. **Go to Lambda Console**: https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions
2. **Click "Create function"**
3. **Configure**:
   - Function name: `travel-app-database-service`
   - Runtime: **Node.js 20.x**
   - Architecture: **arm64** (or x86_64)
   - Execution role: **Use an existing role**
   - Existing role: `travel-app-database-lambda-role`
   - **Create function**
4. **Upload code**:
   - Upload `lambda/database-service/function.zip`
   - **Save**
5. **Configuration**:
   - **General**:
     - Timeout: **30 seconds**
     - Memory: **512 MB**
   - **VPC**:
     - Click "Edit"
     - VPC: `vpc-035de28e2067ea386`
     - Subnets: 
       - `subnet-03492171db95e0412`
       - `subnet-0a9c5d406940f11d2`
     - Security groups: `sg-0351956ce61a8d1f1`
     - **Save** (wait 30 seconds for VPC attachment)
   - **Environment variables**:
     - `SECRETS_MANAGER_SECRET_NAME` = `travel-app/dev/secrets`
     - `AWS_REGION` = `us-east-1`
     - **Save**

## Step 4: Test Lambda

1. **Test tab** → **Create test event**
2. **Event JSON**:
   ```json
   {
     "action": "test"
   }
   ```
3. **Save** → **Test**
4. **Should see**: `{"statusCode":200,"body":"{\"success\":true,\"time\":\"...\"}"}`

## Step 5: Update Next.js

1. **Add env var in Amplify**:
   - `DATABASE_LAMBDA_NAME` = `travel-app-database-service`
2. **Deploy code** (already updated to use Lambda)
3. **Test login**

## Total Time: ~15 minutes

This bypasses all CLI issues and gets you deployed quickly!

