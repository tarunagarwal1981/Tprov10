# SES Domain Verification - Add DNS Records in Hostinger

## ⚠️ IMPORTANT UPDATE

**Your domain is using AWS Route 53 nameservers, NOT Hostinger!**

Based on your screenshot, your domain `travelselbuy.com` has nameservers pointing to AWS:
- `ns-1351.awsdns-40.org`
- `ns-19.awsdns-02.com`
- `ns-2011.awsdns-59.co.uk`
- `ns-686.awsdns-21.net`

**This means**: You need to add DNS records in **AWS Route 53**, not Hostinger.

**See**: `SES_DOMAIN_VERIFICATION_ROUTE53.md` for the correct instructions.

---

## Quick Answer (If You Change Nameservers to Hostinger)

**✅ Add DNS records in Hostinger** (only if you change nameservers back to Hostinger)
**❌ NOT in Amplify** (Amplify doesn't manage your domain DNS)

---

## What You're Seeing

The SES console is showing DNS records that need to be added to verify your domain `travelselbuy.com`. These records prove you own the domain and allow SES to send emails from it.

**Three types of records:**
1. **DKIM Records** (3 CNAME records) - Email authentication
2. **MAIL FROM Records** (optional, but recommended)
3. **DMARC Record** (1 TXT record) - Email security policy

---

## Step-by-Step: Add DNS Records in Hostinger

### Step 1: Log into Hostinger

1. Go to: https://www.hostinger.com
2. Log into your account
3. Navigate to your domain: `travelselbuy.com`

### Step 2: Find DNS Management

1. In Hostinger dashboard, find **"Domains"** or **"DNS"** section
2. Click on **`travelselbuy.com`**
3. Look for **"DNS Zone"**, **"DNS Management"**, or **"Advanced DNS"**
4. Click to open DNS settings

### Step 3: Add DKIM Records (3 CNAME Records)

**From your SES screenshot, you need to add these 3 CNAME records:**

1. **First DKIM Record:**
   - **Type**: `CNAME`
   - **Name/Host**: `zo3v2ihczrihh3r7vw6ta3lhkihgkewo._domainkey`
   - **Value/Target**: `zo3v2ihczrihh3r7vw6ta3lhkihgkewo.dkim.amazonses.com`
   - **TTL**: `3600` (or leave default)

2. **Second DKIM Record:**
   - **Type**: `CNAME`
   - **Name/Host**: `ze6wxupvd45qjotznnzia2j7hpsgfbls._domainkey`
   - **Value/Target**: `ze6wxupvd45qjotznnzia2j7hpsgfbls.dkim.amazonses.com`
   - **TTL**: `3600` (or leave default)

3. **Third DKIM Record:**
   - **Type**: `CNAME`
   - **Name/Host**: `c6oxbfldjwzxnbgtnbto2jho64jdmwaw._domainkey`
   - **Value/Target**: `c6oxbfldjwzxnbgtnbto2jho64jdmwaw.dkim.amazonses.com`
   - **TTL**: `3600` (or leave default)

**How to add in Hostinger:**
1. Click **"Add Record"** or **"Add DNS Record"**
2. Select **"CNAME"** from Type dropdown
3. Enter the **Name** (e.g., `zo3v2ihczrihh3r7vw6ta3lhkihgkewo._domainkey`)
4. Enter the **Value** (e.g., `zo3v2ihczrihh3r7vw6ta3lhkihgkewo.dkim.amazonses.com`)
5. Click **"Save"** or **"Add"**
6. Repeat for all 3 DKIM records

### Step 4: Add DMARC Record (1 TXT Record)

1. **Click**: **"Add Record"**
2. **Type**: Select **"TXT"**
3. **Name/Host**: `_dmarc`
4. **Value**: `"v=DMARC1; p=none;"`
   - **Important**: Include the quotes in the value
5. **TTL**: `3600` (or leave default)
6. **Click**: **"Save"**

### Step 5: Wait for DNS Propagation

1. **DNS changes take time**: Usually 5-60 minutes, can take up to 48 hours
2. **Check verification status** in SES Console:
   - Go to: https://console.aws.amazon.com/ses/home?region=us-east-1
   - Click: **"Verified identities"**
   - Find: `travelselbuy.com`
   - Status should change from **"Pending verification"** to **"Verified"**

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

### MAIL FROM Records (Optional)
- **Purpose**: Makes emails appear to come directly from your domain
- **Status**: Your screenshot shows "No MAIL FROM records found"
- **Action**: You can configure this later if needed

---

## Verify Records Are Added Correctly

### In Hostinger:
1. Go back to DNS management
2. Check that all 3 CNAME records are listed
3. Check that the TXT record for `_dmarc` is listed

### In AWS SES:
1. Go to: https://console.aws.amazon.com/ses/home?region=us-east-1
2. Click: **"Verified identities"**
3. Find: `travelselbuy.com`
4. Click on it to see verification status
5. If verified, you'll see green checkmarks ✅

---

## Troubleshooting

### Records Not Verifying?

1. **Check record names**:
   - Make sure you included `._domainkey` for DKIM records
   - Make sure you included `_dmarc` for DMARC record

2. **Check record values**:
   - Copy-paste exact values from SES console
   - For DMARC, include the quotes: `"v=DMARC1; p=none;"`

3. **Wait longer**:
   - DNS can take up to 48 hours to propagate
   - Usually works within 1-2 hours

4. **Check Hostinger DNS settings**:
   - Make sure you're editing the correct domain
   - Make sure DNS is pointing to Hostinger (not external nameservers)

### Still Not Working?

**Quick workaround**: Verify email address instead:
- Verify `tarunag.in@gmail.com` (takes 2 minutes)
- Use this for testing while domain verification completes

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
1. ✅ Go to **Hostinger** DNS management
2. ✅ Add **3 CNAME records** (DKIM) from SES screenshot
3. ✅ Add **1 TXT record** (DMARC) from SES screenshot
4. ✅ Wait 5-60 minutes for DNS propagation
5. ✅ Check verification status in SES Console

**OR (for immediate testing):**
- Verify email address `tarunag.in@gmail.com` instead (faster, but limited to one address)

---

**Add the DNS records in Hostinger now, and your domain will be verified within 1-2 hours!**
