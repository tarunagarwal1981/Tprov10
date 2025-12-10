# Run Migration via SSH to EC2

## ✅ Setup Complete

- **EC2 Instance**: `i-001e8584b160a315e`
- **EC2 Public IP**: `98.86.31.239`
- **EC2 Private IP**: `10.0.1.57`
- **SSH Port**: 22 (open)
- **Key Name**: `migration-key`
- **RDS Endpoint**: `travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com:5432`

## Step 1: Get SSH Key

You need the `migration-key.pem` file. If you don't have it:

1. Go to **AWS Console → EC2 → Key Pairs**
2. Find `migration-key`
3. If it exists, you should have downloaded it when created
4. If not, we'll need to create a new key pair

**OR** if you have access to the key file from when we created it earlier, use that.

## Step 2: Set Key Permissions (Windows)

```powershell
# Navigate to where your .pem file is
cd C:\Users\train\.cursor\Tprov10

# Set permissions (if needed)
icacls migration-key.pem /inheritance:r
icacls migration-key.pem /grant:r "%USERNAME%:R"
```

## Step 3: SSH into EC2

```powershell
ssh -i migration-key.pem ec2-user@98.86.31.239
```

**Note**: If you get "Permission denied", the key might not exist. We can create a new one.

## Step 4: Once Connected to EC2

The EC2 instance is in the same VPC as RDS, so it can connect directly using the **private endpoint**:

```bash
# Install PostgreSQL client
sudo yum install -y postgresql15

# Set password
export PGPASSWORD='ju3vrLHJUW8PqDG4'

# Test connection (using private endpoint - faster!)
psql -h travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com -U postgres -d postgres -c "SELECT version();"
```

## Step 5: Run Migration

You have two options:

### Option A: Copy-Paste Migration Script

1. On your **laptop**, open `run-migration-on-ec2.sh`
2. Copy the entire content (Ctrl+A, Ctrl+C)
3. In the **EC2 SSH terminal**, create the file:
   ```bash
   nano migration.sql
   ```
4. Paste the SQL content (the part between `<< 'MIGRATION_SQL'` and `MIGRATION_SQL`)
5. Save (Ctrl+O, Enter, Ctrl+X)
6. Run:
   ```bash
   export PGPASSWORD='ju3vrLHJUW8PqDG4'
   psql -h travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com -U postgres -d postgres -f migration.sql
   ```

### Option B: Use the Full Script

1. Copy the entire `run-migration-on-ec2.sh` content
2. In EC2 terminal, paste and run it directly

## Step 6: Verify Migration

```bash
psql -h travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com -U postgres -d postgres -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('otp_codes', 'account_details', 'brand_details', 'business_details', 'documents', 'otp_rate_limits') ORDER BY table_name;"
```

You should see all 6 new tables listed.

## Alternative: SSH Tunnel for DBeaver

If you want to use DBeaver through the EC2 tunnel:

### On Your Laptop (PowerShell):

```powershell
ssh -i migration-key.pem -L 5433:travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com:5432 ec2-user@98.86.31.239 -N
```

Keep this terminal open.

### In DBeaver:

- **Host**: `localhost`
- **Port**: `5433`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `ju3vrLHJUW8PqDG4`

---

## Troubleshooting

### "Permission denied (publickey)"
- Check key file path is correct
- Verify key file permissions
- Make sure you're using `ec2-user` (Amazon Linux) or `ubuntu` (Ubuntu)

### "Connection timed out"
- Check if port 22 is open in your firewall
- Verify EC2 security group allows SSH from your IP
- Try from a different network

### "Key file not found"
- Download the key from AWS Console → EC2 → Key Pairs
- Or we can create a new key pair

---

**Ready to proceed?** Let me know if you have the `migration-key.pem` file or if we need to create/download it.

