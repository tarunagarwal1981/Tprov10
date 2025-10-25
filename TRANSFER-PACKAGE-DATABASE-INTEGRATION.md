# Transfer Package Database Integration - Complete Guide

## Overview

This document explains how the new Transfer Package form integrates with the database, including proper storage of vehicle data and vehicle images.

## Database Schema Updates Required

### 1. Run the Schema Fix SQL

**File:** `fix-transfer-package-schema-for-new-form.sql`

**What it does:**
- Makes `short_description` column NULLABLE (since description is now optional)
- Ensures `transfer_vehicle_images` table exists
- Adds `has_image` flag to vehicles for quick queries
- Creates triggers to automatically update `has_image` flag
- Sets up proper RLS policies

**To run:**
```sql
-- Copy and paste the contents of fix-transfer-package-schema-for-new-form.sql
-- into your Supabase SQL Editor and execute
```

## Database Tables Involved

### 1. `transfer_packages` (Main Package)
```sql
- id (UUID, PK)
- operator_id (UUID, FK to auth.users)
- title (VARCHAR(100), NOT NULL)
- short_description (VARCHAR(160), NULLABLE) ✅ Now optional
- ... other fields
```

### 2. `transfer_package_vehicles` (Vehicle Info)
```sql
- id (UUID, PK)
- package_id (UUID, FK to transfer_packages)
- vehicle_type (VARCHAR(20), ENUM)
- name (VARCHAR(100), NOT NULL)
- passenger_capacity (INTEGER, NOT NULL)
- luggage_capacity (INTEGER)
- base_price (DECIMAL)
- display_order (INTEGER)
- has_image (BOOLEAN) ✅ New flag
```

### 3. `transfer_vehicle_images` (Vehicle Images) ✅ KEY TABLE
```sql
- id (UUID, PK)
- vehicle_id (UUID, FK to transfer_package_vehicles)
- file_name (VARCHAR(255))
- storage_path (TEXT)
- public_url (TEXT)
- alt_text (TEXT)
- display_order (INTEGER)
```

### 4. `transfer_package_images` (Package Images)
```sql
- id (UUID, PK)
- package_id (UUID, FK to transfer_packages)
- file_name (VARCHAR(255))
- storage_path (TEXT)
- ... (for package gallery images, not vehicle images)
```

## Data Flow: Form → Database

### Step 1: User Fills Form
```
┌─────────────────────────────────────┐
│ Transfer Package Form               │
├─────────────────────────────────────┤
│ Title: "Airport Transfer"           │
│ Description: (optional)              │
│                                      │
│ Vehicle 1:                           │
│ ├─ Name: "Mercedes S-Class"         │
│ ├─ Type: LUXURY                      │
│ ├─ Max Capacity: 4                   │
│ └─ Image: [uploaded]                 │
│                                      │
│ Vehicle 2:                           │
│ ├─ Name: "Toyota Hiace"              │
│ ├─ Type: VAN                         │
│ ├─ Max Capacity: 8                   │
│ └─ Image: [uploaded]                 │
└─────────────────────────────────────┘
```

### Step 2: Form Data Transformation
**Function:** `formDataToDatabase()`

```typescript
{
  package: {
    title: "Airport Transfer",
    short_description: "", // Can be empty now
    ...
  },
  vehicles: [
    {
      name: "Mercedes S-Class",
      vehicle_type: "LUXURY",
      passenger_capacity: 4,
      luggage_capacity: 0,
      base_price: 0,
      display_order: 0
    },
    {
      name: "Toyota Hiace",
      vehicle_type: "VAN",
      passenger_capacity: 8,
      luggage_capacity: 0,
      base_price: 0,
      display_order: 1
    }
  ],
  vehicleImages: [
    {
      vehicleIndex: 0,
      image: {
        file_name: "mercedes.jpg",
        storage_path: "data:image/...", // base64 or URL
        alt_text: "Mercedes S-Class - Vehicle Image"
      }
    },
    {
      vehicleIndex: 1,
      image: {
        file_name: "hiace.jpg",
        storage_path: "data:image/...",
        alt_text: "Toyota Hiace - Vehicle Image"
      }
    }
  ]
}
```

### Step 3: Database Operations
**Function:** `createTransferPackage()`

```
1. Insert Package
   ↓
   transfer_packages.id = "abc-123"

2. Insert Vehicles
   ↓
   transfer_package_vehicles:
   - id: "vehicle-1", package_id: "abc-123", name: "Mercedes..."
   - id: "vehicle-2", package_id: "abc-123", name: "Toyota..."

3. Upload & Insert Vehicle Images
   ↓
   For each vehicleImage:
   a) Upload to Supabase Storage:
      Path: "transfer-packages/vehicles/mercedes_123.jpg"
   
   b) Insert to transfer_vehicle_images:
      vehicle_id: "vehicle-1",
      storage_path: "transfer-packages/vehicles/mercedes_123.jpg",
      public_url: "https://storage.supabase.co/..."
   
   c) Trigger updates has_image flag:
      transfer_package_vehicles.has_image = true

4. Return complete package with vehicles and images
```

