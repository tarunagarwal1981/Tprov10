# SES Domain Verification - Add DNS Records in AWS Route 53

## Quick Answer

**✅ Add DNS records in AWS Route 53** (your domain is using AWS nameservers)
**❌ NOT in Hostinger** (Hostinger shows warning: domain not pointing to Hostinger)

---

## What Your Screenshot Shows

Your domain `travelselbuy.com` is using **AWS Route 53** nameservers:
- `ns-1351.awsdns-40.org`
- `ns-19.awsdns-02.com`
- `ns-2011.awsdns-59.co.uk`
- `ns-686.awsdns-21.net`

**This means**: DNS records must be added in **AWS Route 53**, not Hostinger.

---

## Step-by-Step: Add DNS Records in AWS Route 53

### Step 1: Go to AWS Route 53 Console

1. **Go to**: https://console.aws.amazon.com/route53
   - Or search "Route 53" in AWS Console

2. **Click**: **"Hosted zones"** in left sidebar

3. **Find**: `travelselbuy.com` in the list
   - If you don't see it, you may need to create a hosted zone first

### Step 2: Add DKIM Records (3 CNAME Records)

**From your SES screenshot, add these 3 CNAME records:**

1. **Click**: **"Create record"** button

2. **First DKIM Record:**
   - **Record name**: `zo3v2ihczrihh3r7vw6ta3lhkihgkewo._domainkey.travelselbuy.com`
     - (Route 53 may auto-complete the domain, so you might just need: `zo3v2ihczrihh3r7vw6ta3lhkihgkewo._domainkey`)
   - **Record type**: Select **"CNAME - Routes traffic to another domain name"**
   - **Value**: `zo3v2ihczrihh3r7vw6ta3lhkihgkewo.dkim.amazonses.com`
   - **TTL**: `300` (or leave default)
   - **Click**: **"Create records"**

3. **Repeat for Second DKIM Record:**
   - **Record name**: `ze6wxupvd45qjotznnzia2j7hpsgfbls._domainkey`
   - **Record type**: **CNAME**
   - **Value**: `ze6wxupvd45qjotznnzia2j7hpsgfbls.dkim.amazonses.com`
   - **Click**: **"Create records"**

4. **Repeat for Third DKIM Record:**
   - **Record name**: `c6oxbfldjwzxnbgtnbto2jho64jdmwaw._domainkey`
   - **Record type**: **CNAME**
   - **Value**: `c6oxbfldjwzxnbgtnbto2jho64jdmwaw.dkim.amazonses.com`
   - **Click**: **"Create records"**

### Step 3: Add DMARC Record (1 TXT Record)

1. **Click**: **"Create record"** button

2. **DMARC Record:**
   - **Record name**: `_dmarc`
   - **Record type**: Select **"TXT - Text record"**
   - **Value**: `"v=DMARC1; p=none;"`
     - **Important**: Include the quotes in the value
   - **TTL**: `300` (or leave default)
   - **Click**: **"Create records"**

### Step 4: Wait for DNS Propagation

