# Activity Package Private Pricing Improvements

## Summary

Improved the activity package pricing form for the **Private Transfer** option with better UX and functionality.

## Changes Made

### 1. ✅ Added Vehicle Pricing Field
**Problem:** Vehicles had no pricing - only vehicle type, capacity, and category were captured.

**Solution:** Added a `price` field to each vehicle option:
- Frontend: Updated `PackageVehicle` interface to include `price: number`
- Backend: Updated `VehicleRow` interface and transformation functions
- Database: Created migration `003_add_price_to_activity_package_vehicles.sql`

### 2. ✅ Improved Form Layout - All Fields in One Row
**Problem:** Vehicle fields were spread across 2 columns, making the form harder to scan.

**Solution:** Changed layout to display all 4 fields in one row:
- Vehicle Type | Max Capacity | Category | Price (all in one row)
- Custom vehicle type field (when "Others" is selected) shown in a separate full-width row below
- Changed from `grid-cols-2` to `grid-cols-4` (responsive: `lg:grid-cols-4`)

### 3. ✅ First Vehicle Visible by Default
**Problem:** Users had to click "Add Vehicle" to see any vehicle fields, adding an extra step.

**Solution:** 
- When "Private Transfer" is selected, the form automatically initializes with one empty vehicle
- Default values: Sedan, 4 capacity, Standard category, $0 price
- Users can still add more vehicles using the "Add Vehicle" button

### 4. ✅ Clear Package Association
**Problem:** Need to ensure vehicles are clearly linked to the specific package and pricing option.

**Solution:**
- Vehicles are stored with `pricing_package_id` linking to the specific pricing option
- Each pricing option (with its vehicles) is attached to the main activity package
- RLS policies ensure operators can only manage their own package vehicles

## Files Modified

### Frontend Components
1. **`src/components/packages/forms/tabs/ActivityPricingOptionsTab.tsx`**
   - Added `price` field to `PackageVehicle` interface
   - Updated vehicle initialization to include price (default: 0)
   - Changed layout from 2-column to 4-column grid for vehicle fields
   - Added auto-initialization of first vehicle when "Private Transfer" is selected
   - Updated view mode to display vehicle prices

### Backend Services
2. **`src/lib/supabase/activity-package-vehicles.ts`**
   - Updated `VehicleRow` interface to include `price: number`
   - Updated `rowToVehicle()` function to map price field
   - Updated `vehicleToRow()` function to include price field (default: 0)

### Database Migrations
3. **`supabase/migrations/003_add_price_to_activity_package_vehicles.sql`** (NEW)
   - Adds `price DECIMAL(10, 2) NOT NULL DEFAULT 0.00` column
   - Adds constraint to ensure price is non-negative
   - Includes verification query

## UI Improvements

### Edit Mode (When Creating/Editing)
```
┌─────────────────────────────────────────────────────────────┐
│ Vehicle 1                                          [Delete] │
├─────────────────────────────────────────────────────────────┤
│ [Vehicle Type ▼] [Max Capacity] [Category ▼] [Price ($)]   │
│   Sedan            4            Standard       150.00       │
│                                                             │
│ (If "Others" selected)                                     │
│ [Custom Vehicle Type: ___________________________]         │
└─────────────────────────────────────────────────────────────┘
                    [+ Add Vehicle]
```

### View Mode (When Saved)
```
Available Vehicles (2)
┌─────────────────────────────────────────────────────────────┐
│ Sedan (Standard) • Max 4 pax                       $150.00  │
│ Van (Group Transport) • Max 8 pax                  $250.00  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **User selects "Private Transfer"** → First vehicle automatically appears
2. **User fills vehicle details** → Type, Capacity, Category, and **Price**
3. **User can add more vehicles** → Click "Add Vehicle" for additional options
4. **On save** → All vehicles linked to the pricing package ID
5. **Database stores** → Each vehicle with its price and association

## Database Schema

```sql
activity_package_vehicles
├── id (UUID)
├── pricing_package_id (UUID) → links to activity_pricing_packages
├── vehicle_type (VARCHAR)
├── max_capacity (INTEGER)
├── vehicle_category (VARCHAR)
├── price (DECIMAL) ← NEW FIELD
├── description (TEXT)
└── display_order (INTEGER)
```

## Benefits

1. **Complete Pricing Information**: Operators can now specify different prices for different vehicle options
2. **Better UX**: All fields visible in one compact row, easier to scan and fill
3. **Faster Workflow**: First vehicle appears immediately, no extra click needed
4. **Clear Association**: Vehicles are properly linked to specific pricing packages and the main activity package
5. **Flexible Options**: Operators can offer multiple vehicle types with different prices for the same activity

## Testing Checklist

- [x] Build compiles successfully with no TypeScript errors
- [x] No linter errors
- [ ] Test creating new activity package with Private Transfer option
- [ ] Verify first vehicle appears automatically
- [ ] Test adding multiple vehicles with different prices
- [ ] Verify all 4 fields display in one row (on desktop)
- [ ] Test responsive layout on mobile
- [ ] Verify vehicle data saves correctly to database
- [ ] Test editing existing packages with vehicles
- [ ] Verify price displays correctly in view mode
- [ ] Run database migration and verify price column exists

## Migration Instructions

To apply the database changes:

```bash
# Apply the new migration to add price column
# This will be done through Supabase dashboard or CLI
# File: supabase/migrations/003_add_price_to_activity_package_vehicles.sql
```

## Notes

- The price field defaults to 0.00 if not specified
- Database constraint ensures price cannot be negative
- Responsive design: 1 column on mobile, 4 columns on desktop (lg breakpoint)
- Custom vehicle type field appears in separate row when "Others" is selected for better layout