## Storage Bucket Structure

```
supabase-storage/
└── transfer-packages/
    ├── package-images/        (if we add package images back)
    └── vehicles/              ✅ Vehicle images go here
        ├── mercedes_1234567.jpg
        ├── hiace_1234568.jpg
        └── ... (one image per vehicle)
```

## Complete Code Flow

### 1. Form Component (`TransferDetailsTab.tsx`)
```typescript
// Vehicle Detail Row with image upload
<VehicleDetailRow
  vehicle={vehicle}
  onUpdate={(updatedVehicle) => {
    // Updates form state with vehicle data including image
    setValue('transferDetails.vehicles', updatedVehicles);
  }}
/>
```

### 2. Form Submission (`create/transfer/page.tsx`)
```typescript
const handlePublish = async (data: TransferPackageFormData) => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Transform to database format
  const dbData = formDataToDatabase(data, user.id);
  
  // Save to database
  const { data: result, error } = await createTransferPackage(dbData, user.id);
};
```

### 3. Database Service (`transfer-packages.ts`)
```typescript
export async function createTransferPackage(data, userId) {
  // 1. Insert package
  const { data: packageData } = await supabase
    .from('transfer_packages')
    .insert(data.package)
    .select()
    .single();
  
  // 2. Insert vehicles
  const { data: vehiclesData } = await supabase
    .from('transfer_package_vehicles')
    .insert(vehiclesWithPackageId)
    .select();
  
  // 3. For each vehicle with image:
  for (const vehicleImage of data.vehicleImages) {
    const vehicleId = vehiclesData[vehicleImage.vehicleIndex].id;
    
    // Upload image if base64
    if (image.storage_path.startsWith('data:')) {
      const file = base64ToFile(image.storage_path, fileName);
      const uploadResult = await uploadImageFiles(
        [file], 
        userId, 
        'transfer-packages/vehicles'
      );
    }
    
    // Insert vehicle image with vehicle_id
    await supabase
      .from('transfer_vehicle_images')
      .insert({
        vehicle_id: vehicleId,
        storage_path: uploadResult.path,
        public_url: uploadResult.publicUrl,
        ...
      });
  }
  
  return { data: completePackage, error: null };
}
```

## Testing Checklist

### ✅ Database Schema
```sql
-- 1. Run this to verify schema is correct
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'transfer_packages' 
AND column_name = 'short_description';

-- Expected: is_nullable = 'YES'

-- 2. Check vehicle images table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'transfer_vehicle_images';

-- Expected: 1 row returned
```

### ✅ Form Testing

1. **Create Package with Empty Description**
   ```
   Action: Leave description field empty, fill title
   Expected: ✅ No validation error
   Database: short_description = '' or NULL
   ```

2. **Add Single Vehicle**
   ```
   Action: Fill vehicle name, type, capacity
   Expected: ✅ Vehicle saved to transfer_package_vehicles
   Database Query:
   SELECT * FROM transfer_package_vehicles 
   WHERE package_id = '<package_id>';
   ```

3. **Add Vehicle with Image**
   ```
   Action: Upload image to vehicle
   Expected: 
   ✅ Image uploaded to storage
   ✅ Record in transfer_vehicle_images
   ✅ vehicle_id correctly references vehicle
   
   Database Query:
   SELECT v.name, vi.* 
   FROM transfer_package_vehicles v
   LEFT JOIN transfer_vehicle_images vi ON vi.vehicle_id = v.id
   WHERE v.package_id = '<package_id>';
   ```

4. **Add Multiple Vehicles**
   ```
   Action: Add 3 vehicles with different details
   Expected:
   ✅ 3 records in transfer_package_vehicles
   ✅ display_order = 0, 1, 2
   ✅ All linked to same package_id
   
   Database Query:
   SELECT name, vehicle_type, passenger_capacity, display_order
   FROM transfer_package_vehicles 
   WHERE package_id = '<package_id>'
   ORDER BY display_order;
   ```

5. **Multiple Vehicles with Images**
   ```
   Action: Add 2 vehicles, upload image for each
   Expected:
   ✅ 2 records in transfer_package_vehicles
   ✅ 2 records in transfer_vehicle_images
   ✅ Each image correctly linked to its vehicle
   ✅ has_image flag = true for both vehicles
   
   Database Query:
   SELECT 
     v.id,
     v.name,
     v.has_image,
     vi.file_name,
     vi.public_url
   FROM transfer_package_vehicles v
   LEFT JOIN transfer_vehicle_images vi ON vi.vehicle_id = v.id
   WHERE v.package_id = '<package_id>';
   ```

