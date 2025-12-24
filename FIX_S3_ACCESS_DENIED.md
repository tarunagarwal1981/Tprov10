# Fix S3 Access Denied - Explicit Deny Policy

## 🔴 Problem Identified

The error message shows:
```
User: arn:aws:iam::815660521604:user/tarunagarwal is not authorized to perform: s3:GetObject 
on resource: "arn:aws:s3:::travel-app-storage-1769/..." 
with an explicit deny in an identity-based policy
```

**Key Issue**: There's an **explicit deny policy** blocking S3 access. In IAM, explicit Deny always overrides Allow policies.

## 🔍 Where to Find the Deny Policy

### Step 1: Check IAM User Policies (Most Likely)

1. Go to: **https://console.aws.amazon.com/iam/**
2. Navigate to: **Users** → **tarunagarwal**
3. Click the **Permissions** tab
4. Check these sections:

#### A. Inline Policies
- Scroll to **Permissions policies** section
- Look for any **inline policies** (policies created directly for this user)
- Click each one and check the JSON for `"Effect": "Deny"`

#### B. Managed Policies
- In the same **Permissions policies** section
- Check all **managed policies** attached to the user
- Click each policy name → **JSON** tab
- Search for `"Effect": "Deny"` and `s3:GetObject`

#### C. Groups
- Click the **Groups** tab
- If the user belongs to any groups, check each group's policies
- Go to each group → **Permissions** tab → Check policies

#### D. Permissions Boundaries
- Back on the user's **Permissions** tab
- Scroll to **Permissions boundaries** section
- If there's a boundary set, click it and check for deny statements

### Step 2: Check S3 Bucket Policy

The deny might be in the bucket policy itself:

1. Go to: **https://console.aws.amazon.com/s3/**
2. Click on bucket: **travel-app-storage-1769**
3. Go to **Permissions** tab
4. Scroll to **Bucket policy** section
5. Click **Edit** (or view if read-only)
6. Look for any statement with:
   - `"Effect": "Deny"`
   - `"Principal": { "AWS": "arn:aws:iam::815660521604:user/tarunagarwal" }`
   - `"Action": "s3:GetObject"`

### Step 3: Check Organization Policies (If Applicable)

If your AWS account is part of an Organization:

1. Go to: **https://console.aws.amazon.com/organizations/**
2. Check **Service control policies (SCPs)**
3. These can deny access at the organization level

## ✅ How to Fix

### Option 1: Remove the Deny Policy (Recommended)

If the deny policy is not needed:

1. **For Inline Policies:**
   - User → Permissions → Find the deny policy
   - Click **Remove** or **Delete**

2. **For Managed Policies:**
   - User → Permissions → Find the deny policy
   - Click **Detach**

3. **For Bucket Policy:**
   - S3 → Bucket → Permissions → Bucket policy
   - Edit and remove the deny statement
   - Or modify it to exclude `s3:GetObject`

### Option 2: Modify the Deny Policy

If you need to keep some restrictions, modify the deny to exclude activity package images:

**Example - Allow activity package images:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::travel-app-storage-1769/*",
      "Condition": {
        "StringNotLike": {
          "s3:key": [
            "activity-packages-images/*"
          ]
        }
      }
    }
  ]
}
```

This denies `s3:GetObject` for everything EXCEPT paths starting with `activity-packages-images/`.

### Option 3: Add Exception to Deny Policy

Add a condition to the deny that excludes your specific use case:

```json
{
  "Effect": "Deny",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::travel-app-storage-1769/*",
  "Condition": {
    "StringNotEquals": {
      "aws:PrincipalArn": "arn:aws:iam::815660521604:user/tarunagarwal"
    }
  }
}
```

## 🔧 Ensure Allow Policy Exists

After removing/modifying the deny, make sure you have an Allow policy:

1. Go to: **IAM** → **Users** → **tarunagarwal** → **Permissions**
2. Check if there's a policy allowing `s3:GetObject`
3. If not, attach or create one:

**Minimum Required Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::travel-app-storage-1769/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::travel-app-storage-1769"
    }
  ]
}
```

## 🧪 Test After Fix

1. **Wait 10-30 seconds** for IAM changes to propagate
2. **Restart your development server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```
3. **Clear browser cache** (Ctrl+Shift+Delete) or use Incognito
4. **Reload the operator dashboard**
5. **Check browser console** - should see:
   - `✅ [Card] Image loaded successfully:` instead of errors
   - Images should display in package cards

## 📋 Quick Checklist

- [ ] Checked IAM User inline policies
- [ ] Checked IAM User managed policies
- [ ] Checked IAM Groups user belongs to
- [ ] Checked Permissions boundaries
- [ ] Checked S3 Bucket policy
- [ ] Removed or modified deny policy
- [ ] Verified Allow policy exists
- [ ] Waited for IAM propagation
- [ ] Restarted dev server
- [ ] Tested image loading

## ⚠️ Important Notes

1. **Explicit Deny Always Wins**: Even if you have an Allow policy, an explicit Deny will block access.

2. **Policy Propagation**: IAM changes can take 10-30 seconds to propagate. Be patient.

3. **Multiple Policies**: Check ALL policies attached to the user, groups, and bucket. Any one deny can block access.

4. **Resource ARN**: Make sure the policy applies to the correct resource:
   - Bucket: `arn:aws:s3:::travel-app-storage-1769`
   - Objects: `arn:aws:s3:::travel-app-storage-1769/*`

## 🆘 Still Having Issues?

If you can't find or modify the deny policy:

1. **Check if you have admin access** - You might need root/admin credentials
2. **Contact AWS Support** - They can help identify where the deny is coming from
3. **Use AWS CLI** to list all policies:
   ```bash
   aws iam list-user-policies --user-name tarunagarwal
   aws iam list-attached-user-policies --user-name tarunagarwal
   aws iam get-user-policy --user-name tarunagarwal --policy-name POLICY_NAME
   ```
4. **Create a new IAM user** with proper permissions if needed

