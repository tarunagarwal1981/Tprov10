# Auth Flow - Confirmed Understanding ✅

## Confirmed Requirements

### 1. Minimal Signup Form Fields ✅
- **Name** (required)
- **Email** (required)
- **Company Name** (optional)
- **No password** (OTP-based)
- **No role selection** (will ask during onboarding)

### 2. Role Assignment ✅
- **No default role**
- **Ask during onboarding** (`/agent/onboarding`)
- User selects agent/tour operator during profile setup

### 3. Register Page ✅
- **Comment out** `/auth/register` page (don't delete)
- Keep code for reference but disable route

### 4. Login Page ✅
- **Title**: "Login/Register" or industry standard
- **Two tabs**:
  - Tab 1: Phone Number (primary flow)
  - Tab 2: Email & Password (backward compatibility)

### 5. Google Login ✅
- **Remove completely** from login page
- No social login options

### 6. Implementation Status ✅
- **NOT implementing yet** - just confirming understanding
- Will implement after you approve

---

## Flow Summary

### Phone Number Flow (Primary)
```
User enters phone + reCAPTCHA
    ↓
Check if phone exists (/api/auth/phone/init)
    ↓
┌───────────┴───────────┐
│                       │
EXISTS              NOT EXISTS
│                       │
Send OTP          Show minimal signup form
    │               (Name, Email, Company)
    │                       │
    │                   Create user
    │                   Send OTP
    │                       │
    └───────────┬───────────┘
                │
            OTP Page
                │
            Verify OTP
                │
        ┌───────┴───────┐
        │               │
    EXISTING        NEW USER
        │               │
    Login         → Onboarding
    (Dashboard)    (Select role + profile)
```

### Email/Password Flow (Backward Compatibility)
```
User enters email + password
    ↓
Login with Cognito
    ↓
Dashboard
```

---

## Files to Modify (When Implementing)

1. **`/login` page**:
   - Add tabs (Phone / Email & Password)
   - Integrate phone flow
   - Remove Google login button
   - Update title to "Login/Register"

2. **`/auth/register` page**:
   - Comment out entire page
   - Add note: "Disabled - using phone OTP flow"

3. **Update links**:
   - Marketing pages: `/auth/register?role=*` → `/login`
   - Remove all references to old registration

4. **Onboarding**:
   - Add role selection step
   - Ask: Agent or Tour Operator?

---

## Questions Resolved ✅

1. ✅ Minimal signup fields confirmed
2. ✅ No default role - ask in onboarding
3. ✅ Comment out register page
4. ✅ Login/Register title
5. ✅ Remove Google login
6. ✅ Don't implement yet

---

**Status**: Understanding confirmed, ready to implement when approved.

