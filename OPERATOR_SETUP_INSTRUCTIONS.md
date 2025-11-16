# Operator Setup Instructions for Simulation Demo

## 📋 Overview

Before running the simulation setup SQL migrations, you need to create 5 tour operators in Supabase Auth. This guide walks you through the process.

---

## 🎯 Operators to Create

1. **Bali Adventure Tours**
   - Email: `bali.adventure@touroperator.com`
   - Password: `DemoOperator123!` (or any secure password)
   - Role: `TOUR_OPERATOR`

2. **Java Cultural Experiences**
   - Email: `java.cultural@touroperator.com`
   - Password: `DemoOperator123!`
   - Role: `TOUR_OPERATOR`

3. **Island Paradise Transfers**
   - Email: `island.transfers@touroperator.com`
   - Password: `DemoOperator123!`
   - Role: `TOUR_OPERATOR`

4. **Bali Beach Activities**
   - Email: `bali.beach@touroperator.com`
   - Password: `DemoOperator123!`
   - Role: `TOUR_OPERATOR`

5. **Premium Indonesia Tours**
   - Email: `premium.indonesia@touroperator.com`
   - Password: `DemoOperator123!`
   - Role: `TOUR_OPERATOR`

---

## 📝 Step-by-Step Setup

### Step 1: Create Operators in Supabase Auth

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"** or **"Invite User"**
4. For each operator:
   - Enter email address
   - Enter password
   - Click **"Create User"**
   - After creation, click on the user to edit
   - In **"User Metadata"**, add:
     ```json
     {
       "role": "TOUR_OPERATOR",
       "name": "Bali Adventure Tours" (or appropriate name)
     }
     ```

#### Option B: Via SQL (Service Role Required)

Run this SQL in Supabase SQL Editor (requires service role):

```sql
-- Create operators in auth.users
-- Note: This requires service role access or Supabase Admin

-- Operator 1
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'bali.adventure@touroperator.com',
    crypt('DemoOperator123!', gen_salt('bf')),
    NOW(),
    '{"role": "TOUR_OPERATOR", "name": "Bali Adventure Tours"}'::jsonb,
    NOW(),
    NOW()
);

-- Repeat for other 4 operators (or use a loop/function)
```

**Note**: This method is complex and may require service role. Recommended to use Dashboard method.

---

### Step 2: Verify Operators Created

After creating operators in auth.users, run this query to verify:

```sql
SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'name' as name,
    created_at
FROM auth.users
WHERE email IN (
    'bali.adventure@touroperator.com',
    'java.cultural@touroperator.com',
    'island.transfers@touroperator.com',
    'bali.beach@touroperator.com',
    'premium.indonesia@touroperator.com'
)
ORDER BY email;
```

**Expected Result**: 5 rows with all operators

---

### Step 3: Create User Profiles in `users` Table

After operators are created in `auth.users`, run this SQL to create/update their profiles:

```sql
-- Insert or update operator profiles in users table
INSERT INTO public.users (id, email, name, role, profile)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1)) as name,
    'TOUR_OPERATOR'::user_role as role,
    jsonb_build_object(
        'timezone', 'Asia/Jakarta',
        'language', 'en',
        'currency', 'USD',
        'notification_preferences', jsonb_build_object(
            'email', true,
            'sms', false,
            'push', true,
            'marketing', false
        )
    ) as profile
FROM auth.users
WHERE email IN (
    'bali.adventure@touroperator.com',
    'java.cultural@touroperator.com',
    'island.transfers@touroperator.com',
    'bali.beach@touroperator.com',
    'premium.indonesia@touroperator.com'
)
ON CONFLICT (id) 
DO UPDATE SET
    role = 'TOUR_OPERATOR',
    name = COALESCE(EXCLUDED.name, public.users.name),
    updated_at = NOW();
```

---

### Step 4: Run Migration Files

Now you can run the migration files:

1. **First**: Run `008_simulation_demo_setup.sql`
   - Creates leads table
   - Creates helper functions
   - Creates packages (will fail if operators don't exist)

2. **Second**: Run `008_simulation_demo_setup_continued.sql`
   - Creates remaining packages
   - Creates marketplace leads

**Note**: If operators don't exist in `auth.users`, package creation will fail with error messages indicating which operators are missing.

---

### Step 5: Verify Complete Setup

Run verification queries from the end of `008_simulation_demo_setup_continued.sql`:

```sql
-- Check operators
SELECT 'Operators Created' as check_type, COUNT(*) as count
FROM auth.users
WHERE email IN (
    'bali.adventure@touroperator.com',
    'java.cultural@touroperator.com',
    'island.transfers@touroperator.com',
    'bali.beach@touroperator.com',
    'premium.indonesia@touroperator.com'
);

-- Check packages
SELECT 
    (SELECT COUNT(*) FROM activity_packages WHERE status = 'published') as activity_packages,
    (SELECT COUNT(*) FROM transfer_packages WHERE status = 'published') as transfer_packages,
    (SELECT COUNT(*) FROM multi_city_packages WHERE status = 'published') as multi_city_packages;

-- Check marketplace leads
SELECT COUNT(*) as available_leads
FROM lead_marketplace
WHERE status = 'AVAILABLE';
```

**Expected Results**:
- Operators: 5
- Activity Packages: ~10-12
- Transfer Packages: ~8-10
- Multi-City Packages: ~2-3
- Marketplace Leads: 3

---

## 🔧 Troubleshooting

### Error: "Operator with email X not found"

**Solution**: Operator not created in `auth.users`. Go back to Step 1.

### Error: "Foreign key violation" when creating packages

**Solution**: Operators exist but not in `users` table. Run Step 3.

### Packages created but not visible

**Check**:
```sql
SELECT COUNT(*) FROM activity_packages WHERE status = 'published';
```
If count is 0, packages were created with `status = 'draft'`. Update:
```sql
UPDATE activity_packages SET status = 'published' WHERE status = 'draft';
```

### Marketplace leads not visible

**Check**:
```sql
SELECT * FROM lead_marketplace WHERE status = 'AVAILABLE' AND expires_at > NOW();
```

---

## ✅ Success Checklist

- [ ] 5 operators created in `auth.users`
- [ ] 5 operators have profiles in `users` table
- [ ] Migration `008_simulation_demo_setup.sql` runs without errors
- [ ] Migration `008_simulation_demo_setup_continued.sql` runs without errors
- [ ] ~20-25 packages created and published
- [ ] 3 marketplace leads created and available
- [ ] Verification queries return expected counts

---

## 🚀 Next Steps

Once setup is complete:

1. **Test Agent Purchase Flow**:
   - Login as travel agent
   - Browse marketplace (`/agent/marketplace`)
   - Click "Buy Lead" (dummy button)
   - Verify lead appears in "My Leads"

2. **Test Itinerary Creation**:
   - From "My Leads", click "Create Itinerary"
   - Verify packages from all 5 operators are visible
   - Build a complete 3-4 day itinerary
   - Save itinerary

3. **Test PDF Generation**:
   - Generate PDF from saved itinerary
   - Verify PDF contains all details

---

## 📞 Support

If you encounter issues:
1. Check error messages in Supabase SQL Editor
2. Verify operators exist in `auth.users`
3. Check that `users` table has operator profiles
4. Verify package status is 'published'
5. Check marketplace lead status and expiration dates

