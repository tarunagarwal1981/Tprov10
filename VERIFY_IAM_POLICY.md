# Verify IAM Policy Configuration

## Current Error

The XML error shows:
```xml
<Error>
<Code>AccessDenied</Code>
<Message>Access Denied</Message>
</Error>
```

This is a generic access denied, which means IAM permissions are still blocking.

## Verify Your Allow Policy

### Step 1: Check Policy JSON

Go to IAM → Users → tarunagarwal → Permissions → [Your Policy Name] → JSON tab

Make sure it looks exactly like this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::travel-app-storage-1769/*"
    }
  ]
}
```

**Critical Points:**
- ✅ `Effect` must be `"Allow"` (not "Deny")
- ✅ `Action` must be `"s3:GetObject"` (exact match)
- ✅ `Resource` must end with `/*` (not just the bucket name)
- ✅ Resource must be: `arn:aws:s3:::travel-app-storage-1769/*`

### Step 2: Check Policy Type

Make sure the policy is:
- ✅ **Attached to the user** (not just created)
- ✅ **Active/Enabled** (not disabled)
- ✅ **Inline policy** or **Managed policy** (both work)

### Step 3: Wait for Propagation

IAM changes can take **5-10 minutes**. If you just added it:
- Wait 5 more minutes
- Try again

## Alternative: Add More Permissions

If the basic policy doesn't work, try a more permissive one:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::travel-app-storage-1769/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::travel-app-storage-1769"
    }
  ]
}
```

## Check for Deny Policies Again

Even with an allow, a deny will override it. Check:

1. **All user policies** - Look for any with `"Effect": "Deny"`
2. **Groups** - If user is in groups, check group policies
3. **Permissions boundaries** - Check if there's a boundary

## Test with Different Approach

If policies aren't working, the issue might be:

1. **Presigned URL generation** - The credentials used to generate the URL might not have access
2. **Different IAM user** - The presigned URL might be signed with different credentials

Let's check what credentials are being used to generate presigned URLs.
