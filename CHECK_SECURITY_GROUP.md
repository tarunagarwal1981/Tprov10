# Check Security Group Rules for PostgreSQL

## Current Situation

You have a security group `rds-sg (sg-0351956ce61a8d1f1)` with these rules visible:
- `10.0.0.0/16` (VPC internal range)
- `0.0.0.0/0` (Public - allows from anywhere)
- `223.178.84.95/32` (Specific IP - might be yours)

**However**, the table you're seeing doesn't show the **PORT** or **PROTOCOL** for these rules.

## The Problem

The connection timeout suggests that **port 5432 (PostgreSQL) is not open** in the security group, even though `0.0.0.0/0` exists.

The `0.0.0.0/0` rule might be for:
- A different port (e.g., 80, 443, 22)
- A different protocol
- Or it might not include port 5432

## How to Check

1. **Click on the security group link**: `rds-sg (sg-0351956ce61a8d1f1)`
   - This takes you to the EC2 Security Groups console

2. **Go to "Inbound rules" tab**

3. **Look for a rule with:**
   - **Type**: PostgreSQL (or Custom TCP)
   - **Port**: 5432
   - **Source**: Any of the IPs shown (0.0.0.0/0, 10.0.0.0/16, or 223.178.84.95/32)

## What You Should See

If PostgreSQL is properly configured, you should see something like:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| PostgreSQL | TCP | 5432 | 0.0.0.0/0 | Allow PostgreSQL |
| PostgreSQL | TCP | 5432 | 10.0.0.0/16 | VPC access |
| PostgreSQL | TCP | 5432 | 223.178.84.95/32 | Your IP |

## If Port 5432 is Missing

If you don't see a rule for port 5432, you need to add it:

1. **Click "Edit inbound rules"**

2. **Click "Add rule"**

3. **Configure:**
   - **Type**: PostgreSQL (or select "Custom TCP")
   - **Protocol**: TCP
   - **Port range**: `5432`
   - **Source**: 
     - Option A: `0.0.0.0/0` (allows from anywhere - less secure)
     - Option B: `223.178.84.95/32` (your specific IP - more secure)
   - **Description**: `PostgreSQL access for migration`

4. **Click "Save rules"**

5. **Wait 30 seconds** for changes to propagate

6. **Try DBeaver connection again**

## Security Recommendation

**Best Practice:** Use your specific IP (`223.178.84.95/32`) instead of `0.0.0.0/0` for port 5432.

- More secure (only your IP can connect)
- Still allows you to run the migration
- You can remove it after migration

## Alternative: Check Network ACLs

If the security group looks correct but you still can't connect:

1. **Check Network ACLs** (in VPC Console)
   - Network ACLs can also block traffic
   - They're like an additional firewall layer

2. **Check Route Tables**
   - Ensure routes are configured correctly

3. **Check RDS Public Accessibility**
   - RDS Console → Your instance → Connectivity & security
   - Check if "Publicly accessible" is set to "Yes"
   - If "No", you can only connect from within the VPC

## Quick Test

After adding the rule, test the connection:

```bash
# From command line (if you have psql installed)
psql -h travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com -U postgres -d postgres
```

Or test in DBeaver.

---

**Summary:**
- The `0.0.0.0/0` rule exists, but we need to verify it includes port 5432
- Click on the security group to see the full details
- If port 5432 is missing, add it
- Use your specific IP (`223.178.84.95/32`) for better security

