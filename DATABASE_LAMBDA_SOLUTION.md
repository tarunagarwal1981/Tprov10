# Database Lambda Solution - Robust Architecture

## Problem
Amplify's Next.js Lambda functions can't reliably connect to RDS due to:
- VPC configuration issues
- Environment variable passing problems
- Network/security group misconfigurations

## Solution: Dedicated Database Lambda

### Architecture
```
Next.js API Route → API Gateway → Database Lambda (in VPC) → RDS
```

### Benefits
1. **VPC Access**: Lambda runs in same VPC/subnet as RDS
2. **Security Groups**: Properly configured for Lambda→RDS access
3. **No Env Var Issues**: Lambda reads from Secrets Manager directly
4. **Separation of Concerns**: Database logic isolated
5. **Scalability**: Lambda scales independently
6. **Reliability**: No dependency on Amplify's env var passing

## Deployment Steps

### 1. Deploy the Lambda
```powershell
powershell -ExecutionPolicy Bypass -File aws-migration-scripts/deploy-database-lambda.ps1
```

This will:
- Create IAM role with VPC and Secrets Manager permissions
- Build and package the Lambda function
- Deploy Lambda in the same VPC as RDS
- Configure security groups

### 2. Create API Gateway (Optional but Recommended)

For easier calling from Next.js, create an API Gateway REST API:

```powershell
# Create API Gateway
$apiId = aws apigateway create-rest-api --name travel-app-database-api --region us-east-1 --query "id" --output text

# Create resource
$resourceId = aws apigateway create-resource --rest-api-id $apiId --path-part database --parent-id $(aws apigateway get-resources --rest-api-id $apiId --query "items[0].id" --output text) --region us-east-1 --query "id" --output text

# Create POST method
aws apigateway put-method --rest-api-id $apiId --resource-id $resourceId --http-method POST --authorization-type NONE --region us-east-1

# Set up Lambda integration
aws apigateway put-integration --rest-api-id $apiId --resource-id $resourceId --http-method POST --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:815660521604:function:travel-app-database-service/invocations" --region us-east-1

# Deploy API
aws apigateway create-deployment --rest-api-id $apiId --stage-name prod --region us-east-1
```

### 3. Update Next.js to Use Lambda

Option A: Direct Lambda Invocation (from server-side)
- Update `src/lib/aws/database.ts` to use `lambda-database.ts`
- Requires AWS SDK in Lambda environment (already available)

Option B: API Gateway (simpler, works from anywhere)
- Set `DATABASE_API_URL` env var in Amplify
- Update `lambda-database.ts` to use API Gateway URL

### 4. Update API Routes

Change imports in API routes:
```typescript
// OLD
import { queryOne } from '@/lib/aws/database';

// NEW  
import { queryOne } from '@/lib/aws/lambda-database';
```

## Testing

1. **Test Lambda directly:**
```powershell
aws lambda invoke --function-name travel-app-database-service --payload '{"action":"test"}' response.json
```

2. **Test from Next.js:**
- Deploy updated code
- Try login
- Check CloudWatch logs for Lambda invocations

## Advantages Over Direct Connection

✅ **Reliable VPC Access**: Lambda is explicitly in VPC
✅ **No Env Var Issues**: Reads from Secrets Manager
✅ **Better Security**: IAM roles, security groups properly configured
✅ **Easier Debugging**: CloudWatch logs for Lambda
✅ **Scalable**: Lambda scales independently
✅ **Maintainable**: Database logic in one place

## Cost

- Lambda: ~$0.20 per 1M requests (very cheap)
- API Gateway: ~$3.50 per 1M requests (if used)
- Total: Negligible for most apps

## Next Steps

1. Run deployment script
2. Test Lambda function
3. Update Next.js code to use Lambda
4. Deploy and test login

