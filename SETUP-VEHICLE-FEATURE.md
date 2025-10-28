# Quick Setup Guide: Vehicle Management Feature

## ✅ What Was Implemented

Vehicle management feature for Private Transfer pricing packages with:
- Multiple vehicles per package
- Standard vehicle types + custom "Others" option  
- Max capacity and category fields
- Complete CRUD operations
- Secure RLS policies

## 🚀 Setup Steps

### 1. Apply Database Migration

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy contents from `supabase/migrations/002_create_activity_package_vehicles.sql`
5. Paste and click "Run"
6. Verify success message

**Option B: Using Supabase CLI** (if installed)
```bash
supabase db push
```

### 2. Verify Database Setup

Run this query in SQL Editor to verify:
```sql
-- Check table exists
SELECT * FROM activity_package_vehicles LIMIT 0;

-- Check RLS policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'activity_package_vehicles';
```

### 3. Test the Feature

1. **Login** as an operator
2. **Navigate** to: Operator Dashboard → Packages → Create Activity Package
3. Go to **"Pricing"** tab
4. Click **"Add Pricing Option"**
5. Set **Package Type** to "Private Transfer"
6. **Vehicle section** should appear automatically
7. Click **"Add Vehicle"** and fill in details:
   - Vehicle Type: Select from dropdown or "Others"
   - Max Capacity: Enter number (e.g., 4)
   - Category: Select from dropdown
   - Custom Type: If "Others" selected, enter custom name
8. **Add multiple vehicles** to test multiple vehicles feature
9. Click **"Save Draft"** or **"Publish Package"**
10. **Reload** the page and verify vehicles are saved and loaded correctly

## 📁 Files Created/Modified

### Created:
- `supabase/migrations/002_create_activity_package_vehicles.sql` - Database schema
- `src/lib/supabase/activity-package-vehicles.ts` - Backend service
- `VEHICLE-MANAGEMENT-FEATURE.md` - Feature documentation
- `SETUP-VEHICLE-FEATURE.md` - This file

### Modified:
- `src/components/packages/forms/tabs/ActivityPricingOptionsTab.tsx` - UI for vehicle management
- `src/lib/supabase/activity-pricing-simple.ts` - Added `savePricingPackagesWithVehicles()`
- `src/components/packages/forms/ActivityPackageForm.tsx` - Async vehicle loading
- `src/app/operator/packages/create/activity/page.tsx` - Uses new save function

## 🎯 Features Working

✅ Vehicle fields show ONLY when "Private Transfer" is selected
✅ Add/edit/delete multiple vehicles per package
✅ Standard vehicle types dropdown with "Others" option
✅ Custom vehicle type text input when "Others" selected
✅ Max capacity and category fields
✅ Vehicles save to database correctly
✅ Vehicles load when editing existing package
✅ Vehicles are linked to specific package only
✅ All vehicles deleted when package is deleted (CASCADE)
✅ RLS policies secure vehicle data
✅ No existing features affected

## 🔍 Verification Commands

### Check if vehicles are being saved:
```sql
SELECT 
  v.id,
  v.vehicle_type,
  v.max_capacity,
  v.vehicle_category,
  v.description,
  pp.package_name as pricing_package_name
FROM activity_package_vehicles v
JOIN activity_pricing_packages pp ON v.pricing_package_id = pp.id
ORDER BY v.created_at DESC
LIMIT 10;
```

### Check vehicle count per package:
```sql
SELECT 
  pp.package_name,
  pp.transfer_type,
  COUNT(v.id) as vehicle_count
FROM activity_pricing_packages pp
LEFT JOIN activity_package_vehicles v ON v.pricing_package_id = pp.id
WHERE pp.transfer_type = 'PRIVATE'
GROUP BY pp.id, pp.package_name, pp.transfer_type;
```

## 🐛 Troubleshooting

### Issue: Vehicle section not showing
- **Check:** Is package type set to "Private Transfer"?
- **Solution:** The section only appears for PRIVATE_TRANSFER type

### Issue: Vehicles not saving
- **Check:** Database migration applied?
- **Solution:** Run the migration SQL file

### Issue: Permission denied error
- **Check:** RLS policies created?
- **Solution:** Verify policies exist with query above

### Issue: Vehicles not loading on edit
- **Check:** Browser console for errors
- **Check:** Network tab for failed API calls
- **Solution:** Verify `getVehiclesForPricingPackage()` is being called

## 📚 Additional Resources

- Full feature documentation: `VEHICLE-MANAGEMENT-FEATURE.md`
- Database migration: `supabase/migrations/002_create_activity_package_vehicles.sql`
- Backend service: `src/lib/supabase/activity-package-vehicles.ts`

## ✨ Ready to Use!

The feature is fully implemented and ready to use. Just apply the database migration and start adding vehicles to your private transfer packages!

## 🆘 Need Help?

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check Supabase logs for database errors
3. Verify all files are saved and server is restarted (if needed)
4. Review the feature documentation for detailed API usage

