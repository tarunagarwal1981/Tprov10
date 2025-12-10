# Fix DBeaver Connection Timeout

The connection timeout means your IP address is not allowed in the RDS security group. Here's how to fix it:

## Step 1: Find Your Current IP Address

**Option A: From Browser**
1. Go to: https://whatismyipaddress.com/
2. Copy your **IPv4 address** (e.g., `203.0.113.42`)

**Option B: From Command Line**
```powershell
# PowerShell
(Invoke-WebRequest -Uri "https://api.ipify.org").Content
```

## Step 2: Update RDS Security Group

1. **Go to AWS RDS Console**
   - Open: https://console.aws.amazon.com/rds/
   - Make sure you're in the correct region (us-east-1)

2. **Select Your Database Instance**
   - Click on: `travel-app-db` (or your RDS instance name)
   - You should see it in the list

3. **Open Security Group**
   - Scroll down to **Connectivity & security** section
   - Find **VPC security groups**
   - Click on the security group link (e.g., `sg-0123456789abcdef0`)
   - This opens the EC2 Security Groups console

4. **Edit Inbound Rules**
   - In the Security Group page, go to **Inbound rules** tab
   - Click **Edit inbound rules** button

5. **Add New Rule**
   - Click **Add rule** button
   - Configure:
     - **Type**: Select **PostgreSQL** (or **Custom TCP**)
     - **Protocol**: TCP
     - **Port range**: `5432`
     - **Source**: 
       - Select **My IP** (if available) OR
       - Select **Custom** and enter your IP with `/32` (e.g., `203.0.113.42/32`)
     - **Description**: `Temporary migration access - [Your Name] - [Date]`

6. **Save Rules**
   - Click **Save rules** button
   - Wait a few seconds for the change to propagate

## Step 3: Try DBeaver Connection Again

1. **Go back to DBeaver**
2. **Test the connection**:
   - Right-click your connection → **Edit Connection**
   - Click **Test Connection** button
   - It should now connect successfully! ✅

3. **If still timing out:**
   - Wait 30-60 seconds (security group changes take a moment to propagate)
   - Check that you entered the correct IP address
   - Verify the security group is attached to your RDS instance

## Step 4: Enable SSL (If Needed)

Some RDS instances require SSL. In DBeaver:

1. **Edit Connection** → Go to **SSL** tab
2. Check **Use SSL**
3. Check **Allow SSL self-signed certificate**
4. Click **Test Connection**

## Step 5: Run the Migration

Once connected:

1. **Open SQL File**
   - File → Open File
   - Navigate to: `migrations/001_phone_auth_schema.sql`

2. **Execute**
   - Make sure you're connected to the correct database (`postgres`)
   - Click **Execute SQL Script** button (or `Ctrl+Alt+X`)
   - Review results in the Scripts tab

3. **Verify**
   - Run the verification queries from the guide

## Step 6: Remove Security Group Rule (IMPORTANT!)

**⚠️ Security Best Practice:** Remove your IP after migration

1. Go back to the Security Group
2. **Edit inbound rules**
3. Find the rule you just added
4. Click **Delete** (trash icon)
5. Click **Save rules**

## Troubleshooting

### Still Getting Timeout?

1. **Check IP Address**
   - Your IP might have changed (if using dynamic IP)
   - Get your current IP again and update the rule

2. **Check Security Group**
   - Make sure you edited the security group that's attached to your RDS instance
   - RDS instance → Connectivity & security → Check which security group is listed

3. **Check Network**
   - Are you on a VPN? You may need to add the VPN's IP range
   - Are you behind a corporate firewall? You may need to add the corporate IP range

4. **Try Different Port**
   - Some networks block port 5432
   - You might need to use an SSH tunnel (more complex)

### Connection Works But SSL Error?

Enable SSL in DBeaver:
- Connection → SSL tab → Check "Use SSL" and "Allow SSL self-signed certificate"

### Can't Find Security Group?

1. In RDS Console, your instance shows the security group name
2. Click on it - it's a link that takes you to EC2 Security Groups
3. Or go directly to EC2 Console → Security Groups

## Alternative: Use EC2 Instance

If you have an EC2 instance in the same VPC:
- You can SSH into it and run the migration from there
- No security group changes needed
- More secure approach

---

**Quick Checklist:**
- [ ] Found my IP address
- [ ] Updated RDS security group inbound rules
- [ ] Added PostgreSQL port 5432 from my IP
- [ ] Waited 30 seconds for propagation
- [ ] Tested connection in DBeaver
- [ ] Enabled SSL if needed
- [ ] Ran migration
- [ ] Removed security group rule (for security)

