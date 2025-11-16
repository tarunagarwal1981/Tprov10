# Vehicle Management Feature for Private Transfer Packages

## Overview

This document describes the vehicle management feature added to the activity pricing package system. When a pricing package is set to "Private Transfer", operators can now add and manage multiple vehicles with detailed specifications.

## Features Added

### 1. Database Schema

**New Table: `activity_package_vehicles`**
- Links to `activity_pricing_packages` table
- Stores vehicle information for private transfers
- Includes:
  - Vehicle Type (dropdown with standard types + custom "Others")
  - Max Capacity (passenger capacity)
  - Vehicle Category (Economy, Standard, Premium, Luxury, Group Transport)
  - Description (for custom vehicle types)
  - Display order for sorting

**File:** `supabase/migrations/002_create_activity_package_vehicles.sql`

### 2. Frontend Components

**Updated: `ActivityPricingOptionsTab.tsx`**
- Added `PackageVehicle` interface
- Vehicle management UI shown only for "PRIVATE_TRANSFER" package type
- Features:
  - Add multiple vehicles per package
  - Edit vehicle details inline
  - Remove vehicles
  - Vehicle type dropdown with standard options
  - Custom vehicle type when "Others" is selected
  - Max capacity input
  - Vehicle category selection
  
**Vehicle Display:**
- Editing mode: Full vehicle management interface with add/edit/delete
- View mode: Clean summary showing vehicle count and details

### 3. Backend Services

**New File: `src/lib/supabase/activity-package-vehicles.ts`**

Functions:
- `getVehiclesForPricingPackage(pricingPackageId)` - Load vehicles
- `createVehicle(pricingPackageId, vehicle, displayOrder)` - Create new vehicle
- `updateVehicle(id, pricingPackageId, updates)` - Update vehicle
- `deleteVehicle(id)` - Delete vehicle
- `deleteVehiclesForPricingPackage(pricingPackageId)` - Delete all vehicles for package
- `saveVehiclesForPricingPackage(pricingPackageId, vehicles)` - Bulk upsert
- `updateVehiclesOrder(vehicles)` - Update display order

**Updated: `src/lib/supabase/activity-pricing-simple.ts`**

New/Updated Functions:
- `convertPricingPackageToSimple()` - Now async, loads vehicles for private transfers
- `convertSimpleToPricingPackage()` - Handles vehicles in input
- `savePricingPackagesWithVehicles()` - NEW: Saves pricing packages and their vehicles

### 4. Form Integration

**Updated Files:**
- `src/components/packages/forms/ActivityPackageForm.tsx` - Async loading of pricing options with vehicles
- `src/app/operator/packages/create/activity/page.tsx` - Uses `savePricingPackagesWithVehicles()`

## Usage

### For Operators

1. **Create/Edit Activity Package:**
   - Go to Operator Dashboard → Packages → Create Activity Package
   
2. **Add Pricing Options:**
   - Navigate to the "Pricing" tab
   - Click "Add Pricing Option"
   
3. **Select Private Transfer:**
   - Set Package Type to "Private Transfer"
   - Vehicle section appears automatically
   
4. **Add Vehicles:**
   - Click "Add Vehicle" button
   - Select Vehicle Type from dropdown:
     - Sedan
     - SUV
     - Van
     - Mini Bus
     - Bus
     - Luxury Sedan
     - Luxury SUV
     - Others (allows custom text input)
   - Enter Max Capacity (number of passengers)
   - Select Vehicle Category:
     - Economy
     - Standard
     - Premium
     - Luxury
     - Group Transport
   - If "Others" selected, enter custom vehicle type in the description field
   
5. **Manage Vehicles:**
   - Add multiple vehicles to same package
   - Edit vehicle details by updating inline
   - Remove vehicles using trash icon
   - Vehicles are saved when you save/publish the package

### Data Flow

```
User Edits Form (SimplePricingOption with vehicles[])
  ↓
Save Button Clicked
  ↓
savePricingPackagesWithVehicles(packageId, simplePricingOptions)
  ↓
1. Converts SimplePricingOption[] → ActivityPricingPackage[]
2. Saves/Updates pricing packages
3. For each PRIVATE_TRANSFER package:
   - Calls saveVehiclesForPricingPackage()
   - Creates/updates/deletes vehicles as needed
```

```
Load Package for Edit
  ↓
getPricingPackages(packageId) → ActivityPricingPackage[]
  ↓
convertPricingPackageToSimple(pkg) (async)
  ↓
If PRIVATE_TRANSFER:
  - Loads vehicles via getVehiclesForPricingPackage()
  - Includes in returned SimplePricingOption
```

## Database Migration

To apply the database changes:

```bash
# Using Supabase CLI
supabase db push

# Or run the SQL file directly in Supabase Dashboard
# SQL Editor → New query → Paste contents of:
# supabase/migrations/002_create_activity_package_vehicles.sql
```

## Security

- Row Level Security (RLS) enabled on `activity_package_vehicles` table
- Operators can only:
  - View vehicles for their own packages
  - Create vehicles for their own packages
  - Update their own vehicles
  - Delete their own vehicles
- Public can view vehicles for published, active packages

## API Structure

### PackageVehicle Interface

```typescript
interface PackageVehicle {
  id: string;
  vehicleType: string;        // e.g., "Sedan", "SUV", "Others"
  maxCapacity: number;         // e.g., 4, 7, 15
  vehicleCategory: string;     // e.g., "Standard", "Luxury"
  description?: string;        // Custom type when "Others" selected
}
```

### SimplePricingOption Interface (Updated)

```typescript
interface SimplePricingOption {
  id: string;
  activityName: string;
  packageType: 'TICKET_ONLY' | 'PRIVATE_TRANSFER' | 'SHARED_TRANSFER';
  adultPrice: number;
  childPrice: number;
  childMinAge: number;
  childMaxAge: number;
  vehicles?: PackageVehicle[];  // NEW: Only for PRIVATE_TRANSFER
}
```

## Testing Checklist

- [x] Database migration creates table successfully
- [x] TypeScript interfaces updated
- [x] Form shows vehicle fields only for PRIVATE_TRANSFER
- [x] Add vehicle button works
- [x] Vehicle fields populate correctly
- [x] "Others" option shows custom text input
- [x] Remove vehicle button works
- [x] Vehicles save correctly to database
- [x] Vehicles load correctly when editing package
- [x] Multiple vehicles can be added
- [x] Vehicles linked to specific package only
- [x] No linter errors

## Future Enhancements

Potential improvements:
1. Vehicle images/photos
2. Vehicle pricing per vehicle (not per person)
3. Vehicle availability calendar
4. Vehicle amenities/features checklist
5. Integration with fleet management
6. Real-time vehicle availability

## Notes

- Vehicles are only applicable to PRIVATE_TRANSFER package type
- Vehicles are stored separately from pricing packages for flexibility
- ON DELETE CASCADE ensures vehicles are deleted when pricing package is deleted
- Vehicle display order is maintained for consistent ordering
- Custom vehicle types are stored in the description field when "Others" is selected

## Support

For questions or issues:
1. Check database migration was applied
2. Verify RLS policies are active
3. Check browser console for errors
4. Review server logs for backend errors

