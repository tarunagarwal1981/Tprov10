# Systematic Troubleshooting - Starting from Scratch

## ✅ What We Know

1. ✅ Credentials are correct: `REDACTED_AWS_ACCESS_KEY` matches presigned URL
2. ✅ S3 full access policy is attached
3. ✅ Inline policy removed
4. ❌ Still getting "explicit deny in an identity-based policy"

## 🎯 Most Likely Causes (In Order of Probability)

### 1. GROUP POLICY (80% Probability) ⚠️ CHECK THIS FIRST!

**This is the #1 most common missed location!**

1. Go to: **IAM → Users → tarunagarwal**
2. Click the **Groups** tab (NOT Permissions tab)
3. **Does the user belong to ANY groups?**
4. If YES:
   - Click each group name
   - Go to **Permissions** tab
   - Check ALL policies (both inline and managed)
   - Look for `"Effect": "Deny"` with `s3:GetObject`

**Groups are evaluated BEFORE user policies, so a group deny will block everything!**

### 2. Permissions Boundary (15% Probability)

1. **IAM → Users → tarunagarwal → Permissions tab**
2. Scroll down to **Permissions boundaries** section
3. If there's a boundary set, click it
4. Check the JSON for deny statements

### 3. Organization SCP (5% Probability)

If your AWS account is in an Organization:

1. Go to: **AWS Organizations** console
2. Check **Service control policies (SCPs)**
3. These apply to ALL accounts/users
4. Look for denies on S3

## 🔧 Use AWS Policy Simulator (FASTEST METHOD)

This will tell you EXACTLY which policy is denying:

1. **IAM → Policy Simulator** (left sidebar)
2. **Select principal**: User → `tarunagarwal`
3. **Action**: `s3:GetObject`
4. **Resource**: 
   ```
   arn:aws:s3:::travel-app-storage-1769/activity-packages-images/c39c6b66-0712-4150-a5c0-0a3d413df33b/ae522358-7c08-4935-b3f6-1d90663e2cd8/pexels-cigdem-bilgin-2154409770-35014799.jpg
   ```
5. Click **Run simulation**
6. It will show you the EXACT policy that's denying

## 🔍 Alternative: Check via AWS CLI

If you have AWS CLI configured:

```bash
# Check which groups the user belongs to
aws iam list-groups-for-user --user-name tarunagarwal

# For each group, check policies
aws iam list-group-policies --group-name GROUP_NAME
aws iam list-attached-group-policies --group-name GROUP_NAME

# Check permissions boundary
aws iam get-user --user-name tarunagarwal --query 'User.PermissionsBoundary'
```

## 📋 Complete Checklist

- [ ] Checked Groups tab on user (CRITICAL - do this first!)
- [ ] Checked Permissions boundaries
- [ ] Used Policy Simulator to find exact deny
- [ ] Checked Organization SCPs (if applicable)
- [ ] Verified credentials match user
- [ ] Waited 60+ seconds after IAM changes
- [ ] Restarted dev server
- [ ] Cleared browser cache

## ⚡ Quick Test: Temporarily Remove User from All Groups

If the user belongs to groups, try this:

1. **IAM → Users → tarunagarwal → Groups tab**
2. For each group, click **Remove user from group**
3. Wait 30 seconds
4. Test if images load
5. If they do, the deny was in a group policy!

## 🎯 Action Plan

**RIGHT NOW, do this:**

1. **IAM → Users → tarunagarwal → Groups tab**
   - Take a screenshot or note which groups the user belongs to
   - Check each group's policies for denies

2. **IAM → Policy Simulator**
   - Run the simulation
   - It will tell you exactly which policy is denying

3. **Share the results** and we'll fix the exact policy

The Policy Simulator is your best friend here - it will tell you EXACTLY what's denying access!

