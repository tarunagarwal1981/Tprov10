# Block Public Access vs IAM Deny Policy

## Two Different Things

### 1. "Block Public Access" (S3 Bucket Setting) ✅ CORRECT

**Location**: S3 Bucket → Permissions → Block public access

**What it does**: Prevents the bucket from being publicly accessible

**Status**: ✅ **Keep this ON** - This is correct and secure!

**Does it affect presigned URLs?**: ❌ **NO** - Presigned URLs work fine with "Block public access" enabled. Presigned URLs are temporary, signed URLs that bypass public access restrictions.

---

### 2. IAM Deny Policy (The Real Problem) ❌ NEEDS FIXING

**Location**: IAM → Users → tarunagarwal → Permissions

**What it does**: Explicitly denies the IAM user permission to access S3 objects

**Status**: ❌ **This is blocking access** - Needs to be removed or updated

**Error**: 
```
User: tarunagarwal is not authorized to perform: s3:GetObject 
with an explicit deny in an identity-based policy
```

---

## What You Need to Do

### ✅ Keep "Block Public Access" ON
- Don't change this
- It's a security best practice
- Presigned URLs work with it enabled

### ❌ Fix the IAM Deny Policy
- Go to IAM Console
- Find the deny policy on user `tarunagarwal`
- Remove or update it to allow access to `travel-app-storage-1769`

---

## Step-by-Step: Fix IAM Permissions

### Step 1: Go to IAM (Not S3)

1. Go to: https://console.aws.amazon.com/iam/
2. Click **Users** in left sidebar
3. Click on: **tarunagarwal**

### Step 2: Check Permissions Tab

1. Click **Permissions** tab
2. Look for policies that have **"Deny"** in them
3. These are separate from "Block public access" in S3

### Step 3: Remove Deny Policy

1. Find policy that denies `s3:GetObject`
2. Click **Detach** or **Remove**
3. This is different from the S3 "Block public access" setting

### Step 4: Add Allow Policy

After removing deny, add an allow policy:

1. Click **Add permissions** → **Attach policies directly**
2. Create policy allowing:
   - `s3:GetObject` on `arn:aws:s3:::travel-app-storage-1769/*`
   - `s3:PutObject` on `arn:aws:s3:::travel-app-storage-1769/*`

---

## Summary

| Setting | Location | Status | Action |
|---------|----------|--------|--------|
| Block Public Access | S3 Bucket | ✅ ON | **Keep it ON** |
| IAM Deny Policy | IAM User | ❌ Blocking | **Remove/Update it** |

---

## Visual Guide

```
S3 Console (travel-app-storage-1769)
├── Block public access: ON  ← ✅ Keep this ON
└── CORS: Configured         ← ✅ Already done

IAM Console (tarunagarwal)
├── Permissions policies
│   └── [Some Deny Policy]   ← ❌ Remove this!
└── Add Allow Policy         ← ✅ Add this
```

---

## Key Point

**"Block public access" is NOT the problem.** It's a bucket-level security setting that should stay enabled. The problem is an **IAM user-level deny policy** that's blocking the user from accessing objects, even with presigned URLs.

Presigned URLs work with private buckets (block public access ON), but they still require the IAM user to have permission to access the objects.
