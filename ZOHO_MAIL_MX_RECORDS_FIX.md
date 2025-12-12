# Zoho Mail MX Records - Fix Guide

## 🚨 Problem Identified

Your **Zoho Mail** configuration requires MX records pointing to **`.in`** servers, but your **AWS Route 53** has MX records pointing to **`.com`** servers.

### What Zoho Requires:
- ✅ Priority 10: `mx.zoho.in`
- ✅ Priority 20: `mx2.zoho.in`
- ✅ Priority 50: `mx3.zoho.in`

### What Route 53 Currently Has (WRONG):
- ❌ Priority 10: `mx.zoho.com`
- ❌ Priority 20: `mx2.zoho.com`
- ❌ Priority 50: `mx3.zoho.com`

**The domain extension is wrong!** You need `.in` (India) but have `.com` in Route 53.

---

## ✅ Solution: Update MX Records in Route 53

### Step 1: Go to AWS Route 53 Console

1. **Go to**: https://console.aws.amazon.com/route53
2. **Click**: **"Hosted zones"** in left sidebar
3. **Find**: `travelselbuy.com` in the list
4. **Click** on `travelselbuy.com` to open the record list

### Step 2: Delete Incorrect MX Records

1. **Find** the existing MX records (they show `mx.zoho.com`, `mx2.zoho.com`, `mx3.zoho.com`)
2. **Select** each incorrect MX record (check the checkbox)
3. **Click**: **"Delete"** button
4. **Confirm** deletion

**OR** if you have a single MX record with multiple values, you can edit it directly.

### Step 3: Create Correct MX Records

1. **Click**: **"Create record"** button

2. **First MX Record:**
   - **Record name**: Leave empty or enter `@` (for root domain)
   - **Record type**: Select **"MX - Routes mail to mail servers"**
   - **Value**: Enter `10 mx.zoho.in`
     - **Important**: The format is `[priority] [mail server]`
     - Priority: `10`
     - Mail server: `mx.zoho.in` (note the `.in` extension!)
   - **TTL**: `3600` (or leave default)
   - **Click**: **"Create records"**

3. **Second MX Record:**
   - **Click**: **"Create record"** again
   - **Record name**: Leave empty or enter `@`
   - **Record type**: **MX**
   - **Value**: `20 mx2.zoho.in`
   - **TTL**: `3600`
   - **Click**: **"Create records"**

4. **Third MX Record:**
   - **Click**: **"Create record"** again
   - **Record name**: Leave empty or enter `@`
   - **Record type**: **MX**
   - **Value**: `50 mx3.zoho.in`
   - **TTL**: `3600`
   - **Click**: **"Create records"**

### Alternative: Single MX Record with Multiple Values

If Route 53 allows multiple values in one MX record, you can create a single record with:
- **Record name**: `@` (or leave empty)
- **Record type**: **MX**
- **Value**: 
  ```
  10 mx.zoho.in
  20 mx2.zoho.in
  50 mx3.zoho.in
  ```
  (Each on a separate line, or as separate entries depending on Route 53's interface)

---

## ✅ Verify the Fix

### In Route 53:
1. Go back to your hosted zone for `travelselbuy.com`
2. Check that your MX records now show:
   - `10 mx.zoho.in` ✅
   - `20 mx2.zoho.in` ✅
   - `50 mx3.zoho.in` ✅

### In Zoho Mail Admin Console:
1. **Go to**: https://mailadmin.zoho.in
2. Navigate to: **Domains** → **Email Configuration** → **MX**
3. **Click**: **"Verify"** button
4. Zoho should now detect the correct MX records

### Using DNS Lookup Tools:
You can verify the records are live using:
- **MXToolbox**: https://mxtoolbox.com/SuperTool.aspx?action=mx%3atravelselbuy.com
- **DNS Checker**: https://dnschecker.org/#MX/travelselbuy.com

---

## ⏱️ Wait for DNS Propagation

- **Route 53**: Changes are usually instant
- **DNS Propagation**: Can take **15-60 minutes** (sometimes up to 24 hours)
- **Zoho Verification**: After DNS propagates, Zoho should verify within **5-30 minutes**

---

## 🔍 Why This Matters

**MX Records** tell email servers where to deliver emails for your domain. If they point to the wrong mail servers (`.com` instead of `.in`), emails sent to `@travelselbuy.com` will:
- ❌ Not be delivered to Zoho Mail
- ❌ Be rejected or bounce
- ❌ Go to the wrong mail server (if `mx.zoho.com` even exists)

**The `.in` extension** indicates you're using Zoho Mail's India region, which requires different MX records than the global `.com` servers.

---

## 📋 Summary Checklist

- [ ] Delete old MX records with `.com` extension
- [ ] Create new MX record: `10 mx.zoho.in`
- [ ] Create new MX record: `20 mx2.zoho.in`
- [ ] Create new MX record: `50 mx3.zoho.in`
- [ ] Verify records in Route 53 console
- [ ] Wait 15-60 minutes for DNS propagation
- [ ] Click "Verify" in Zoho Mail Admin Console
- [ ] Confirm Zoho shows MX records as verified ✅

---

## 🆘 Still Not Working?

### Check These Common Issues:

1. **Double Domain Name**: Make sure Route 53 didn't add `.travelselbuy.com` twice
   - ❌ Wrong: `mx.zoho.in.travelselbuy.com`
   - ✅ Correct: `mx.zoho.in`

2. **TTL Too High**: Lower TTL to `300` (5 minutes) for faster propagation during testing

3. **Wrong Priority Order**: Make sure priorities are exactly: `10`, `20`, `50`

4. **Wait Longer**: DNS can take up to 24 hours to fully propagate globally

5. **Check Zoho Region**: Confirm you're using Zoho Mail India (`.in`) and not Zoho Mail Global (`.com`)

---

## 📞 Need Help?

- **Zoho Support**: support@zohomail.com
- **Zoho Chat**: Available in Zoho Mail Admin Console
- **AWS Route 53 Docs**: https://docs.aws.amazon.com/Route53/

