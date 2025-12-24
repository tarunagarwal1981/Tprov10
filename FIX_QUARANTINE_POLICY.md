# Fix AWSCompromisedKeyQuarantineV3 Policy

## What This Policy Is

`AWSCompromisedKeyQuarantineV3` is an **AWS security quarantine policy** that's automatically applied when AWS detects potentially compromised credentials. It blocks many actions including `s3:GetObject` and `s3:ListBucket`.

## ⚠️ Important Security Warning

**DO NOT DELETE THIS POLICY** without understanding why it was applied. It's there for security reasons.

## Solution Options

### Option 1: Create New IAM User (RECOMMENDED - Most Secure)

Create a new IAM user specifically for your application with limited S3 permissions:

1. **Go to IAM Console**: https://console.aws.amazon.com/iam/
2. **Create New User**:
   - Click "Users" → "Create user"
   - Name: `travel-app-s3-user` (or similar)
   - Don't enable console access (programmatic access only)

3. **Attach Policy**:
   - Click "Attach policies directly"
   - Create a new policy with this JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectVersion"
      ],
      "Resource": "arn:aws:s3:::travel-app-storage-1769/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketCORS",
        "s3:PutBucketCORS"
      ],
      "Resource": "arn:aws:s3:::travel-app-storage-1769"
    }
  ]
}
```

4. **Get Access Keys**:
   - Go to "Security credentials" tab
   - Create access key
   - Update your `.env.local` with new credentials

5. **Update .env.local**:
```bash
AWS_ACCESS_KEY_ID=<new-access-key>
AWS_SECRET_ACCESS_KEY=<new-secret-key>
AWS_REGION=us-east-1
```

### Option 2: Update Quarantine Policy to Allow Your Bucket

If you must use the quarantined user, update the policy to exclude your bucket:

**Modified Policy:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Deny",
            "Action": [
                "cloudtrail:LookupEvents",
                "ec2:RequestSpotInstances",
                "ec2:RunInstances",
                "ec2:StartInstances",
                "iam:AddUserToGroup",
                "iam:AttachGroupPolicy",
                "iam:AttachRolePolicy",
                "iam:AttachUserPolicy",
                "iam:ChangePassword",
                "iam:CreateAccessKey",
                "iam:CreateInstanceProfile",
                "iam:CreateLoginProfile",
                "iam:CreatePolicyVersion",
                "iam:CreateRole",
                "iam:CreateUser",
                "iam:DetachUserPolicy",
                "iam:PassRole",
                "iam:PutGroupPolicy",
                "iam:PutRolePolicy",
                "iam:PutUserPermissionsBoundary",
                "iam:PutUserPolicy",
                "iam:SetDefaultPolicyVersion",
                "iam:UpdateAccessKey",
                "iam:UpdateAccountPasswordPolicy",
                "iam:UpdateAssumeRolePolicy",
                "iam:UpdateLoginProfile",
                "iam:UpdateUser",
                "lambda:AddLayerVersionPermission",
                "lambda:AddPermission",
                "lambda:CreateFunction",
                "lambda:GetPolicy",
                "lambda:ListTags",
                "lambda:PutProvisionedConcurrencyConfig",
                "lambda:TagResource",
                "lambda:UntagResource",
                "lambda:UpdateFunctionCode",
                "lightsail:Create*",
                "lightsail:Delete*",
                "lightsail:DownloadDefaultKeyPair",
                "lightsail:GetInstanceAccessDetails",
                "lightsail:Start*",
                "lightsail:Update*",
                "organizations:CreateAccount",
                "organizations:CreateOrganization",
                "organizations:InviteAccountToOrganization",
                "s3:DeleteBucket",
                "s3:DeleteObject",
                "s3:DeleteObjectVersion",
                "s3:PutLifecycleConfiguration",
                "s3:PutBucketAcl",
                "s3:PutBucketOwnershipControls",
                "s3:DeleteBucketPolicy",
                "s3:ObjectOwnerOverrideToBucketOwner",
                "s3:PutAccountPublicAccessBlock",
                "s3:PutBucketPolicy",
                "s3:ListAllMyBuckets",
                "ec2:PurchaseReservedInstancesOffering",
                "ec2:AcceptReservedInstancesExchangeQuote",
                "ec2:CreateReservedInstancesListing",
                "savingsplans:CreateSavingsPlan",
                "ecs:CreateService",
                "ecs:CreateCluster",
                "ecs:RegisterTaskDefinition",
                "ecr:GetAuthorizationToken",
                "bedrock:CreateModelInvocationJob",
                "bedrock:InvokeModelWithResponseStream",
                "bedrock:CreateFoundationModelAgreement",
                "bedrock:PutFoundationModelEntitlement",
                "bedrock:InvokeModel",
                "s3:CreateBucket",
                "s3:PutBucketCors",
                "s3:GetObject",
                "s3:ListBucket",
                "sagemaker:CreateEndpointConfig",
                "sagemaker:CreateProcessingJob",
                "ses:GetSendQuota",
                "ses:ListIdentities",
                "sts:GetSessionToken",
                "sts:GetFederationToken",
                "amplify:CreateDeployment",
                "amplify:CreateBackendEnvironment",
                "codebuild:CreateProject",
                "glue:CreateJob",
                "iam:DeleteRole",
                "iam:DeleteAccessKey",
                "iam:ListUsers",
                "lambda:GetEventSourceMapping",
                "sns:GetSMSAttributes",
                "mediapackagev2:CreateChannel"
            ],
            "Resource": [
                "*"
            ],
            "Condition": {
                "StringNotEquals": {
                    "s3:ResourceAccount": "815660521604"
                }
            }
        },
        {
            "Effect": "Deny",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::travel-app-storage-1769",
                "arn:aws:s3:::travel-app-storage-1769/*"
            ],
            "Effect": "Allow"
        }
    ]
}
```

