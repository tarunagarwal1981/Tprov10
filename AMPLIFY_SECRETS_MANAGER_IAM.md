
# Amplify Secrets Manager IAM Configuration

## Overview
Amplify's execution role needs permission to read secrets from AWS Secrets Manager. This guide shows how to grant those permissions.

## Step 1: Find Amplify's Execution Role

1. Go to Amplify Console: https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/d2p2uq8t9xysui
2. Click on your app
3. Go to **App settings** → **General**
4. Look for **Service role** or **Execution role**
5. Note the role ARN (e.g., `arn:aws:iam::123456789012:role/amplify-role`)

Alternatively, use AWS CLI:
```powershell
& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" amplify get-app --app-id d2p2uq8t9xysui --region us-east-1 --query "app.iamServiceRoleArn"
```

## Step 2: Create IAM Policy

Create a policy that allows reading the specific secret:

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

## Step 3: Attach Policy to Role (Inline Role Policy)

### Option A: Via AWS Console

1. Go to IAM Console: https://us-east-1.console.aws.amazon.com/iam/home#/roles
2. Search for the Amplify execution role
3. Click on the role
4. Click **Add permissions** → **Create inline policy**
5. Switch to **JSON** tab
6. Paste the policy JSON above
7. Name it: `SecretsManagerReadAccess`
8. Click **Create policy**

### Option B (Advanced / Optional): Via AWS CLI

```powershell
# Create policy document
$policyJson = @'
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
'@

$policyJson | Out-File -FilePath secrets-policy.json -Encoding utf8

# Get Amplify role name
$roleArn = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" amplify get-app --app-id d2p2uq8t9xysui --region us-east-1 --query "app.iamServiceRoleArn" --output text
$roleName = $roleArn.Split('/')[-1]

# Attach inline policy
& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" iam put-role-policy `
  --role-name $roleName `
  --policy-name SecretsManagerReadAccess `
  --policy-document file://secrets-policy.json `
  --region us-east-1
```

## Step 4: Verify Permissions

Test that the role can access the secret:

```powershell
# Get the role ARN
$roleArn = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" amplify get-app --app-id d2p2uq8t9xysui --region us-east-1 --query "app.iamServiceRoleArn" --output text

# Assume the role and test (requires AWS CLI setup)
# This is complex - better to test via the deployed app
```

## Recommended: Use Resource-Based Policy on the Secret

In this project we successfully used a **resource-based policy on the secret itself** to grant the Amplify role read access.
This is often simpler than fighting `MalformedPolicyDocument` errors with `iam put-role-policy`.

Instead of modifying the IAM role, you can add a resource-based policy to the secret itself:

```powershell
# Get Amplify role ARN
$roleArn = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" amplify get-app --app-id d2p2uq8t9xysui --region us-east-1 --query "app.iamServiceRoleArn" --output text

# Create resource policy JSON (example with your actual role ARN)
$resourcePolicy = @'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::815660521604:role/service-role/AmplifySSRLoggingRole-5b109d56-99a3-45c4-a40e-a24f4ca1094c"
      },
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "*"
    }
  ]
}
'@

$policyPath = Join-Path $PWD "secret-resource-policy.json"
$resourcePolicy | Out-File -FilePath $policyPath -Encoding utf8 -NoNewline

# Apply resource policy to the specific secret
& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" secretsmanager put-resource-policy `
  --secret-id travel-app/dev/secrets `
  --resource-policy "file://$policyPath" `
  --region us-east-1
```

## Verification

After setting up permissions, test via the deployed app:

1. Deploy the updated code
2. Check CloudWatch logs for any Secrets Manager access errors
3. Test the debug endpoint: `https://dev.d2p2uq8t9xysui.amplifyapp.com/api/debug/env`

If you see errors like "AccessDenied" or "User is not authorized", the IAM permissions are not correctly configured.

## Troubleshooting

### Error: "User is not authorized to perform: secretsmanager:GetSecretValue"

**Solution**: The IAM role doesn't have permission. Follow Step 3 above.

### Error: "Secrets Manager can't find the specified secret"

**Solution**: 
1. Verify the secret name matches: `travel-app/dev/secrets`
2. Check the region matches (us-east-1)
3. Run the setup script: `.\aws-migration-scripts\setup-secrets-manager.ps1`

### Error: "The security token included in the request is invalid"

**Solution**: Amplify's execution role might not be properly configured. Check the role ARN in Amplify settings.

---

**Status**: ✅ Resource-based policy attached to `travel-app/dev/secrets` for the Amplify service role.

