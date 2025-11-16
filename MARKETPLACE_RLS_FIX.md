# Marketplace RLS Policy Fix

## Problem Summary

After logging in as a travel agent, the application was encountering `403 (Forbidden)` and `permission denied` errors when trying to access marketplace data. The console showed:

1. **403 Forbidden** errors for `HEAD` and `GET` requests to:
   - `/rest/v1/lead_marketplace`
   - `/rest/v1/lead_purchases`

2. **Permission denied errors**:
   - `[MarketplaceService] Error counting available leads`
   - `[MarketplaceService] Error fetching featured leads: permission denied for table users`
   - `[MarketplaceService] Error counting purchases`
   - `[MarketplaceService] Error calculating total spent`

## Root Cause

The Row-Level Security (RLS) policies on the `lead_marketplace` and `lead_purchases` tables had several issues:

1. **Missing authentication check**: Policies didn't verify that `auth.uid() IS NOT NULL`, which could cause issues with RLS evaluation.

2. **No role verification**: The "Travel agents can view available leads" policy didn't check if the user is actually a travel agent - it only checked if the lead status is 'AVAILABLE' and not expired.

3. **Wrong role source**: Admin policies were checking `auth.users.raw_user_meta_data->>'role'` instead of `public.users.role`, which is where the application stores user roles.

4. **Users table access**: When RLS policies tried to check user roles from `public.users`, they were blocked because the users table RLS only allows users to view their own profile.

## Solution

Created a new migration file `supabase/migrations/fix_marketplace_rls_policies.sql` that:

1. **Creates helper functions** (`is_travel_agent_or_admin` and `is_admin`) that use `SECURITY DEFINER` to safely read user roles from `public.users` table, bypassing RLS restrictions.

2. **Updates RLS policies** on `lead_marketplace`:
   - Requires authentication (`auth.uid() IS NOT NULL`)
   - Verifies user is a travel agent or admin using the helper function
   - Checks role from `public.users.role` instead of `auth.users.raw_user_meta_data`

3. **Updates RLS policies** on `lead_purchases`:
   - Requires authentication
   - Allows agents to view their own purchases
   - Allows agents to create purchases for available leads

4. **Grants necessary permissions** for the helper functions to be executed by authenticated users.

## How to Apply the Fix

### Option 1: Run via Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase/migrations/fix_marketplace_rls_policies.sql`
4. Paste and execute the SQL script
5. Verify that the policies were created successfully by checking the output

### Option 2: Run via Supabase CLI

If you have Supabase CLI set up locally:

```bash
# Apply the migration
supabase db push

# Or if using migration files
supabase migration up
```

### Option 3: Manual Execution

1. Connect to your Supabase database
2. Run the SQL script section by section:
   - Drop existing policies
   - Create helper functions
   - Create new RLS policies
   - Grant permissions

## Verification

After applying the migration, verify that:

1. **Helper functions exist**:
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname IN ('is_travel_agent_or_admin', 'is_admin');
   ```

2. **Policies are created**:
   ```sql
   SELECT policyname, cmd as command 
   FROM pg_policies 
   WHERE tablename IN ('lead_marketplace', 'lead_purchases')
   ORDER BY tablename, policyname;
   ```

3. **Test as travel agent**: Log in as a travel agent and verify that:
   - Dashboard loads without errors
   - Marketplace stats are displayed correctly
   - Featured leads are shown
   - No `403` or `permission denied` errors appear in console

## Expected Behavior After Fix

- Travel agents can view available leads in the marketplace
- Travel agents can view their own purchase statistics
- Travel agents can purchase leads
- Admins can view and manage all leads and purchases
- No permission denied errors in console logs
- Dashboard displays marketplace statistics correctly

## Technical Details

### Helper Functions

The migration creates two `SECURITY DEFINER` functions:

1. **`is_travel_agent_or_admin(user_id UUID)`**: Returns `true` if the user has role `TRAVEL_AGENT`, `ADMIN`, or `SUPER_ADMIN`
2. **`is_admin(user_id UUID)`**: Returns `true` if the user has role `ADMIN` or `SUPER_ADMIN`

These functions use `SECURITY DEFINER` which means they run with the privileges of the function creator (usually a superuser), allowing them to bypass RLS on the `public.users` table to check roles safely.

### RLS Policy Structure

All new policies:
- Use `TO authenticated` to restrict access to authenticated users only
- Check `auth.uid() IS NOT NULL` to ensure user is authenticated
- Use helper functions to verify user roles from `public.users.role`
- Follow least-privilege principle - agents can only access their own data unless they're admins

## Notes

- The helper functions are safe because they only read `id` and `role` columns, not sensitive data
- `SECURITY DEFINER` functions bypass RLS, but they're read-only and only check role information
- The existing RLS policies on `public.users` still protect other user data
- Admin policies now correctly check `public.users.role` instead of `auth.users.raw_user_meta_data`

## Troubleshooting

If you still encounter issues after applying the migration:

1. **Check if policies exist**: Run the verification queries above
2. **Check user role**: Verify the travel agent user has role `TRAVEL_AGENT` in `public.users` table
3. **Check authentication**: Ensure the user is properly authenticated (`auth.uid()` is not null)
4. **Check RLS is enabled**: Verify RLS is enabled on the tables:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename IN ('lead_marketplace', 'lead_purchases');
   ```
5. **Review console errors**: Check browser console for specific error messages

## Related Files

- `supabase/migrations/fix_marketplace_rls_policies.sql` - The migration script
- `supabase/migrations/lead_marketplace.sql` - Original marketplace migration (contains old policies)
- `src/lib/services/marketplaceService.ts` - Service that queries marketplace data

