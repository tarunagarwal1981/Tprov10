# Netlify to Amplify Migration Guide

## Overview
Migrating domain from Netlify to AWS Amplify by updating nameservers in Hostinger.

---

## Step 1: Get Amplify Nameservers

### In AWS Amplify Console:

1. **Go to AWS Amplify Console**
   - URL: https://console.aws.amazon.com/amplify/
   - Select your app

2. **Add Domain**
   - Click **"Domain management"** in left sidebar
   - Click **"Add domain"**
   - Enter your domain: `travelselbuy.com`
   - Click **"Configure domain"**

3. **Copy Nameservers**
   - Amplify will show you **4 nameservers** like:
     ```
     ns-123.awsdns-12.com
     ns-456.awsdns-45.net
     ns-789.awsdns-78.org
     ns-012.awsdns-01.co.uk
     ```
   - **Copy all 4 nameservers** (you'll need them)

---

## Step 2: Update Nameservers in Hostinger

### In Hostinger Control Panel:

1. **Login to Hostinger**
   - Go to: https://hpanel.hostinger.com/
   - Login with your credentials

2. **Navigate to Domain**
   - Click **"Domains"** in left sidebar
   - Find `travelselbuy.com`
   - Click on the domain name

3. **Update Nameservers**
   - Click **"DNS / Nameservers"** tab
   - Select **"Custom nameservers"** (instead of "Hostinger nameservers")
   - You'll see 2-4 nameserver fields
   - **Replace Netlify nameservers** with Amplify nameservers:
     - Field 1: `ns-123.awsdns-12.com`
     - Field 2: `ns-456.awsdns-45.net`
     - Field 3: `ns-789.awsdns-78.org`
     - Field 4: `ns-012.awsdns-01.co.uk`
   - Click **"Save"** or **"Update"**

4. **Wait for Propagation**
   - DNS changes take **24-48 hours** to propagate globally
   - Some regions may see changes in 1-2 hours
   - You can check status using DNS checker tools

---

## Step 3: Verify DNS Propagation

### Check Nameserver Update:

1. **Using Command Line** (Windows PowerShell):
   ```powershell
   nslookup -type=NS travelselbuy.com
   ```
   Should show Amplify nameservers

2. **Using Online Tools**:
   - https://www.whatsmydns.net/#NS/travelselbuy.com
   - https://dnschecker.org/#NS/travelselbuy.com
   - Enter domain and check if nameservers match Amplify

3. **In Amplify Console**:
   - Go to Domain management
   - Status should change from "Pending" to "Active" once DNS propagates

---

## Step 4: Update Environment Variables in Amplify

### After Domain is Active:

1. **Go to Amplify App Settings**
   - App Settings → Environment variables

2. **Verify All Variables Are Set**:
   ```bash
   # OTP Authentication
   SMS_SENDER_ID=TRAVCLAN
   SES_FROM_EMAIL=tarunag.in@gmail.com
   SES_FROM_NAME=TravClan
   RECAPTCHA_SITE_KEY=6Ld33CIsAAAAALWHIk57tR-rPKOwdTQTVWJwGSMF
   RECAPTCHA_SECRET_KEY=6Ld33CIsAAAAAAMtPMvXfPXZMdYdQ0dFGqHw7TfJ
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Ld33CIsAAAAALWHIk57tR-rPKOwdTQTVWJwGSMF
   S3_DOCUMENTS_BUCKET=travclan-documents
   
   # Existing
   COGNITO_USER_POOL_ID=us-east-1_oF5qfa2IX
   COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9
   DEPLOYMENT_REGION=us-east-1
   # ... etc
   ```

3. **Update reCAPTCHA Domains**:
   - Go to: https://www.google.com/recaptcha/admin
   - Edit your reCAPTCHA site
   - Add Amplify domain: `*.amplifyapp.com`
   - Add your custom domain: `travelselbuy.com`

---

## Step 5: Clean Up Netlify (Optional)

### After Migration is Complete:

1. **Remove Domain from Netlify**:
   - Go to Netlify dashboard
   - Domain settings → Remove domain
   - This prevents conflicts

2. **Cancel Netlify Plan** (if applicable):
   - Only if you're not using Netlify for other projects

---

## Troubleshooting

### Issue: Domain Not Resolving
- **Wait longer**: DNS propagation can take up to 48 hours
- **Check nameservers**: Verify they're correctly set in Hostinger
- **Clear DNS cache**: 
  ```powershell
  ipconfig /flushdns
  ```

### Issue: SSL Certificate Not Issued
- Amplify automatically provisions SSL via AWS Certificate Manager
- Wait 15-30 minutes after domain is active
- Check in Amplify → Domain management → SSL status

### Issue: Site Not Loading
- Check Amplify build status
- Verify environment variables are set
- Check Amplify logs for errors

---

## Why Update in Hostinger (Not Amplify)?

**Answer**: Because Hostinger is your **domain registrar** (where you bought the domain).

- **Domain Registrar** (Hostinger): Controls where domain points
- **Hosting Provider** (Amplify): Where your site is hosted
- **Nameservers**: Tell the internet where to find your site

**Flow**:
```
User types travelselbuy.com
    ↓
DNS lookup (checks nameservers in Hostinger)
    ↓
Nameservers point to Amplify
    ↓
Amplify serves your site
```

---

## Quick Checklist

- [ ] Get Amplify nameservers from Amplify console
- [ ] Login to Hostinger
- [ ] Update nameservers in Hostinger DNS settings
- [ ] Save changes
- [ ] Wait 24-48 hours for propagation
- [ ] Verify nameservers using DNS checker
- [ ] Check Amplify domain status (should be "Active")
- [ ] Update reCAPTCHA domains
- [ ] Test site on custom domain
- [ ] Remove domain from Netlify (optional)

---

## Expected Timeline

- **Nameserver Update**: Immediate (in Hostinger)
- **DNS Propagation**: 1-48 hours (usually 2-6 hours)
- **SSL Certificate**: 15-30 minutes after domain active
- **Total**: ~2-48 hours for full migration

---

**Last Updated**: Current date
**Status**: Ready to migrate

