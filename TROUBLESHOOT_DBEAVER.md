# Troubleshoot DBeaver Connection (Security Group is Correct)

Your security group rules are correct - port 5432 is open. Let's check other possible issues:

## Issue 1: RDS Public Accessibility

The RDS instance might not be set to "Publicly accessible".

**Check:**
1. Go to AWS RDS Console → Your instance (`travel-app-db`)
2. Go to **Connectivity & security** tab
3. Look for **Publicly accessible**
4. It should say **Yes**

**If it says "No":**
- Click **Modify** button
- Scroll to **Connectivity**
- Set **Publicly accessible** to **Yes**
- Click **Continue** → **Apply immediately**
- Wait 5-10 minutes for the change to take effect

## Issue 2: DBeaver Connection Settings

Double-check your DBeaver connection settings:

1. **Right-click connection** → **Edit Connection**

2. **Main Tab:**
   - **Host**: `travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **Username**: `postgres`
   - **Password**: `ju3vrLHJUW8PqDG4`
   - **Show all databases**: Unchecked (unless you want to see all)

3. **SSL Tab** (Important!):
   - ✅ Check **Use SSL**
   - ✅ Check **Allow SSL self-signed certificate**
   - SSL Mode: **require** or **prefer**

4. **Test Connection**
   - Click **Test Connection** button
   - Check the error message if it fails

## Issue 3: Network ACLs

Network ACLs can also block traffic (in addition to security groups).

**Check:**
1. Go to AWS VPC Console
2. Find your RDS instance's subnet
3. Check Network ACLs for that subnet
4. Ensure inbound rules allow port 5432

## Issue 4: Local Firewall

Your local Windows firewall might be blocking the connection.

**Check:**
1. Windows Security → Firewall & network protection
2. Check if PostgreSQL or port 5432 is blocked
3. Temporarily disable firewall to test (remember to re-enable!)

## Issue 5: RDS Endpoint

Verify the RDS endpoint is correct:

1. AWS RDS Console → Your instance
2. **Connectivity & security** tab
3. Copy the **Endpoint** (should be: `travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com`)
4. Make sure it matches what you're using in DBeaver

## Issue 6: Connection Timeout Value

Increase the connection timeout in DBeaver:

1. **Edit Connection** → **Driver properties** tab
2. Add property:
   - **Name**: `connectTimeout`
   - **Value**: `30`
3. Or in **Main** tab, check **Show all databases** and look for timeout settings

## Quick Test: Try from Command Line

If you have `psql` installed, test from command line:

```powershell
# Test connection
psql -h travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com -U postgres -d postgres -p 5432
```

If this works but DBeaver doesn't, it's a DBeaver configuration issue.

## Most Likely Issues (In Order)

1. **RDS not publicly accessible** (most common)
2. **SSL not enabled in DBeaver** (very common)
3. **Wrong hostname/endpoint**
4. **Local firewall blocking**

## Step-by-Step Fix

1. ✅ **Check RDS Public Accessibility** (most important!)
2. ✅ **Enable SSL in DBeaver** (SSL tab → Use SSL + Allow self-signed)
3. ✅ **Verify hostname matches RDS endpoint exactly**
4. ✅ **Test connection again**

---

**After fixing, you should be able to connect and run the migration!**

