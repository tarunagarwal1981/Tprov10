# Finding the Deny Policy - Complete Checklist

The error says there's an explicit deny, but it might be in a different location. Let's check all possible places:

## Where to Look for Deny Policies

### 1. IAM User - Inline Policies ✅ Check This First

1. Go to: https://console.aws.amazon.com/iam/home#/users/tarunagarwal
2. Click **Permissions** tab
3. Scroll down to **Permissions policies** section
4. Look for **Inline policies** (not just managed policies)
5. Click on any inline policies to view them
6. Look for `"Effect": "Deny"` in the JSON

### 2. IAM User - Groups

The user might be in a group with a deny policy:

1. Still on the user page, click **Groups** tab
2. Check if the user belongs to any groups
3. For each group:
   - Click the group name
   - Go to **Permissions** tab
   - Check for deny policies

### 3. IAM User - Permissions Boundaries

1. On the user page, **Permissions** tab
2. Scroll to **Permissions boundaries** section
3. Check if there's a permissions boundary set
4. If yes, click it and check for deny statements

### 4. S3 Bucket Policy (Resource-Based Policy)

The deny might be in the bucket policy itself:

1. Go to: https://console.aws.amazon.com/s3/buckets/travel-app-storage-1769?region=us-east-1&tab=permissions
2. Scroll to **Bucket policy** section
3. Click **Edit** (or view if there's a policy)
4. Look for any statement with `"Effect": "Deny"`
5. Check if it denies access to your IAM user ARN:
   - `arn:aws:iam::815660521604:user/tarunagarwal`

### 5. Service Control Policies (SCP) - Organization Level

If you're in an AWS Organization:

1. Go to: https://console.aws.amazon.com/organizations/
2. Check for Service Control Policies
3. These apply to all accounts/users in the organization

### 6. Check All Attached Policies

Even managed policies might have deny statements:

1. On user page → **Permissions** tab
2. For each policy listed:
   - Click the policy name
   - Go to **JSON** tab
   - Search for `"Effect": "Deny"`
   - Check if it denies `s3:GetObject`

## Quick Check Script

Let me create a script to help identify where the deny is coming from.

## Most Likely Locations (in order)

1. **Bucket Policy** - Most common place for resource-based denies
2. **User Inline Policy** - Easy to miss, check carefully
3. **Group Policy** - If user is in a group
4. **Permissions Boundary** - Less common but possible

## What to Look For

In any policy JSON, look for:

```json
{
  "Effect": "Deny",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::travel-app-storage-1769/*"
}
```

Or a broader deny:

```json
{
  "Effect": "Deny",
  "Action": "s3:*",
  "Resource": "*"
}
```

## Next Steps

1. Check **Bucket Policy** first (most likely)
2. Check **User Inline Policies** 
3. Check **Groups** the user belongs to
4. Check **Permissions Boundaries**

Let me know what you find in each location!
