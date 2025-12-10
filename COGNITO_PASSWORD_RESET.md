# Cognito Password Reset Guide 🔐

## ⚠️ Important: Passwords Were NOT Migrated

**Why?** Passwords are one-way hashed in Supabase, so we cannot extract the original passwords. 

**What happened during migration:**
- Users were created in Cognito with **random temporary passwords**
- Each user was set to **change password on first login**
- The temporary passwords were **not saved** (they were randomly generated)

---

## ✅ Solution: Reset Passwords in Cognito

You have several options:

### **Option 1: Reset Password via AWS Console (Recommended)**

1. **Go to AWS Cognito Console**
   - https://console.aws.amazon.com/cognito/
   - Click **User pools** → Your user pool

2. **Find the User**
   - Click **Users** tab
   - Search for `agent@gmail.com` (or the email you're trying to login with)

3. **Reset Password**
   - Click on the user
   - Click **Actions** → **Reset password**
   - Choose one:
     - **Send password reset email** (user will get email with reset link)
     - **Set password** (you set a new password directly)

4. **If Setting Password Directly:**
   - Enter new password
   - Make sure it meets password policy (8+ chars, uppercase, lowercase, number, symbol)
   - Click **Set password**

5. **Test Login**
   - Use the new password to login

---

### **Option 2: Use AWS CLI to Reset Password**

```bash
# Reset password for a user (sends email)
aws cognito-idp admin-reset-user-password \
  --user-pool-id us-east-1_oF5qfa2IX \
  --username agent@gmail.com

# Or set password directly
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_oF5qfa2IX \
  --username agent@gmail.com \
  --password "YourNewPassword123!" \
  --permanent
```

---

### **Option 3: Create a Script to Reset All User Passwords**

I can create a script to reset passwords for all users. Would you like me to do that?

---

## 🔍 Check User Status in Cognito

To see if the user exists and their current status:

1. **AWS Console:**
   - Cognito → User pools → Your pool → Users
   - Find the user
   - Check **User status**:
     - `FORCE_CHANGE_PASSWORD` - User needs to change password
     - `CONFIRMED` - User is active
     - `UNCONFIRMED` - User email not verified

2. **AWS CLI:**
```bash
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_oF5qfa2IX \
  --username agent@gmail.com
```

---

## 🚀 Quick Fix: Reset Password for agent@gmail.com

**Using AWS Console (Easiest):**

1. Go to: https://console.aws.amazon.com/cognito/
2. User pools → `travel-app-user-pool` (or your pool name)
3. Users tab → Search for `agent@gmail.com`
4. Click on the user
5. Actions → **Set password**
6. Enter new password: `Agent123!` (or your preferred password)
7. Click **Set password**
8. Try logging in again

---

## 📝 For All Users

If you need to reset passwords for multiple users:

1. **Option A:** Use "Send password reset email" for each user
2. **Option B:** I can create a script to bulk reset passwords
3. **Option C:** Manually set passwords in Cognito Console

---

## ✅ After Resetting Password

1. User can login with the new password
2. If status is `FORCE_CHANGE_PASSWORD`, user will be prompted to change it on first login
3. After first login, password is permanent

---

**Quick Action:** Go to Cognito Console and reset the password for `agent@gmail.com` now! 🔐