**Actually, wait - you can't have both Deny and Allow in the same statement. Here's the correct approach:**

### Option 2 (Corrected): Add Exception for Your Bucket

Update the policy to exclude your bucket from the deny:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Deny",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "*"
            ],
            "Condition": {
                "StringNotEquals": {
                    "s3:ResourceAccount": "815660521604"
                }
            }
        },
        {
            "Effect": "Deny",
            "Action": [
                "cloudtrail:LookupEvents",
                "ec2:RequestSpotInstances",
                "ec2:RunInstances",
                "ec2:StartInstances",
                "iam:AddUserToGroup",
                "iam:AttachGroupPolicy",
                "iam:AttachRolePolicy",
                "iam:AttachUserPolicy",
                "iam:ChangePassword",
                "iam:CreateAccessKey",
                "iam:CreateInstanceProfile",
                "iam:CreateLoginProfile",
                "iam:CreatePolicyVersion",
                "iam:CreateRole",
                "iam:CreateUser",
                "iam:DetachUserPolicy",
                "iam:PassRole",
                "iam:PutGroupPolicy",
                "iam:PutRolePolicy",
                "iam:PutUserPermissionsBoundary",
                "iam:PutUserPolicy",
                "iam:SetDefaultPolicyVersion",
                "iam:UpdateAccessKey",
                "iam:UpdateAccountPasswordPolicy",
                "iam:UpdateAssumeRolePolicy",
                "iam:UpdateLoginProfile",
                "iam:UpdateUser",
                "lambda:AddLayerVersionPermission",
                "lambda:AddPermission",
                "lambda:CreateFunction",
                "lambda:GetPolicy",
                "lambda:ListTags",
                "lambda:PutProvisionedConcurrencyConfig",
                "lambda:TagResource",
                "lambda:UntagResource",
                "lambda:UpdateFunctionCode",
                "lightsail:Create*",
                "lightsail:Delete*",
                "lightsail:DownloadDefaultKeyPair",
                "lightsail:GetInstanceAccessDetails",
                "lightsail:Start*",
                "lightsail:Update*",
                "organizations:CreateAccount",
                "organizations:CreateOrganization",
                "organizations:InviteAccountToOrganization",
                "s3:DeleteBucket",
                "s3:DeleteObject",
                "s3:DeleteObjectVersion",
                "s3:PutLifecycleConfiguration",
                "s3:PutBucketAcl",
                "s3:PutBucketOwnershipControls",
                "s3:DeleteBucketPolicy",
                "s3:ObjectOwnerOverrideToBucketOwner",
                "s3:PutAccountPublicAccessBlock",
                "s3:PutBucketPolicy",
                "s3:ListAllMyBuckets",
                "ec2:PurchaseReservedInstancesOffering",
                "ec2:AcceptReservedInstancesExchangeQuote",
                "ec2:CreateReservedInstancesListing",
                "savingsplans:CreateSavingsPlan",
                "ecs:CreateService",
                "ecs:CreateCluster",
                "ecs:RegisterTaskDefinition",
                "ecr:GetAuthorizationToken",
                "bedrock:CreateModelInvocationJob",
                "bedrock:InvokeModelWithResponseStream",
                "bedrock:CreateFoundationModelAgreement",
                "bedrock:PutFoundationModelEntitlement",
                "bedrock:InvokeModel",
                "s3:CreateBucket",
                "s3:PutBucketCors",
                "sagemaker:CreateEndpointConfig",
                "sagemaker:CreateProcessingJob",
                "ses:GetSendQuota",
                "ses:ListIdentities",
                "sts:GetSessionToken",
                "sts:GetFederationToken",
                "amplify:CreateDeployment",
                "amplify:CreateBackendEnvironment",
                "codebuild:CreateProject",
                "glue:CreateJob",
                "iam:DeleteRole",
                "iam:DeleteAccessKey",
                "iam:ListUsers",
                "lambda:GetEventSourceMapping",
                "sns:GetSMSAttributes",
                "mediapackagev2:CreateChannel"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```

**Wait, that's still not right. The issue is that explicit Deny on `s3:GetObject` with `Resource: "*"` will block everything.**

### The Real Solution: Remove S3 Actions from Deny List

Remove `s3:GetObject` and `s3:ListBucket` from the deny list, but keep all other security restrictions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Deny",
            "Action": [
                "cloudtrail:LookupEvents",
                "ec2:RequestSpotInstances",
                "ec2:RunInstances",
                "ec2:StartInstances",
                "iam:AddUserToGroup",
                "iam:AttachGroupPolicy",
                "iam:AttachRolePolicy",
                "iam:AttachUserPolicy",
                "iam:ChangePassword",
                "iam:CreateAccessKey",
                "iam:CreateInstanceProfile",
                "iam:CreateLoginProfile",
                "iam:CreatePolicyVersion",
                "iam:CreateRole",
                "iam:CreateUser",
                "iam:DetachUserPolicy",
                "iam:PassRole",
                "iam:PutGroupPolicy",
                "iam:PutRolePolicy",
                "iam:PutUserPermissionsBoundary",
                "iam:PutUserPolicy",
                "iam:SetDefaultPolicyVersion",
                "iam:UpdateAccessKey",
                "iam:UpdateAccountPasswordPolicy",
                "iam:UpdateAssumeRolePolicy",
                "iam:UpdateLoginProfile",
                "iam:UpdateUser",
                "lambda:AddLayerVersionPermission",
                "lambda:AddPermission",
                "lambda:CreateFunction",
                "lambda:GetPolicy",
                "lambda:ListTags",
                "lambda:PutProvisionedConcurrencyConfig",
                "lambda:TagResource",
                "lambda:UntagResource",
                "lambda:UpdateFunctionCode",
                "lightsail:Create*",
                "lightsail:Delete*",
                "lightsail:DownloadDefaultKeyPair",
                "lightsail:GetInstanceAccessDetails",
                "lightsail:Start*",
                "lightsail:Update*",
                "organizations:CreateAccount",
                "organizations:CreateOrganization",
                "organizations:InviteAccountToOrganization",
                "s3:DeleteBucket",
                "s3:DeleteObject",
                "s3:DeleteObjectVersion",
                "s3:PutLifecycleConfiguration",
                "s3:PutBucketAcl",
                "s3:PutBucketOwnershipControls",
                "s3:DeleteBucketPolicy",
                "s3:ObjectOwnerOverrideToBucketOwner",
                "s3:PutAccountPublicAccessBlock",
                "s3:PutBucketPolicy",
                "s3:ListAllMyBuckets",
                "ec2:PurchaseReservedInstancesOffering",
                "ec2:AcceptReservedInstancesExchangeQuote",
                "ec2:CreateReservedInstancesListing",
                "savingsplans:CreateSavingsPlan",
                "ecs:CreateService",
                "ecs:CreateCluster",
                "ecs:RegisterTaskDefinition",
                "ecr:GetAuthorizationToken",
                "bedrock:CreateModelInvocationJob",
                "bedrock:InvokeModelWithResponseStream",
                "bedrock:CreateFoundationModelAgreement",
                "bedrock:PutFoundationModelEntitlement",
                "bedrock:InvokeModel",
                "s3:CreateBucket",
                "s3:PutBucketCors",
                "sagemaker:CreateEndpointConfig",
                "sagemaker:CreateProcessingJob",
                "ses:GetSendQuota",
                "ses:ListIdentities",
                "sts:GetSessionToken",
                "sts:GetFederationToken",
                "amplify:CreateDeployment",
                "amplify:CreateBackendEnvironment",
                "codebuild:CreateProject",
                "glue:CreateJob",
                "iam:DeleteRole",
                "iam:DeleteAccessKey",
                "iam:ListUsers",
                "lambda:GetEventSourceMapping",
                "sns:GetSMSAttributes",
                "mediapackagev2:CreateChannel"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```

**Notice:** I removed `"s3:GetObject"` and `"s3:ListBucket"` from the deny list. This allows S3 read access while keeping all other security restrictions.

## Recommendation

**Option 1 (Create New User) is the safest approach** because:
- Keeps the quarantine policy intact (security)
- Limits new user to only S3 access needed
- Doesn't modify AWS security policies
- If credentials are compromised, damage is limited

## Steps to Update Policy (If You Choose Option 2)

1. Go to IAM → Users → tarunagarwal → Permissions
2. Find the `AWSCompromisedKeyQuarantineV3` policy
3. Click "Edit" (if it's an inline policy) or "Detach" and create a new one
4. Remove `"s3:GetObject"` and `"s3:ListBucket"` from the Action array
5. Save changes
6. Wait 1-2 minutes for propagation
7. Test your application
