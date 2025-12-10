# Fix: Database Connection Timeout Error

## Problem Identified ✅

**From CloudWatch Logs:**

1. ✅ **reCAPTCHA is working!** (Success: true)
2. ❌ **Secrets Manager JSON parsing error**: `Unexpected token 'ï', "ï»¿{"SUPAB"... is not valid JSON`
   - **Cause**: UTF-8 BOM (Byte Order Mark) in the secret
   - **Fix**: Strip BOM before parsing JSON ✅ (Fixed in code)

3. ❌ **Database connection timeout**: `connect ETIMEDOUT 98.86.100.70:5432`
   - **Cause**: Wrong database host or network/security group issue
   - **IP `98.86.100.70`** doesn't look like a valid RDS endpoint

---

## Issue 1: Secrets Manager BOM Error (FIXED ✅)

**Error**: `Unexpected token 'ï', "ï»¿{"SUPAB"... is not valid JSON`

**Root Cause**: The secret in AWS Secrets Manager has a UTF-8 BOM (Byte Order Mark) at the start.

**Fix Applied**: Updated `src/lib/aws/secrets.ts` to strip BOM before parsing JSON.

**Status**: ✅ Fixed in code (needs redeploy)

---

## Issue 2: Database Connection Timeout (NEEDS FIX)

**Error**: `connect ETIMEDOUT 98.86.100.70:5432`

**Root Cause**: 
- The database host `98.86.100.70` is not a valid RDS endpoint
- RDS endpoints usually look like: `your-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com`
- This IP might be:
  - Wrong value in Secrets Manager
  - Wrong value in environment variables
  - Network/security group blocking connection

---

## Solution: Fix Database Configuration

### Step 1: Verify RDS Endpoint

**In AWS RDS Console:**

1. **Go to**: AWS RDS Console
   - https://console.aws.amazon.com/rds

2. **Select**: Your database instance

3. **Check**: The **Endpoint** field
   - Should look like: `travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com`
   - NOT an IP address like `98.86.100.70`

4. **Copy**: The correct endpoint

---

### Step 2: Update Secrets Manager

**The secret `travel-app/dev/secrets` needs to be fixed:**

1. **Go to**: AWS Secrets Manager Console
   - https://console.aws.amazon.com/secretsmanager

2. **Find**: Secret named `travel-app/dev/secrets`

3. **Click**: **"Retrieve secret value"**

4. **Check**: The `RDS_HOST` or `RDS_HOSTNAME` value
   - Should be the RDS endpoint (not IP)
   - Should NOT have BOM characters

5. **If wrong**:
   - Click **"Edit"**
   - Update `RDS_HOST` or `RDS_HOSTNAME` to the correct RDS endpoint
   - Make sure there are no BOM characters
   - Save

---

### Step 3: Update Environment Variables (Fallback)

**If Secrets Manager fails, it falls back to env vars:**

1. **Go to**: AWS Amplify Console → Environment variables

2. **Check**: These variables:
   - `RDS_HOST` or `RDS_HOSTNAME` = Should be RDS endpoint (not IP)
   - `RDS_PORT` = `5432` (default PostgreSQL port)
   - `RDS_USER` = Your database username
   - `RDS_PASSWORD` = Your database password
   - `RDS_DB` or `RDS_DATABASE` = Your database name

3. **Update**: If `RDS_HOST` is set to `98.86.100.70`, change it to the RDS endpoint

---

### Step 4: Check Security Groups

**If the endpoint is correct but still timing out:**

1. **Go to**: AWS RDS Console → Your database → **Connectivity & security**

2. **Check**: **VPC security groups**

3. **Verify**: The security group allows:
   - **Inbound**: Port `5432` from your Amplify/Lambda security group
   - **Source**: Your Amplify app's security group or VPC

4. **If needed**: Add a rule to allow PostgreSQL (port 5432) from Amplify

---

## Quick Fix Steps

1. ✅ **Fixed BOM issue** in code (needs redeploy)
2. ⏳ **Check RDS endpoint** in RDS Console
3. ⏳ **Update Secrets Manager** secret with correct endpoint
4. ⏳ **Update Amplify env vars** (if using fallback)
5. ⏳ **Check security groups** (if still timing out)
6. ⏳ **Redeploy app**
7. ⏳ **Test again**

---

## Expected RDS Configuration

**Correct format:**
```json
{
  "RDS_HOST": "travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com",
  "RDS_PORT": "5432",
  "RDS_USER": "postgres",
  "RDS_PASSWORD": "your-password",
  "RDS_DATABASE": "postgres"
}
```

**Wrong format:**
```json
{
  "RDS_HOST": "98.86.100.70",  // ❌ IP address, not endpoint
  ...
}
```

---

## Summary

**Issues Found:**
1. ✅ Secrets Manager BOM error (fixed in code)
2. ❌ Database connection timeout (wrong host/IP)

**Next Steps:**
1. Verify RDS endpoint is correct
2. Update Secrets Manager or env vars
3. Check security groups
4. Redeploy and test

---

**The BOM fix is done. Now we need to fix the database host configuration!**
