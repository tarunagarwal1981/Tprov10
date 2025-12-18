# Fix IAM Deny Policy - 403 Forbidden Error

## The Problem

The IAM user `tarunagarwal` has an **explicit DENY policy** that's blocking `s3:GetObject` access, causing 403 Forbidden errors when trying to load images.

**Error Message:**
```
User: arn:aws:iam::815660521604:user/tarunagarwal is not authorized to perform: 
s3:GetObject on resource: "arn:aws:s3:::travel-app-storage-1769/..." 
with an explicit deny in an identity-based policy
```

## Why This Happens

**Explicit DENY policies always take precedence** over ALLOW policies in AWS IAM. Even if you have an allow policy, an explicit deny will block access.

## Solution: Remove or Update the Deny Policy

### Step 1: Login to AWS Console

1. Go to: https://console.aws.amazon.com/
2. Login with **root credentials** (you need admin access to fix this)

### Step 2: Navigate to IAM

1. In the search bar, type: **IAM**
2. Click on **IAM** service
3. Or go directly to: https://console.aws.amazon.com/iam/

### Step 3: Find the User

1. Click **Users** in the left sidebar
2. Find and click on: **tarunagarwal**
3. Direct link: https://console.aws.amazon.com/iam/home#/users/tarunagarwal

### Step 4: Check Permissions

1. Click on the **Permissions** tab
2. Look for policies with **"Deny"** in the name or effect
3. Check:
   - **Permissions policies** (attached policies)
   - **Permissions boundaries** (if any)
   - **Inline policies** (policies attached directly to the user)

### Step 5: Remove or Update Deny Policy

You have three options:

#### Option A: Remove the Deny Policy (Recommended)

1. Find the policy that has `"Effect": "Deny"` for `s3:GetObject`
2. Click **Detach** or **Remove**
3. Confirm the removal

#### Option B: Update the Deny Policy to Exclude Your Bucket

If you can't remove it, update it to exclude `travel-app-storage-1769`:

1. Find the deny policy
2. Click **Edit**
3. Update the `Resource` section to exclude your bucket:

**Before:**
```json
{
  "Effect": "Deny",
  "Action": "s3:GetObject",
  "Resource": [
    "arn:aws:s3:::travel-app-storage-1769/*"  ← This is blocking access
  ]
}
```

**After (exclude your bucket):**
```json
{
  "Effect": "Deny",
  "Action": "s3:GetObject",
  "Resource": [
    "arn:aws:s3:::other-bucket/*"  ← Only deny access to other buckets
  ],
  "NotResource": [
    "arn:aws:s3:::travel-app-storage-1769/*"  ← Explicitly allow your bucket
  ]
}
```

#### Option C: Add Exception Condition

Add a condition that allows your bucket:

```json
{
  "Effect": "Deny",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::travel-app-storage-1769/*",
  "Condition": {
    "StringNotEquals": {
      "aws:RequestedRegion": "us-east-1"
    }
  }
}
```

**Note:** This is just an example - you may need to adjust based on your actual deny policy structure.

### Step 6: Add Allow Policy (If Needed)

After removing/updating the deny, ensure the user has the necessary permissions:

1. Click **Add permissions** → **Attach policies directly**
2. If no policy exists, create one with this JSON:

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

3. Name it: `S3TravelAppStorageAccess`
4. Attach it to the user

### Step 7: Wait and Test

1. **Wait 1-2 minutes** for IAM changes to propagate
2. **Refresh your application**
3. **Check browser console** - 403 errors should be gone
4. **Images should load correctly**

## Quick Checklist

- [ ] Login as root/admin user
- [ ] Go to IAM → Users → tarunagarwal
- [ ] Check Permissions tab
- [ ] Find deny policy blocking s3:GetObject
- [ ] Remove or update deny policy
- [ ] Add allow policy if needed
- [ ] Wait 1-2 minutes
- [ ] Test application

## Direct Links

- **IAM Users**: https://console.aws.amazon.com/iam/home#/users
- **User tarunagarwal**: https://console.aws.amazon.com/iam/home#/users/tarunagarwal
- **IAM Policies**: https://console.aws.amazon.com/iam/home#/policies

## Important Notes

1. **Explicit DENY always wins** - Even if you have an allow policy, a deny will block it
2. **Changes take time** - IAM changes can take 1-2 minutes to propagate
3. **Presigned URLs** - These are generated server-side, but the browser still needs permission to access them
4. **Root access needed** - You need admin/root credentials to modify IAM policies
