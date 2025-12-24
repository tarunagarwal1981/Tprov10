# Fix IAM Permissions - Remove Explicit Deny

## The Problem

The IAM user `tarunagarwal` has an **explicit DENY policy** that's blocking `s3:GetObject` access to the bucket. This is why you're getting 403 errors even though:
- ✅ CORS is configured correctly
- ✅ Presigned URLs are being generated
- ❌ But the browser can't actually access the objects

## Error Message

```
User: arn:aws:iam::815660521604:user/tarunagarwal is not authorized to perform: 
s3:GetObject on resource: "arn:aws:s3:::travel-app-storage-1769/..." 
with an explicit deny in an identity-based policy
```

## Solution: Remove or Update the Deny Policy

### Step 1: Login as Root User

1. Go to: https://console.aws.amazon.com/
2. Login with root credentials

### Step 2: Navigate to IAM

1. In the search bar, type: **IAM**
2. Click on **IAM** service
3. Or go directly to: https://console.aws.amazon.com/iam/

### Step 3: Find the User

1. Click **Users** in the left sidebar
2. Find and click on: **tarunagarwal**

### Step 4: Check Permissions

1. Click on the **Permissions** tab
2. Look for policies with **"Deny"** in the name or effect
3. Check both:
   - **Permissions policies** (attached policies)
   - **Permissions boundaries** (if any)

### Step 5: Remove or Update Deny Policy

You have two options:

#### Option A: Remove the Deny Policy (Recommended)

1. Find the policy that has `"Effect": "Deny"` for `s3:GetObject`
2. Click **Detach** or **Remove**
3. Confirm the removal

#### Option B: Update the Deny Policy to Exclude Your Bucket

If you can't remove it, update it to exclude your bucket:

1. Find the deny policy
2. Click **Edit**
3. Update the policy to exclude `travel-app-storage-1769`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::travel-app-storage-1769/*"  ← Remove this line
      ]
    }
  ]
}
```

Or add an exception:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::travel-app-storage-1769/*",
      "Condition": {
        "StringNotEquals": {
          "s3:ExistingObjectTag/AllowAccess": "true"
        }
      }
    }
  ]
}
```

### Step 6: Add Allow Policy (If Needed)

After removing the deny, ensure the user has the necessary permissions:

1. Click **Add permissions** → **Attach policies directly**
2. Search for or create a policy with:

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

### Step 7: Test

After updating permissions:

1. Wait 1-2 minutes for changes to propagate
2. Refresh your application
3. Images should now load!

## Quick Checklist

- [ ] Login as root user
- [ ] Go to IAM → Users → tarunagarwal
- [ ] Check Permissions tab
- [ ] Find and remove/update deny policy blocking s3:GetObject
- [ ] Add allow policy if needed
- [ ] Wait 1-2 minutes
- [ ] Test application

## Why This Happens

**Explicit DENY policies always take precedence** over ALLOW policies. Even if you have an allow policy, an explicit deny will block access. That's why:
- Presigned URLs can be generated (different permission)
- But objects can't be accessed (blocked by deny)

## Direct Links

- **IAM Users**: https://console.aws.amazon.com/iam/home#/users
- **User tarunagarwal**: https://console.aws.amazon.com/iam/home#/users/tarunagarwal
