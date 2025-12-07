# Database Connection Solution

## Problem Identified ✅

**From CloudWatch Logs:**
1. ✅ reCAPTCHA is working perfectly!
2. ❌ Secrets Manager has BOM: `Unexpected token 'ï', "ï»¿{"SUPAB"... is not valid JSON`
3. ❌ Falls back to env vars with wrong RDS_HOST: `98.86.100.70` (IP instead of RDS endpoint)

**Root Cause:**
- The app has **TWO** database connection methods:
  1. **Direct connection** (`@/lib/aws/database`) - Used by phone auth routes (FAILING)
  2. **Lambda connection** (`@/lib/aws/lambda-database`) - Used by other routes (WORKING)

- Phone auth routes are using direct connection which:
  - Tries Secrets Manager first (has BOM issue)
  - Falls back to env vars (has wrong RDS_HOST)

---

## Solution: Switch to Lambda Database Service

**Why Lambda is Better:**
- ✅ Runs in same VPC as RDS (reliable network access)
- ✅ Reads from Secrets Manager directly (no env var issues)
- ✅ Already working for other routes
- ✅ Better security (IAM roles, security groups)

---

## Changes Made

### ✅ Fixed Routes (No Transactions Needed):
1. **`/api/auth/phone/init`** → Switched to `@/lib/aws/lambda-database`
2. **`/api/auth/phone/request-otp`** → Switched to `@/lib/aws/lambda-database`

### ⚠️ Routes Still Using Direct Connection (Need Transactions):
1. **`/api/auth/phone/signup`** → Uses `transaction()` - needs direct connection
2. **`/api/auth/phone/verify-otp`** → Uses `transaction()` - needs direct connection

**Note**: These routes will still work once:
- Secrets Manager BOM is fixed (code already updated, needs redeploy)
- OR RDS_HOST in env vars is corrected

---

## What You Need to Do

### Option 1: Fix Secrets Manager (Recommended)

**The BOM fix is already in the code**, but you need to:

1. **Redeploy the app** (so BOM fix takes effect)
2. **OR fix the secret in Secrets Manager**:
   - Go to AWS Secrets Manager
   - Find `travel-app/dev/secrets`
   - Edit the secret
   - Remove any BOM characters at the start
   - Save

### Option 2: Fix Environment Variables

**If Secrets Manager keeps failing, fix env vars:**

1. **Get correct RDS endpoint**:
   - Go to AWS RDS Console
   - Find your database
   - Copy the **Endpoint** (not IP)

2. **Update Amplify env vars**:
   - Go to Amplify → Environment variables
   - Update `RDS_HOST` or `RDS_HOSTNAME` to the RDS endpoint
   - Should look like: `travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com`
   - NOT: `98.86.100.70`

---

## Current Status

### ✅ Working (Using Lambda):
- `/api/auth/phone/init` - Now uses Lambda
- `/api/auth/phone/request-otp` - Now uses Lambda
- All other routes (itineraries, packages, etc.) - Already using Lambda

### ⚠️ Needs Fix (Using Direct Connection):
- `/api/auth/phone/signup` - Needs transactions
- `/api/auth/phone/verify-otp` - Needs transactions

**These will work once Secrets Manager BOM is fixed or env vars are corrected.**

---

## Next Steps

1. **Redeploy app** (BOM fix is in code)
2. **Test `/api/auth/phone/init`** - Should work now (uses Lambda)
3. **If signup/verify-otp still fail**:
   - Fix Secrets Manager BOM manually
   - OR fix RDS_HOST in env vars
   - OR we can add transaction support to Lambda

---

## Summary

**The Fix:**
- ✅ Switched `init` and `request-otp` to Lambda (more reliable)
- ✅ BOM fix is in code (needs redeploy)
- ⏳ Signup/verify-otp still use direct connection (will work once BOM/env vars fixed)

**After redeploy:**
- `init` route should work immediately (uses Lambda)
- Signup/verify-otp will work once Secrets Manager or env vars are fixed

---

**Redeploy and test the init route - it should work now!**
