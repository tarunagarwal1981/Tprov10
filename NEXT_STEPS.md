# Next Steps - Lambda Integration Complete! 🎉

## ✅ What's Done

1. **Lambda Function Deployed**: `travel-app-database-service`
2. **VPC Endpoint Created**: Secrets Manager access configured
3. **Security Groups Fixed**: Lambda can access VPC endpoint and RDS
4. **BOM Handling Fixed**: Secret JSON parsing works
5. **Lambda Tested**: Returns `{"success":true}` ✅
6. **Code Updated**: Next.js API routes use Lambda client

## ⏳ What You Need to Do

### Step 1: Add Environment Variable in Amplify

1. Go to **Amplify Console**: https://console.aws.amazon.com/amplify/
2. Select your app → **dev** branch
3. Go to **App settings** → **Environment variables**
4. Click **Manage variables**
5. Add:
   - **Key**: `DATABASE_LAMBDA_NAME`
   - **Value**: `travel-app-database-service`
6. **Save**

### Step 2: Grant Lambda Invoke Permission

The Amplify service role needs permission to invoke the Lambda.

**Option A: AWS Console (Easier)**
1. Go to Lambda Console: https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/travel-app-database-service
2. **Configuration** tab → **Permissions**
3. Scroll down to **Resource-based policy**
4. Click **Add permissions** → **Create resource-based policy**
5. Configure:
   - **Principal**: `amplify.amazonaws.com` (or your Amplify service role ARN)
   - **Source ARN**: Your Amplify app ARN (optional, for extra security)
   - **Action**: `lambda:InvokeFunction`
6. **Save**

**Option B: AWS CLI**
```powershell
# Get Amplify app ID from Amplify Console URL or:
aws amplify list-apps --query "apps[?name=='YOUR_APP_NAME'].appId" --output text

# Get Amplify service role
aws amplify get-app --app-id YOUR_APP_ID --query "app.serviceRoleArn" --output text

# Add permission (replace ROLE_ARN with the role from above)
aws lambda add-permission `
  --function-name travel-app-database-service `
  --statement-id amplify-invoke-permission `
  --action lambda:InvokeFunction `
  --principal ROLE_ARN `
  --region us-east-1
```

### Step 3: Commit and Deploy

```powershell
git add .
git commit -m "Add Lambda database service integration"
git push origin dev
```

Amplify will automatically deploy.

### Step 4: Test Login

1. Go to: `https://dev.d2p2uq8t9xysui.amplifyapp.com/login`
2. Login with: `agent@gmail.com` / `Agent@123`
3. Should work! ✅

## 🐛 Troubleshooting

If login fails:

1. **Check Lambda Logs**:
   - CloudWatch → Log groups → `/aws/lambda/travel-app-database-service`
   - Look for errors

2. **Check Amplify Logs**:
   - Amplify Console → Monitoring → Logs
   - Look for API route errors

3. **Verify Environment Variable**:
   - Amplify Console → Environment variables
   - Confirm `DATABASE_LAMBDA_NAME` is set

4. **Verify Lambda Permissions**:
   - Lambda Console → Permissions
   - Check resource-based policy

5. **Test Lambda Directly**:
   - Lambda Console → Test
   - Use: `{"action":"test"}`
   - Should return success

## 📊 Architecture

```
User → Next.js App (Amplify)
         ↓
    /api/user/profile (API Route)
         ↓
    Lambda Client SDK
         ↓
travel-app-database-service (Lambda in VPC)
         ↓
    VPC Endpoint → Secrets Manager
         ↓
    RDS PostgreSQL
```

## ✅ Success Criteria

- [x] Lambda deployed and tested
- [x] VPC endpoint configured
- [x] Security groups configured
- [x] Code updated to use Lambda
- [ ] Environment variable added in Amplify
- [ ] Lambda invoke permission granted
- [ ] App deployed
- [ ] Login tested and working

You're almost there! Just add the env var and permission, then deploy! 🚀

