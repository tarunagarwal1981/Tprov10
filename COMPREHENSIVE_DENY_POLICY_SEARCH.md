# Comprehensive Deny Policy Search - Starting from Scratch

## 🔍 Complete Investigation Checklist

Since removing inline policies and adding S3 full access didn't work, the deny must be somewhere else.

### 1. Check IAM Groups (CRITICAL - Often Missed!)

The user might belong to a group with a deny policy:

1. **IAM → Users → tarunagarwal**
2. Click the **Groups** tab
3. **Check if the user belongs to ANY groups**
4. For each group:
   - Click the group name
   - Go to **Permissions** tab
   - Check ALL policies (inline and managed)
   - Look for `"Effect": "Deny"` with `s3:GetObject`

**This is the #1 most common place people miss deny policies!**

### 2. Check Permissions Boundary

1. **IAM → Users → tarunagarwal → Permissions tab**
2. Scroll to **Permissions boundaries** section
3. If there's a boundary set, click it
4. Check the JSON for deny statements

### 3. Check Organization-Level Policies (SCPs)

If your AWS account is in an Organization:

1. Go to: **AWS Organizations** console
2. Check **Service control policies (SCPs)**
3. These apply to ALL accounts/users in the organization
4. Look for denies on S3 actions

### 4. Verify Which Credentials Are Actually Being Used

The error might be using different credentials than you think:

1. Check your `.env.local` file - are the credentials correct?
2. Check if there are other AWS credential sources:
   - `~/.aws/credentials` file
   - Environment variables in your shell
   - AWS CLI default profile
3. The presigned URL shows: `X-Amz-Credential=REDACTED_AWS_ACCESS_KEY`
   - Verify this matches the user `tarunagarwal`

### 5. Check for Policy Conditions That Act Like Denies

Sometimes an Allow policy has conditions that effectively deny access:

1. Check ALL policies for conditions like:
   - `StringNotEquals`
   - `StringNotLike`
   - `IpAddress` restrictions
   - `DateGreaterThan` / `DateLessThan`
   - `Bool` conditions

### 6. Use AWS Policy Simulator

This will tell you EXACTLY which policy is denying:

1. Go to: **IAM → Policy Simulator**
2. Select: **User** → `tarunagarwal`
3. Action: `s3:GetObject`
4. Resource: `arn:aws:s3:::travel-app-storage-1769/activity-packages-images/*`
5. Click **Run simulation**
6. It will show you which policy is denying and why

### 7. Check Bucket Policy (Even Though Error Says Identity-Based)

The error says "identity-based" but let's double-check:

1. **S3 → travel-app-storage-1769 → Permissions → Bucket policy**
2. Look for any deny statements
3. Even if it says "identity-based", a bucket policy deny can still block

### 8. Verify IAM Changes Have Propagated

IAM changes can take time:

1. Wait at least **60 seconds** after making changes
2. Try generating a NEW presigned URL (old ones might be cached)
3. Clear browser cache completely
4. Restart dev server

### 9. Check for Multiple IAM Users with Same Access Key

1. Go to: **IAM → Users**
2. Search for access key: `REDACTED_AWS_ACCESS_KEY`
3. Make sure it belongs to `tarunagarwal` and not another user
4. If it belongs to another user, that user might have the deny

### 10. Check Resource-Based Policies on the Object

1. In S3, navigate to the actual object:
   - `activity-packages-images/c39c6b66-0712-4150-a5c0-0a3d413df33b/ae522358-7c08-4935-b3f6-1d90663e2cd8/pexels-cigdem-bilgin-2154409770-35014799.jpg`
2. Check if there's an object-level ACL or policy
3. Check object ownership

## 🎯 Most Likely Causes (In Order)

1. **Group Policy** - User belongs to a group with deny (80% probability)
2. **Permissions Boundary** - Boundary set on user (10% probability)
3. **Organization SCP** - Organization-level deny (5% probability)
4. **Wrong Credentials** - Different user/credentials being used (3% probability)
5. **Policy Condition** - Allow policy with restrictive condition (2% probability)

## 🔧 Quick Test: Use Policy Simulator

This is the FASTEST way to find the deny:

1. **IAM → Policy Simulator** (in left sidebar)
2. **Select principal**: User → `tarunagarwal`
3. **Action**: `s3:GetObject`
4. **Resource**: `arn:aws:s3:::travel-app-storage-1769/activity-packages-images/c39c6b66-0712-4150-a5c0-0a3d413df33b/ae522358-7c08-4935-b3f6-1d90663e2cd8/pexels-cigdem-bilgin-2154409770-35014799.jpg`
5. Click **Run simulation**
6. It will show you EXACTLY which policy denied and why

## 📋 Action Items

1. ✅ Check Groups tab on the user
2. ✅ Check Permissions boundaries
3. ✅ Use Policy Simulator to find the exact deny
4. ✅ Verify credentials match the user
5. ✅ Wait 60+ seconds after any IAM changes
6. ✅ Generate new presigned URLs (don't reuse old ones)

