# Multi-City Package Schema Update

## Summary of Changes

We've updated the multi-city package form and database schema to simplify and improve the itinerary management.

### Frontend Changes (Already Implemented)

1. **Basic Info Tab** - Now includes:
   - Package title, description, and destination region
   - Inter-city transport toggle
   - **City Stops section** with inline forms (no popup)
   - City fields: Name, Country, Nights, Highlights, Activities

2. **Removed Tabs:**
   - ❌ Destinations tab (merged into Basic Info)
   - ❌ Transport tab (removed - simplified)
   - ❌ Policies tab (removed - simplified)

3. **New Itinerary Tab Structure:**
   - Days are auto-generated from cities/nights
   - Each day shows:
     - Day number and city name
     - Description text area
     - Photo upload
     - Optional flight checkbox
   - Multiple flights per day supported
   - Flight fields: Departure City, Departure Time, Arrival City, Arrival Time, Airline, Flight Number

### Database Changes Required

#### Migration File Created: `004_update_multi_city_itinerary_schema.sql`

**Changes:**

1. **Updated `multi_city_package_day_plans` table:**
   - ✅ Added: `city_name` (VARCHAR)
   - ✅ Added: `description` (TEXT)
   - ✅ Added: `photo_url` (TEXT)
   - ✅ Added: `has_flights` (BOOLEAN)
   - ❌ Removed: `includes_breakfast`, `includes_lunch`, `includes_dinner`
   - ❌ Removed: `accommodation_type`, `notes`

2. **Created new table: `multi_city_package_day_flights`**
   ```sql
   - id (UUID, PRIMARY KEY)
   - day_plan_id (UUID, references day_plans)
   - departure_city (VARCHAR)
   - departure_time (TIME)
   - arrival_city (VARCHAR)
   - arrival_time (TIME)
   - airline (VARCHAR)
   - flight_number (VARCHAR)
   - flight_order (INTEGER)
   - created_at (TIMESTAMPTZ)
   ```

3. **Removed table: `multi_city_package_day_activities`**
   - No longer needed (replaced by description field)

## How to Apply the Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# Make sure you're in the project directory
cd /path/to/Tprov10

# Run the migration
supabase db reset  # For development (WARNING: drops all data)

# OR for production-safe migration:
supabase db push
```

### Option 2: Manual Application via Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Open the file: `supabase/migrations/004_update_multi_city_itinerary_schema.sql`
3. Copy and paste the entire SQL content
4. Click "Run" to execute

### Option 3: Using psql

```bash
psql <your-database-url> -f supabase/migrations/004_update_multi_city_itinerary_schema.sql
```

## Data Migration Considerations

⚠️ **IMPORTANT:** If you have existing data in the old format, you'll need to:

1. **Backup your data first!**
2. Consider creating a data migration script to:
   - Merge `includes_breakfast/lunch/dinner` into a notes field if needed
   - Convert `multi_city_package_day_activities` records into the new `description` field
   - Set default values for new fields

### Example Data Migration (if needed):

```sql
-- Backup existing data
CREATE TABLE multi_city_package_day_plans_backup AS 
SELECT * FROM multi_city_package_day_plans;

CREATE TABLE multi_city_package_day_activities_backup AS 
SELECT * FROM multi_city_package_day_activities;

-- Populate city_name from cities table
UPDATE multi_city_package_day_plans dp
SET city_name = c.name
FROM multi_city_package_cities c
WHERE dp.city_id = c.id;

-- Convert activities into description (optional)
UPDATE multi_city_package_day_plans dp
SET description = (
  SELECT string_agg(
    COALESCE(time, '') || ' ' || description, 
    E'\n' 
    ORDER BY activity_order
  )
  FROM multi_city_package_day_activities
  WHERE day_plan_id = dp.id
);
```

## Testing Checklist

After applying the migration:

- [ ] Verify the migration ran without errors
- [ ] Check that `multi_city_package_day_plans` has new columns
- [ ] Check that `multi_city_package_day_flights` table exists
- [ ] Test creating a new multi-city package in the UI
- [ ] Verify days are auto-populated from cities
- [ ] Test adding flights to a day
- [ ] Test photo upload functionality
- [ ] Check RLS policies are working correctly

## Rollback Plan

If you need to rollback:

```sql
-- Restore from backup (if you created backups)
DROP TABLE multi_city_package_day_plans;
ALTER TABLE multi_city_package_day_plans_backup 
  RENAME TO multi_city_package_day_plans;

-- Recreate activities table
-- (use original schema from create-multi-city-packages-schema.sql)
```

## Next Steps

1. ✅ Review the migration file
2. ⚠️ Backup your database
3. 🚀 Apply the migration
4. 🧪 Test the new form functionality
5. 📝 Update any API endpoints or backend code that reference the old schema

## Questions?

If you encounter any issues during migration, check:
- Supabase logs for error messages
- Database constraints (foreign keys, etc.)
- RLS policies if access is denied

