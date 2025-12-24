# Complete Checklist: Finding the Deny Policy

Since the error says "explicit deny in an identity-based policy", it must be on the IAM user, group, or role. Let's check systematically:

## Step-by-Step: Find the Deny Policy

### 1. Check User Inline Policies (Most Common)

1. Go to: https://console.aws.amazon.com/iam/home#/users/tarunagarwal
2. Click **Permissions** tab
3. Scroll to **Permissions policies** section
4. Look for **"Add permissions"** button - above it should show all policies
5. **Important**: Look for **Inline policies** section (separate from managed policies)
6. If you see any inline policies:
   - Click on the policy name
   - Click **JSON** tab
   - Look for `"Effect": "Deny"`

### 2. Check All Attached Managed Policies

1. Still on user page → **Permissions** tab
2. For **each policy** listed (even if it doesn't say "deny" in the name):
   - Click the policy name (opens in new tab)
   - Click **JSON** tab
   - Press `Ctrl+F` (or `Cmd+F` on Mac)
   - Search for: `"Effect": "Deny"`
   - Check if it denies `s3:GetObject` or `s3:*`

### 3. Check Groups

1. On user page, click **Groups** tab
2. If user belongs to any groups:
   - Click each group name
   - Go to **Permissions** tab
   - Check all policies attached to the group
   - Look for deny statements

### 4. Check Permissions Boundaries

1. On user page → **Permissions** tab
2. Scroll to **Permissions boundaries** section (near bottom)
3. If there's a boundary set:
   - Click the boundary policy name
   - Check for deny statements

### 5. Check Roles (If User Assumes Roles)

1. On user page, click **Security credentials** tab
2. Check if user has any roles assigned
3. If yes, check those roles for deny policies

## What the Error Says

The error message is:
```
with an explicit deny in an identity-based policy
```

This means it's definitely in:
- ✅ User policy (inline or attached)
- ✅ Group policy (if user is in a group)
- ✅ Role policy (if user assumes a role)
- ❌ NOT in bucket policy (that would be "resource-based")

## Quick Visual Guide

```
IAM Console → Users → tarunagarwal → Permissions Tab

┌─────────────────────────────────────────┐
│ Permissions policies                     │
│ ┌─────────────────────────────────────┐ │
│ │ Managed policies                    │ │ ← Check each one
│ │ - Policy1 [View]                    │ │
│ │ - Policy2 [View]                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Inline policies                      │ ← Check here!
│ │ - inline-policy-1 [Edit] [Delete]  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Permissions boundaries                  │ ← Check here too!
│ ┌─────────────────────────────────────┐ │
│ │ [Boundary policy name] [View]       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## If You Still Can't Find It

1. **Take a screenshot** of the Permissions tab
2. **Check the Groups tab** - see if user is in any groups
3. **Check Security credentials tab** - see if user has roles

The deny policy MUST be there somewhere, because the error explicitly says "identity-based policy".

## Alternative: Add Explicit Allow Policy

If you can't find the deny, you can try adding an explicit allow policy that might override it (though explicit denies usually win):

1. On user page → **Permissions** tab
2. Click **Add permissions** → **Create inline policy**
3. Use JSON editor and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3Access",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::travel-app-storage-1769/*"
    }
  ]
}
```

4. Name it: `AllowS3TravelAppStorage`
5. Click **Create policy**

This might not work if there's an explicit deny, but it's worth trying.
