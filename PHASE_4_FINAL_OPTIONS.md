# Phase 4: Final Options - Choose Your Path 🔀

## Current Situation

- ✅ EC2 Instance Created: `i-056a065313dae8712`
- ✅ SQL Script Ready: Uploaded to S3
- ⚠️ EC2 Instance Connect: Having connection issues
- ⚠️ SSM Agent: Not registering yet

---

## 🎯 Option 1: API Route (Easiest - Recommended!)

**Why:** No EC2 connection needed, works from Amplify which has VPC access.

### Steps:

1. **Add environment variables to Amplify** (if not already):
   - Go to Amplify Console → Your App → Environment variables
   - Add RDS connection variables

2. **Wait for deployment** (5-10 minutes)

3. **Call API route from browser:**
   ```javascript
   fetch('/api/admin/update-urls', { method: 'POST' })
     .then(r => r.json())
     .then(console.log);
   ```

**Advantages:**
- ✅ No EC2 needed
- ✅ No connection issues
- ✅ Works immediately after deployment
- ✅ Can verify in browser console

---

## 🎯 Option 2: Fix EC2 Connection

### Try These:

1. **Wait 2-3 minutes** - Instance may need more time to initialize

2. **Try EC2 Instance Connect again:**
   - SSH access is now open (0.0.0.0/0)
   - Should work now

3. **Restart instance** (if still failing):
   ```bash
   aws ec2 reboot-instance --instance-ids i-056a065313dae8712
   ```
   Wait 2 minutes, then try connecting again

4. **Once connected, run:**
   ```bash
   aws s3 cp s3://travel-app-storage-1769/migration/update-urls.sql /tmp/
   export PGPASSWORD='ju3vrLHJUW8PqDG4'
   psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com --port=5432 --username=postgres --dbname=postgres --file=/tmp/update-urls.sql
   ```

---

## 🎯 Option 3: Use CloudShell (If Available)

If your CloudShell has VPC access:

```bash
# Download script
aws s3 cp s3://travel-app-storage-1769/migration/update-urls.sql .

# Run update
export PGPASSWORD='ju3vrLHJUW8PqDG4'
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com --port=5432 --username=postgres --dbname=postgres --file=update-urls.sql
```

---

## 💡 Recommendation

**Use Option 1 (API Route)** - It's the easiest and most reliable!

The API route is already created at `src/app/api/admin/update-urls/route.ts`. Just:
1. Deploy to Amplify
2. Call it from browser
3. Done!

---

**Which option would you like to use?** 🚀

