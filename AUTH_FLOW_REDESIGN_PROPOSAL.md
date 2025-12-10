# Auth Flow Redesign Proposal

## Current Issues

1. **Old Registration Flow Still Exists**: `/auth/register` page with multi-step form
2. **Separate Phone Login**: `/phone-login` is separate from main login
3. **No Unified Entry Point**: Users have to choose between email/password or phone
4. **Old Registration Links**: Still pointing to `/auth/register?role=agent` etc.

---

## Proposed Unified Flow

### Single Login/Registration Page (`/login`)

**Two Tabs/Sections:**
1. **Phone Number** (Primary - New Flow)
2. **Email & Password** (Secondary - Backward Compatibility)

---

## Flow Design

### **Tab 1: Phone Number (Primary)**

```
┌─────────────────────────────────────┐
│  Enter Phone Number                │
│  [Country Code] [Phone Number]     │
│  [reCAPTCHA]                       │
│  [Continue Button]                 │
└─────────────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │ Check Phone  │
    │ in Database  │
    └──────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
EXISTS        NOT EXISTS
    │             │
    ▼             ▼
┌─────────┐  ┌──────────────┐
│ Send    │  │ Show Minimal │
│ OTP     │  │ Signup Form: │
│         │  │ - Name        │
│         │  │ - Email      │
│         │  │ - Company    │
│         │  │ (Optional)   │
│         │  └──────────────┘
│         │         │
│         │         ▼
│         │  ┌──────────────┐
│         │  │ Create User  │
│         │  │ Send OTP     │
│         │  └──────────────┘
│         │         │
│         └────┬────┘
│              │
│              ▼
│      ┌──────────────┐
│      │ OTP Page     │
│      │ [6 digits]   │
│      └──────────────┘
│              │
│              ▼
│      ┌──────────────┐
│      │ Verify OTP   │
│      └──────────────┘
│              │
│      ┌───────┴───────┐
│      │               │
│      ▼               ▼
│  EXISTING USER   NEW USER
│      │               │
│      ▼               ▼
│  Login Direct   → Onboarding
│  (Dashboard)    (Profile Setup)
```

### **Tab 2: Email & Password (Backward Compatibility)**

```
┌─────────────────────────────────────┐
│  Email & Password Login             │
│  [Email Input]                      │
│  [Password Input]                   │
│  [Login Button]                     │
│                                     │
│  Forgot Password?                   │
└─────────────────────────────────────┘
```

---

## Implementation Plan

### 1. **Redesign `/login` Page**

**Structure:**
```tsx
<Tabs>
  <Tab label="Phone Number" default>
    {/* Phone login/signup flow */}
  </Tab>
  <Tab label="Email & Password">
    {/* Existing email/password login */}
  </Tab>
</Tabs>
```

**Phone Tab Flow:**
1. User enters phone number + reCAPTCHA
2. Click "Continue"
3. Call `/api/auth/phone/init` to check if phone exists
4. **If exists**: Send OTP → OTP page → Login → Dashboard
5. **If not exists**: Show minimal signup form (name, email, company) → Send OTP → OTP page → Register → Onboarding

### 2. **Remove Old Registration**

- **Delete**: `/auth/register` page
- **Update Links**: 
  - `/auth/register?role=agent` → `/login` (phone tab)
  - `/auth/register?role=tour_operator` → `/login` (phone tab)
  - All marketing pages pointing to register → `/login`

### 3. **Keep Backward Compatibility**

- Email/password login stays as-is
- Existing users can still login with email/password
- No breaking changes for current users

### 4. **Remove Gmail Registration**

- No Google OAuth/Social login
- Only Phone OTP and Email/Password

---

## Questions to Confirm

1. **Minimal Signup Form Fields**:
   - ✅ Name (required)
   - ✅ Email (required)
   - ✅ Company Name (optional)
   - ❌ No password (OTP-based)
   - ❌ No role selection (default to agent?)

2. **Role Assignment**:
   - How do we determine if user is agent vs tour operator?
   - Default to agent?
   - Or ask in onboarding?

3. **Onboarding Flow**:
   - After phone signup → redirect to `/agent/onboarding`?
   - Or show onboarding inline?

4. **Old Registration Links**:
   - Should we redirect `/auth/register` → `/login`?
   - Or show 404?

5. **Email/Password Tab**:
   - Keep "Sign up" link in email tab?
   - Or remove completely (force phone registration)?

---

## Proposed UI Layout

```
┌─────────────────────────────────────────────┐
│  TravClan                                   │
│  ┌───────────────────────────────────────┐ │
│  │ [Phone Number] [Email & Password]     │ │ ← Tabs
│  ├───────────────────────────────────────┤ │
│  │                                       │ │
│  │  [Country Code ▼] [Phone Number]     │ │
│  │                                       │ │
│  │  [reCAPTCHA Widget]                  │ │
│  │                                       │ │
│  │  [Continue Button]                   │ │
│  │                                       │ │
│  │  Or login with email & password      │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Benefits

1. ✅ **Simplified UX**: One entry point
2. ✅ **Unified Flow**: Phone number handles both login and signup
3. ✅ **Backward Compatible**: Email/password still works
4. ✅ **No Old Registration**: Cleaner codebase
5. ✅ **OTP-Based**: More secure, no password management

---

## Next Steps (After Confirmation)

1. Redesign `/login` page with tabs
2. Integrate phone flow into login page
3. Remove `/auth/register` page
4. Update all registration links
5. Test both flows
6. Deploy

---

**Please confirm:**
1. Is this flow correct?
2. What fields in minimal signup form?
3. How to handle role assignment?
4. Should we redirect old registration links?

