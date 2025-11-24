# Set Password Directly in Cognito (No Email) 🔐

## ⚠️ Problem

- "Reset password" sends an email to the user
- You want to change the password directly without notifying the user
- You can't delete the user (data is associated)

---

## ✅ Solution: Use "Set password" Instead

**"Set password"** sets the password directly without sending an email.

---

## 🚀 Method 1: Cognito Console (Easiest)

1. **Go to Cognito Console**
   - https://console.aws.amazon.com/cognito/
   - User pools → Your pool → Users

2. **Find the User**
   - Search for the user's email
   - Click on the user

3. **Set Password (NOT Reset Password)**
   - Click **Actions** → **Set password** ⚠️ (NOT "Reset password")
   - Enter the new password
   - **Uncheck** "User must change password on next sign-in" (if you want it permanent)
   - Click **Set password**

**Result:** Password is set directly, no email is sent!

---

## 🔧 Method 2: AWS CLI

```powershell
aws cognito-idp admin-set-user-password `
  --user-pool-id us-east-1_oF5qfa2IX `
  --username agent@gmail.com `
  --password "NewPassword123!" `
  --permanent
```

**Key:** `admin-set-user-password` sets it directly (no email)  
**vs** `admin-reset-user-password` sends an email

---

## 📝 Method 3: Use the Script

**PowerShell:**
```powershell
.\set-password-direct.ps1 agent@gmail.com NewPassword123!
```

**TypeScript:**
```bash
npx ts-node aws-migration-scripts/set-password-direct.ts agent@gmail.com NewPassword123!
```

---

## 🔑 Key Difference

| Action | Command | Email Sent? |
|--------|---------|-------------|
| **Set Password** | `admin-set-user-password` | ❌ No |
| **Reset Password** | `admin-reset-user-password` | ✅ Yes |

---

## ✅ What Happens

1. ✅ Password is changed immediately
2. ✅ No email is sent to the user
3. ✅ User can login with new password
4. ✅ All associated data remains intact
5. ⚠️ You need to share the password with the user securely

---

## 📋 Quick Reference

**Console:**
- Actions → **Set password** (direct, no email)
- Actions → **Reset password** (sends email)

**CLI:**
- `admin-set-user-password` (direct, no email)
- `admin-reset-user-password` (sends email)

**Script:**
- `set-password-direct.ps1` (direct, no email)
- `set-password-direct.ts` (direct, no email)

---

## 🎯 Recommended Approach

1. **Use "Set password" in Cognito Console** (easiest)
2. **Or use the script** if you prefer command line
3. **Share the password securely** with the user (via secure channel, not email)

---

**Use "Set password" - it changes the password directly without sending an email!** ✅

