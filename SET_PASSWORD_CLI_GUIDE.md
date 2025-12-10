# Set Password Directly Using CLI (No Email) 🔐

## ⚠️ Problem

- "Set password" option is not available in Cognito Console
- Only "Reset password" is visible (which sends email)
- You want to change password directly without email

---

## ✅ Solution: Use AWS CLI or Script

Both methods set the password directly **without sending an email**.

---

## 🚀 Method 1: AWS CLI (Recommended)

**Run this command:**

```powershell
aws cognito-idp admin-set-user-password `
  --user-pool-id us-east-1_oF5qfa2IX `
  --username agent@gmail.com `
  --password "NewPassword123!" `
  --permanent
```

**Replace:**
- `agent@gmail.com` with the user's email
- `NewPassword123!` with your desired password

**Result:** Password is set directly, no email is sent!

---

## 📝 Method 2: TypeScript Script

**Run this command:**

```bash
npx ts-node aws-migration-scripts/set-password-direct.ts agent@gmail.com NewPassword123!
```

**Or if you prefer PowerShell:**

```powershell
# First, make sure COGNITO_USER_POOL_ID is set
$env:COGNITO_USER_POOL_ID = "us-east-1_oF5qfa2IX"
npx ts-node aws-migration-scripts/set-password-direct.ts agent@gmail.com NewPassword123!
```

---

## 🔑 Key Points

1. **`admin-set-user-password`** = Sets password directly (no email)
2. **`admin-reset-user-password`** = Sends email to user
3. **`--permanent`** flag = Makes password permanent (removes force change requirement)

---

## ✅ What Happens

- ✅ Password is changed immediately
- ✅ No email is sent to the user
- ✅ User can login with new password
- ✅ All associated data remains intact
- ⚠️ You need to share the password with the user securely

---

## 📋 Quick Command Reference

**Set password (no email):**
```powershell
aws cognito-idp admin-set-user-password `
  --user-pool-id us-east-1_oF5qfa2IX `
  --username <email> `
  --password "<new-password>" `
  --permanent
```

**Reset password (sends email):**
```powershell
aws cognito-idp admin-reset-user-password `
  --user-pool-id us-east-1_oF5qfa2IX `
  --username <email>
```

---

## 🎯 Recommended Approach

1. **Use AWS CLI** (fastest, most reliable)
2. **Or use the TypeScript script** (if you prefer)
3. **Share the password securely** with the user

---

## ⚡ One-Liner

```powershell
aws cognito-idp admin-set-user-password --user-pool-id us-east-1_oF5qfa2IX --username agent@gmail.com --password "NewPassword123!" --permanent
```

**This sets the password directly without sending an email!** ✅