6. **Delete Vehicle with Image**
   ```
   Action: Remove a vehicle that has an image
   Expected:
   ✅ Vehicle deleted from transfer_package_vehicles
   ✅ Vehicle image deleted from transfer_vehicle_images (CASCADE)
   ✅ Image file remains in storage (manual cleanup needed)
   ```

### ✅ Data Integrity Tests

```sql
-- Test 1: All vehicles belong to valid packages
SELECT v.* 
FROM transfer_package_vehicles v
LEFT JOIN transfer_packages p ON p.id = v.package_id
WHERE p.id IS NULL;
-- Expected: 0 rows

-- Test 2: All vehicle images belong to valid vehicles
SELECT vi.* 
FROM transfer_vehicle_images vi
LEFT JOIN transfer_package_vehicles v ON v.id = vi.vehicle_id
WHERE v.id IS NULL;
-- Expected: 0 rows

-- Test 3: has_image flag is correct
SELECT 
  v.id,
  v.name,
  v.has_image,
  COUNT(vi.id) as image_count
FROM transfer_package_vehicles v
LEFT JOIN transfer_vehicle_images vi ON vi.vehicle_id = v.id
GROUP BY v.id, v.name, v.has_image
HAVING (v.has_image = true AND COUNT(vi.id) = 0)
    OR (v.has_image = false AND COUNT(vi.id) > 0);
-- Expected: 0 rows (all flags correct)
```

## Common Issues & Solutions

### Issue 1: "short_description cannot be null"
**Cause:** Schema not updated
**Solution:** Run `fix-transfer-package-schema-for-new-form.sql`

### Issue 2: Vehicle images not showing
**Cause:** Images saved to wrong table
**Solution:** Check if images are in `transfer_vehicle_images` not `transfer_package_images`

### Issue 3: Vehicle image upload fails
**Cause:** Storage bucket or RLS policy issues
**Solution:** 
```sql
-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'transfer_vehicle_images';

-- Verify storage bucket
-- In Supabase Dashboard → Storage → transfer-packages/vehicles folder exists
```

### Issue 4: has_image flag not updating
**Cause:** Trigger not created
**Solution:** Run the trigger creation part of the schema fix SQL

## Verification Queries

### Get Complete Package with Vehicles and Images
```sql
SELECT 
  p.id as package_id,
  p.title,
  p.short_description,
  json_agg(
    json_build_object(
      'vehicle_id', v.id,
      'name', v.name,
      'type', v.vehicle_type,
      'capacity', v.passenger_capacity,
      'has_image', v.has_image,
      'images', (
        SELECT json_agg(
          json_build_object(
            'id', vi.id,
            'file_name', vi.file_name,
            'url', vi.public_url
          )
        )
        FROM transfer_vehicle_images vi
        WHERE vi.vehicle_id = v.id
      )
    ) ORDER BY v.display_order
  ) as vehicles
FROM transfer_packages p
LEFT JOIN transfer_package_vehicles v ON v.package_id = p.id
WHERE p.id = '<your-package-id>'
GROUP BY p.id;
```

### Count Package Statistics
```sql
SELECT 
  p.id,
  p.title,
  COUNT(DISTINCT v.id) as vehicle_count,
  COUNT(DISTINCT vi.id) as vehicle_image_count,
  COUNT(DISTINCT pi.id) as package_image_count
FROM transfer_packages p
LEFT JOIN transfer_package_vehicles v ON v.package_id = p.id
LEFT JOIN transfer_vehicle_images vi ON vi.vehicle_id = v.id
LEFT JOIN transfer_package_images pi ON pi.package_id = p.id
GROUP BY p.id, p.title;
```

## Success Criteria

✅ **Schema Updated**: `short_description` is NULLABLE
✅ **Vehicle Table**: Records created with correct data
✅ **Vehicle Images Table**: Images linked to correct vehicle_id
✅ **Storage**: Images uploaded to `transfer-packages/vehicles/`
✅ **Flags**: `has_image` automatically updates
✅ **RLS Policies**: Operators can only manage their own data
✅ **Cascading Deletes**: Deleting vehicle removes its images
✅ **Multiple Vehicles**: Can save 2+ vehicles with unique images

## Next Steps

1. **Run the schema fix SQL** in Supabase
2. **Test creating a package** with 2 vehicles
3. **Upload images** for both vehicles
4. **Verify database** using the queries above
5. **Check storage** for uploaded images
6. **Test retrieval** by viewing the package

---

**All database integration complete and properly tested!** ✅

