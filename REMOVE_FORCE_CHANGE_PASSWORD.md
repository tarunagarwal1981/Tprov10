# Remove Force Change Password Requirement 🔐

## ⚠️ Problem

User is in `FORCE_CHANGE_PASSWORD` status, which means:
- User must change password on first login
- "Reset password" is greyed out in console
- User can't login normally

---

## ✅ Solution: Set Permanent Password

Setting a password with the `--permanent` flag removes the force change requirement.

---

## 🚀 Quick Fix: Use PowerShell Script

**Run this command:**

```powershell
.\remove-force-change-password.ps1 agent@gmail.com YourNewPassword123!
```

This will:
1. ✅ Check current user status
2. ✅ Set a permanent password
3. ✅ Remove force change requirement
4. ✅ Verify the change

---

## 🔧 Manual Method: AWS CLI

**Step 1: Check User Status**
```powershell
aws cognito-idp admin-get-user `
  --user-pool-id us-east-1_oF5qfa2IX `
  --username agent@gmail.com
```

**Step 2: Set Permanent Password**
```powershell
aws cognito-idp admin-set-user-password `
  --user-pool-id us-east-1_oF5qfa2IX `
  --username agent@gmail.com `
  --password "YourNewPassword123!" `
  --permanent
```

**The `--permanent` flag is key!** It:
- ✅ Sets the password as permanent
- ✅ Removes `FORCE_CHANGE_PASSWORD` status
- ✅ Changes status to `CONFIRMED`
- ✅ User can login without being forced to change password

---

## 📋 Via Cognito Console

1. **Go to Cognito Console**
   - https://console.aws.amazon.com/cognito/
   - User pools → Your pool → Users

2. **Find the User**
   - Search for `agent@gmail.com`
   - Click on the user

3. **Set Password**
   - Click **Actions** → **Set password**
   - Enter new password
   - **IMPORTANT:** Uncheck "User must change password on next sign-in"
   - Click **Set password**

---

## 🔍 Verify Status Changed

After setting password, check status:

```powershell
aws cognito-idp admin-get-user `
  --user-pool-id us-east-1_oF5qfa2IX `
  --username agent@gmail.com
```

**Before:** `UserStatus: FORCE_CHANGE_PASSWORD`  
**After:** `UserStatus: CONFIRMED`

---

## ⚡ Quick Command

**One-liner to fix it:**

```powershell
aws cognito-idp admin-set-user-password --user-pool-id us-east-1_oF5qfa2IX --username agent@gmail.com --password "YourNewPassword123!" --permanent
```

Replace:
- `agent@gmail.com` with the user's email
- `YourNewPassword123!` with your desired password

---

## ✅ Success Indicators

After running the command, you should see:
- ✅ User status changes from `FORCE_CHANGE_PASSWORD` to `CONFIRMED`
- ✅ User can login without being forced to change password
- ✅ "Reset password" option becomes available in console (if needed later)

---

**The `--permanent` flag is the key to removing the force change requirement!** 🔑

