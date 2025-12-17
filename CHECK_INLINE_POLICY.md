# Check the AllowS3TravelAppStorage Inline Policy

## 🎯 Found the Likely Culprit

Based on your screenshots, I can see you have an **inline policy** called `AllowS3TravelAppStorage` attached to the `tarunagarwal` user. This is the most likely place where the deny statement is located.

## 📋 Steps to Check the Policy

### Step 1: Open the Inline Policy

1. In the IAM console, you're already on: **Users → tarunagarwal → Permissions**
2. In the **Permissions policies** table, find the row with:
   - **Policy name**: `AllowS3TravelAppStorage`
   - **Type**: `Customer inline`
   - **Attached via**: `Inline`
3. **Click on the policy name** `AllowS3TravelAppStorage` (it should be a clickable link)

### Step 2: View the Policy JSON

1. You should now see the policy details page
2. Click on the **JSON** tab to view the policy document
3. Look for any statements with `"Effect": "Deny"`

### Step 3: What to Look For

The policy might look something like this (with a deny statement):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::travel-app-storage-1769/*"
    },
    {
      "Effect": "Deny",  // ← THIS IS THE PROBLEM
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::travel-app-storage-1769/*",
      "Condition": {
        // Some condition that's blocking access
      }
    }
  ]
}
```

Or it might have a deny that's too broad:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "s3:*",
      "Resource": "*"
    }
  ]
}
```

## ✅ How to Fix

### Option 1: Edit the Policy to Remove the Deny

1. On the policy page, click **Edit**
2. Remove or modify the deny statement
3. Make sure you have an Allow statement like:

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

4. Click **Save changes**

### Option 2: Delete and Recreate the Policy

If the policy is too complex or you're not sure what to change:

1. Go back to: **Users → tarunagarwal → Permissions**
2. Check the box next to `AllowS3TravelAppStorage`
3. Click **Remove**
4. Click **Add permissions** → **Create inline policy**
5. Use the JSON editor and paste the correct policy (from Option 1 above)
6. Name it `AllowS3TravelAppStorage`
7. Click **Create policy**

## 🔍 Also Check These Other Policies

While `AllowS3TravelAppStorage` is the most likely culprit, also check:

1. **AWSCompromisedKeyQuarant...** - This AWS managed policy might have deny statements
2. **AdministratorAccess** - Unlikely but possible
3. **IAMUserChangePassword** - Unlikely to affect S3

To check each:
- Click on the policy name
- Go to **JSON** tab
- Search for `"Effect": "Deny"` and `s3:GetObject`

## ⚠️ Important Notes

1. **Explicit Deny Always Wins**: Even if you have `AdministratorAccess` (which allows everything), an explicit Deny will block access.

2. **Policy Propagation**: After making changes, wait 10-30 seconds before testing.

3. **Test After Fix**: 
   - Wait 30 seconds
   - Restart your dev server
   - Clear browser cache
   - Reload the operator dashboard

## 📸 What I See in Your Screenshots

From your screenshots, I can confirm:
- ✅ CORS is properly configured
- ✅ No bucket policy (so the deny isn't there)
- ✅ Bucket owner enforced (ACLs disabled)
- ✅ Block public access is ON (this is fine for presigned URLs)
- ⚠️ **The inline policy `AllowS3TravelAppStorage` needs to be checked**

The deny is almost certainly in that inline policy. Please click on it and share the JSON content, or remove the deny statement if you find one.

