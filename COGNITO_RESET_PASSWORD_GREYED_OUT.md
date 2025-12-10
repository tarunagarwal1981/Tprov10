# Cognito Reset Password Greyed Out - Solutions 🔧

## ⚠️ Why "Reset Password" is Greyed Out

The "Reset password" option is greyed out when:
1. **User status** is `UNCONFIRMED` (email not verified)
2. **User status** is `FORCE_CHANGE_PASSWORD` (user must change password on first login)
3. **MFA is enabled** and user hasn't set it up
4. **User is disabled**

---

## ✅ Solutions

### **Solution 1: Use "Set password" Instead** (Recommended)

If "Reset password" is greyed out, use **"Set password"**:

1. **Go to Cognito Console**
   - https://console.aws.amazon.com/cognito/
   - User pools → Your pool → Users

2. **Find the User**
   - Search for `agent@gmail.com`
   - Click on the user

3. **Use "Set password"**
   - Click **Actions** → **Set password** (this should NOT be greyed out)
   - Enter new password: `Agent123!` (or your preferred password)
   - **Important:** Uncheck "User must change password on next sign-in" (if you want permanent password)
   - Click **Set password**

4. **Test Login**
   - Use the new password to login

---

### **Solution 2: Check User Status First**

1. **Check User Status:**
   - In Cognito Console → Users → Click on user
   - Look at **User status** field

2. **If Status is `UNCONFIRMED`:**
   - Click **Actions** → **Confirm user**
   - Then try "Set password" again

3. **If Status is `FORCE_CHANGE_PASSWORD`:**
   - Use "Set password" (not "Reset password")
   - Make sure to uncheck "User must change password on next sign-in"

---

### **Solution 3: Use AWS CLI** (If Console Doesn't Work)

```powershell
# Set password directly (bypasses console restrictions)
aws cognito-idp admin-set-user-password `
  --user-pool-id us-east-1_oF5qfa2IX `
  --username agent@gmail.com `
  --password "Agent123!" `
  --permanent
```

**Note:** Replace:
- `us-east-1_oF5qfa2IX` with your User Pool ID
- `agent@gmail.com` with the user's email
- `Agent123!` with your desired password

---

### **Solution 4: Use the Reset Script**

I created a script for this:

```bash
# Make sure .env.local has COGNITO_USER_POOL_ID set
npx ts-node aws-migration-scripts/reset-user-password.ts agent@gmail.com Agent123!
```

---

## 🔍 Check User Status

To see why reset is greyed out:

1. **In Cognito Console:**
   - Users → Click on user
   - Check **User status** field
   - Check **Enabled** checkbox

2. **Common Statuses:**
   - `CONFIRMED` - User is active, can reset password
   - `UNCONFIRMED` - Email not verified, must confirm first
   - `FORCE_CHANGE_PASSWORD` - Must change password on first login
   - `RESET_REQUIRED` - Password reset required

---

## ✅ Quick Fix: Use "Set password"

**This should work even if "Reset password" is greyed out:**

1. Cognito Console → Users → `agent@gmail.com`
2. **Actions** → **Set password**
3. Enter: `Agent123!`
4. **Uncheck** "User must change password on next sign-in"
5. Click **Set password**
6. Try logging in!

---

## 🚀 Alternative: Use AWS CLI

If the console still doesn't work, use CLI:

```powershell
aws cognito-idp admin-set-user-password `
  --user-pool-id us-east-1_oF5qfa2IX `
  --username agent@gmail.com `
  --password "Agent123!" `
  --permanent
```

This bypasses all console restrictions and sets the password directly.

---

**Try "Set password" first - it should work even when "Reset password" is greyed out!** 🔐

