# Email/Password Login Fix

## Problem Identified ✅

**Issue**: Email/password login was failing with "Incorrect username or password" even for correct credentials.

**Root Cause**:
1. **Phone OTP users** are created in **both**:
   - **Database (RDS)**: With `auth_method = 'phone_otp'`
   - **Cognito**: With a **random temporary password** they don't know

2. **Email/password login** tries to authenticate with Cognito directly
3. If the user was created via phone OTP, they have a random password in Cognito
4. Login fails because the password doesn't match

---

## Solution ✅

**Updated `/api/auth/login` route** to:
1. **Check database first** to see if user exists and what their `auth_method` is
2. **If `auth_method = 'phone_otp'`**: Return error telling user to use phone login
3. **If `auth_method = 'email_password'` or null**: Proceed with Cognito authentication

---

## Where Users Are Stored

### Phone OTP Users:
- **Database (RDS)**: `users` table with `auth_method = 'phone_otp'`
- **Cognito**: User created with random temporary password (user doesn't know it)
- **Login Method**: Phone number + OTP (not email/password)

### Email/Password Users:
- **Database (RDS)**: `users` table with `auth_method = 'email_password'` (or null for legacy)
- **Cognito**: User created with the password they set
- **Login Method**: Email + password

---

## Changes Made

### ✅ Updated `/api/auth/login/route.ts`:

```typescript
// Check user's auth_method in database first
const user = await queryOne<{ auth_method: string | null }>(
  `SELECT auth_method FROM users WHERE email = $1`,
  [email]
);

if (user) {
  // If user registered with phone OTP, they can't use email/password login
  if (user.auth_method === 'phone_otp') {
    return NextResponse.json(
      { 
        error: 'Invalid authentication method',
        message: 'This account was registered with phone number. Please use phone number login instead.',
        authMethod: 'phone_otp',
      },
      { status: 400 }
    );
  }
}
```

---

## What This Means

### For Phone OTP Users:
- ✅ They **must** use phone number login
- ❌ They **cannot** use email/password login
- ✅ Clear error message tells them to use phone login

### For Email/Password Users:
- ✅ They can use email/password login as before
- ✅ No changes to their workflow

### For Legacy Users (no auth_method):
- ✅ They can still use email/password login
- ✅ Works as before

---

## Testing

1. **Phone OTP user tries email/password login**:
   - Should get error: "This account was registered with phone number. Please use phone number login instead."

2. **Email/password user tries email/password login**:
   - Should work as before

3. **Legacy user (no auth_method) tries email/password login**:
   - Should work as before

---

## Summary

**The Fix**:
- ✅ Login route now checks database first
- ✅ Prevents phone OTP users from using email/password login
- ✅ Clear error message guides users to correct login method
- ✅ Email/password users unaffected

**After deployment**:
- Phone OTP users will get helpful error message
- Email/password users can login normally
- No more "Incorrect password" errors for phone OTP users

---

**Deploy and test! The login route should now work correctly for both user types.**