1. **DNS changes are usually instant** in Route 53 (since it's AWS)
2. **Check verification status** in SES Console:
   - Go to: https://console.aws.amazon.com/ses/home?region=us-east-1
   - Click: **"Verified identities"**
   - Find: `travelselbuy.com`
   - Status should change from **"Pending verification"** to **"Verified"** within 5-15 minutes

---

## If You Don't See Route 53 Hosted Zone

**If `travelselbuy.com` is not in Route 53 hosted zones:**

### Option A: Create Hosted Zone (If Domain Should Use Route 53)

1. **In Route 53 Console**: Click **"Create hosted zone"**
2. **Domain name**: Enter `travelselbuy.com`
3. **Type**: **Public hosted zone**
4. **Click**: **"Create hosted zone"**
5. **Update nameservers in Hostinger**:
   - Route 53 will show you 4 nameservers
   - Go back to Hostinger → DNS / Nameservers
   - Click **"Change Nameservers"**
   - Enter the Route 53 nameservers
   - **Note**: This will change your DNS management to Route 53 (which it already is based on your screenshot)

### Option B: Use Current Setup (If Nameservers Already Point to Route 53)

If your nameservers already point to Route 53 (as shown in your screenshot), the hosted zone should already exist. If you can't find it:

1. **Check if it's in a different AWS account**
2. **Or contact AWS Support** to locate the hosted zone

---

## Verify Records Are Added Correctly

### In Route 53:
1. Go to: **Route 53 Console** → **Hosted zones** → `travelselbuy.com`
2. Check that all 3 CNAME records are listed (with `._domainkey` in the name)
3. Check that the TXT record for `_dmarc` is listed

### In AWS SES:
1. Go to: https://console.aws.amazon.com/ses/home?region=us-east-1
2. Click: **"Verified identities"**
3. Find: `travelselbuy.com`
4. Click on it to see verification status
5. If verified, you'll see green checkmarks ✅

---

## Alternative: Verify Email Address First (Faster for Testing)

**If you want to test immediately without waiting for DNS:**

1. **In SES Console**: Go to **"Verified identities"**
2. **Click**: **"Create identity"**
3. **Choose**: **"Email address"** (instead of Domain)
4. **Enter**: `tarunag.in@gmail.com`
5. **Click**: **"Create identity"**
6. **Check your email** and click the verification link
7. **Done!** You can now send emails from this address

**Then later**, you can verify the domain for production use.

---

## What Each Record Does

### DKIM Records (CNAME)
- **Purpose**: Proves emails are authentic and not forged
- **Why 3 records**: AWS uses multiple keys for redundancy
- **Required**: Yes, for domain verification

### DMARC Record (TXT)
- **Purpose**: Tells email servers how to handle emails from your domain
- **Value `p=none`**: Monitor mode (doesn't reject emails, just reports)
- **Required**: Recommended for better email deliverability

---

## Troubleshooting

### Records Not Verifying? (Most Common Issues)

#### Issue 1: Double Domain Name (Most Likely Problem!)

**If you manually entered the full domain name, Route 53 might have created:**
- ❌ **Wrong**: `zo3v2ihczrihh3r7vw6ta3lhkihgkewo._domainkey.travelselbuy.com.travelselbuy.com` (double domain)
- ✅ **Correct**: `zo3v2ihczrihh3r7vw6ta3lhkihgkewo._domainkey.travelselbuy.com` (single domain)

**How to check:**
1. Go to Route 53 → Hosted zones → `travelselbuy.com`
2. Look at your CNAME records
3. If you see `.travelselbuy.com.travelselbuy.com` (double domain), that's the problem!

**How to fix:**
1. Delete the incorrect records
2. Create new records with **just the subdomain** (Route 53 will auto-add the domain):
   - Record name: `zo3v2ihczrihh3r7vw6ta3lhkihgkewo._domainkey` (NO `.travelselbuy.com`)
   - Route 53 will automatically make it: `zo3v2ihczrihh3r7vw6ta3lhkihgkewo._domainkey.travelselbuy.com`

#### Issue 2: Check Record Names

1. **Go to Route 53 Console** → Hosted zones → `travelselbuy.com`
2. **Check your CNAME records** - they should show:
   - `zo3v2ihczrihh3r7vw6ta3lhkihgkewo._domainkey.travelselbuy.com` (NOT double domain)
   - `ze6wxupvd45qjotznnzia2j7hpsgfbls._domainkey.travelselbuy.com`
   - `c6oxbfldjwzxnbgtnbto2jho64jdmwaw._domainkey.travelselbuy.com`
3. **Check your TXT record**:
   - `_dmarc.travelselbuy.com` (NOT double domain)

#### Issue 3: Check Record Values

1. **DKIM CNAME values** should be:
   - `zo3v2ihczrihh3r7vw6ta3lhkihgkewo.dkim.amazonses.com`
   - `ze6wxupvd45qjotznnzia2j7hpsgfbls.dkim.amazonses.com`
   - `c6oxbfldjwzxnbgtnbto2jho64jdmwaw.dkim.amazonses.com`
   - **NO trailing dots or extra characters**

2. **DMARC TXT value** should be:
   - `"v=DMARC1; p=none;"` (with quotes)
   - **OR** `v=DMARC1; p=none;` (without quotes - Route 53 may strip them)

#### Issue 4: Wait Longer

- **Route 53**: Changes are usually instant
- **SES Verification**: Can take **5-30 minutes** (sometimes up to 1 hour)
- **DNS Propagation**: Can take up to 48 hours globally (but usually 15-30 minutes)

**If it's been 10-15 minutes, wait another 15-20 minutes before troubleshooting further.**

#### Issue 5: Verify in SES Console

1. **Go to**: SES Console → Verified identities → `travelselbuy.com`
2. **Click on the domain** to see detailed verification status
3. **Check which records are verified**:
   - DKIM: Should show 3/3 verified ✅
   - Domain verification: Should show verified ✅
4. **If some records show as "Pending"**, check those specific records in Route 53

#### Issue 6: Test DNS Records Manually

**Use online DNS checker to verify records are live:**

1. **Go to**: https://mxtoolbox.com/SuperTool.aspx
2. **Select**: "CNAME Lookup"
3. **Enter**: `zo3v2ihczrihh3r7vw6ta3lhkihgkewo._domainkey.travelselbuy.com`
4. **Check**: Should return `zo3v2ihczrihh3r7vw6ta3lhkihgkewo.dkim.amazonses.com`
5. **Repeat** for all 3 DKIM records

**For DMARC:**
1. **Select**: "TXT Lookup"
2. **Enter**: `_dmarc.travelselbuy.com`
3. **Check**: Should return `v=DMARC1; p=none;`

#### Issue 7: Verify You're in Correct Hosted Zone

1. **Check the hosted zone name** matches exactly: `travelselbuy.com`
2. **Check nameservers** match what's in Hostinger:
   - `ns-1351.awsdns-40.org`
   - `ns-19.awsdns-02.com`
   - `ns-2011.awsdns-59.co.uk`
   - `ns-686.awsdns-21.net`

### Still Not Working After 30 Minutes?

**Step-by-step verification:**

1. **Delete all SES DNS records** in Route 53
2. **Recreate them carefully**:
   - For DKIM: Enter **ONLY** `zo3v2ihczrihh3r7vw6ta3lhkihgkewo._domainkey` (let Route 53 add `.travelselbuy.com`)
   - For DMARC: Enter **ONLY** `_dmarc` (let Route 53 add `.travelselbuy.com`)
3. **Wait 15-30 minutes**
4. **Check verification status** in SES Console

**Quick workaround for immediate testing:**
- Verify email address `tarunag.in@gmail.com` instead (takes 2 minutes)
- Use this for testing while domain verification completes
- You can verify both email AND domain (they work independently)

---

## After Domain Verification

Once `travelselbuy.com` is verified:

1. ✅ You can send emails from **any address** on your domain (e.g., `noreply@travelselbuy.com`, `support@travelselbuy.com`)
2. ✅ Better email deliverability
3. ✅ Professional email addresses
4. ✅ Ready for production use

**Update environment variable:**
- In Amplify, set: `SES_FROM_EMAIL=noreply@travelselbuy.com` (or any address on your domain)

---

## Summary

**What to do:**
1. ✅ Go to **AWS Route 53 Console** (not Hostinger)
2. ✅ Find or create hosted zone for `travelselbuy.com`
3. ✅ Add **3 CNAME records** (DKIM) from SES screenshot
4. ✅ Add **1 TXT record** (DMARC) from SES screenshot
5. ✅ Wait 5-15 minutes for verification
6. ✅ Check verification status in SES Console

**OR (for immediate testing):**
- Verify email address `tarunag.in@gmail.com` instead (faster, but limited to one address)

---

**Add the DNS records in AWS Route 53 now, and your domain will be verified within 5-15 minutes!**
