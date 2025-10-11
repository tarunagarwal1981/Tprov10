## 🚚 Transfer Packages - Complete Setup Guide

Congratulations! I've created the complete infrastructure for Transfer Packages. Here's everything you need to get it working.

---

## 📋 What's Been Created

### 1. **Database Schema** ✅
- **File:** `create-transfer-packages-schema.sql`
- **Tables Created:**
  - `transfer_packages` - Main package table
  - `transfer_package_images` - Package images
  - `transfer_package_vehicles` - Vehicle configurations
  - `transfer_vehicle_images` - Vehicle photos
  - `transfer_package_stops` - Multi-stop locations
  - `transfer_additional_services` - Extra services
  - `transfer_pricing_rules` - Distance/time-based pricing
  - `transfer_time_slots` - Available time slots
  - `transfer_booking_restrictions` - Blackout dates

### 2. **Supabase Functions** ✅
- **File:** `src/lib/supabase/transfer-packages.ts`
- **Functions:**
  - `createTransferPackage` - Create new transfer
  - `getTransferPackage` - Get single transfer
  - `updateTransferPackage` - Update transfer
  - `deleteTransferPackage` - Delete transfer
  - `listTransferPackages` - List transfers
  - `formDataToDatabase` - Convert form to DB format

### 3. **React Hooks** ✅
- **File:** `src/hooks/useTransferPackage.ts`
- **Hooks:**
  - `useTransferPackage` - Main hook
  - `useCreateTransferPackage` - For creation
  - `useEditTransferPackage` - For editing
  - `useTransferPackageList` - For listing

### 4. **TypeScript Types** ✅
- **File:** `src/lib/types/transfer-package.ts` (already exists)
- Complete type definitions for all transfer data structures

---

## 🚀 Setup Steps (30 minutes)

### **Step 1: Create Database Tables** ⏱️ 5 min

1. Open Supabase SQL Editor:
   - URL: https://supabase.com/dashboard/project/megmjzszmqnmzdxwzigt/sql

2. Copy **ALL** contents from `create-transfer-packages-schema.sql`

3. Click **Run** ▶️

4. You should see:
   ```
   ✅ 9 tables created
   ✅ RLS enabled on all tables
   ✅ 20+ policies created
   ✅ "Transfer packages schema created successfully!"
   ```

5. Verify tables exist:
   - Go to Table Editor
   - You should see all `transfer_*` tables

---

### **Step 2: Set Up Storage Bucket** ⏱️ 3 min

**Use the SAME bucket as activity packages:**

The code uses `activity-packages-images` bucket (same as activity packages).

**If you don't have it yet:**
1. Go to Storage: https://supabase.com/dashboard/project/megmjzszmqnmzdxwzigt/storage/buckets
2. Create bucket: `activity-packages-images`
3. Set as **Public**
4. Add storage policies (see previous guide)

**Storage is already set up from activity packages!** ✅

---

### **Step 3: Update Transfer Form to Use Hook** ⏱️ 10 min

Update `src/components/packages/forms/TransferPackageForm.tsx`:

```typescript
// Add these imports at the top
import { useTransferPackage } from '@/hooks/useTransferPackage';

// Inside the TransferPackageForm component, add:
export const TransferPackageForm: React.FC<TransferPackageFormProps> = ({
  initialData,
  onSave,
  onPublish,
  onPreview,
  className,
  mode = 'create',
  packageId,
}) => {
  // ... existing state ...

  // Add the hook
  const {
    package: dbPackage,
    createPackage,
    updatePackage,
    loading: packageLoading,
    saving: packageSaving,
    error: packageError,
    clearError,
  } = useTransferPackage({ packageId, autoLoad: mode === 'edit' });

  // Update handleSave function
  const handleSave = async (data: TransferPackageFormData) => {
    setIsSubmitting(true);
    clearError();
    
    try {
      let success = false;
      
      if (mode === 'create') {
        success = await createPackage(data);
      } else if (mode === 'edit' && packageId) {
        success = await updatePackage(data);
      }
      
      if (success && onSave) {
        await onSave(data);
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update handlePublish function similarly
  const handlePublish = async (data: TransferPackageFormData) => {
    if (!validation.isValid) {
      setActiveTab('review');
      return;
    }

    setIsSubmitting(true);
    clearError();
    
    try {
      let success = false;
      
      if (mode === 'create') {
        success = await createPackage(data);
      } else if (mode === 'edit' && packageId) {
        success = await updatePackage(data);
      }
      
      if (success && onPublish) {
        await onPublish(data);
      }
    } catch (error) {
      console.error('Publish failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... rest of component ...
};
```

---

### **Step 4: Update Package Creation Page** ⏱️ 5 min

Update `src/app/operator/packages/create/page.tsx`:

```typescript
// Make sure TransferPackageForm is imported and used correctly
import { TransferPackageForm } from '@/components/packages/forms/TransferPackageForm';

// In the component where you render the form:
{selectedType === 'transfer' && (
  <TransferPackageForm
    mode="create"
    onSave={async (data) => {
      console.log('Transfer package created:', data);
      toast.success('Transfer package created successfully!');
    }}
    onPublish={async (data) => {
      console.log('Transfer package published:', data);
      toast.success('Transfer package published!');
    }}
  />
)}
```

---

### **Step 5: Test the Integration** ⏱️ 7 min

1. **Commit and Push:**
   ```bash
   git add -A
   git commit -m "Add transfer packages database and hooks"
   git push origin dev
   git checkout main
   git merge dev
   git push origin main
   ```

2. **Wait for Deployment** (~2-3 min)

3. **Test Creating Transfer:**
   - Go to: https://travelselbuy.netlify.app/operator/packages/create
   - Click "Transfer" type
   - Fill in the form:
     - Title: "Airport Transfer - City Center"
     - Description: "Comfortable airport to hotel transfer"
     - Transfer Type: One Way
     - Add at least 1 vehicle (Sedan, 4 passengers, $50)
   - Click "Save Draft"
   - Should see success message! ✅

4. **Verify in Database:**
   - Go to Supabase Table Editor
   - Check `transfer_packages` table
   - Your package should be there!

---

## 📊 Database Structure

### Main Package Fields
```sql
transfer_packages:
  - id (UUID)
  - operator_id (UUID) → auth.users
  - title, short_description, full_description
  - transfer_type (ONE_WAY | ROUND_TRIP | MULTI_STOP)
  - destination details (name, address, city, country, coordinates)
  - route info (distance, duration, route_points)
  - driver services (meet & greet, name board, flight tracking, etc.)
  - pricing (base_price, currency, cancellation policy)
  - availability (days, time slots, booking restrictions)
  - status (draft | published | archived | suspended)
```

### Related Tables
```sql
transfer_package_images → Images for package
transfer_package_vehicles → Vehicle options (sedan, SUV, van, etc.)
transfer_vehicle_images → Photos of vehicles
transfer_package_stops → Stops for multi-stop transfers
transfer_additional_services → Extra services (child seat, wifi, etc.)
transfer_pricing_rules → Dynamic pricing (distance, time-based)
transfer_time_slots → Available booking times
transfer_booking_restrictions → Blackout dates
```

---

## 🔒 RLS Policies (Already Set Up)

All tables have proper Row Level Security:

| Policy | What It Does |
|--------|-------------|
| Public can view published | Anyone can see published transfers |
| Operators can view own | Operators see their own packages (all statuses) |
| Operators can create | Operators can create packages |
| Operators can update own | Operators can edit their own packages |
| Operators can delete own | Operators can delete their own packages |

---

## 🎯 What You Can Do Now

After setup is complete, you can:

✅ Create transfer packages with full details
✅ Add multiple vehicle options (sedan, SUV, van, etc.)
✅ Set up multi-stop transfers
✅ Add photos for packages and vehicles
✅ Define pricing rules (distance-based, time-based)
✅ Set availability and booking restrictions
✅ Publish/archive/suspend packages
✅ Edit existing transfers
✅ Delete transfers

---

## 📁 File Structure

```
Tprov10/
├── create-transfer-packages-schema.sql  ← Run this in Supabase
├── src/
│   ├── lib/
│   │   ├── supabase/
│   │   │   └── transfer-packages.ts     ← Supabase functions
│   │   └── types/
│   │       └── transfer-package.ts      ← TypeScript types (exists)
│   ├── hooks/
│   │   └── useTransferPackage.ts        ← React hooks
│   └── components/
│       └── packages/
│           └── forms/
│               └── TransferPackageForm.tsx ← Update this
```

---

## 🐛 Troubleshooting

### Issue: "Table doesn't exist"
**Fix:** Run `create-transfer-packages-schema.sql` in Supabase SQL Editor

### Issue: "Permission denied" or 409 Conflict
**Fix:** RLS policies are already in the schema. If issues persist, run:
```sql
-- Make RLS more permissive for testing
ALTER TABLE transfer_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Operators can create transfer packages" ON transfer_packages;
CREATE POLICY "Operators can create transfer packages"
ON transfer_packages FOR INSERT TO authenticated
WITH CHECK (true);
```

### Issue: Storage upload fails
**Fix:** Use the same `activity-packages-images` bucket with policies from before

### Issue: Form doesn't connect to database
**Fix:** Make sure you've updated `TransferPackageForm.tsx` to use the `useTransferPackage` hook (see Step 3)

---

## ✅ Verification Checklist

- [ ] SQL schema executed successfully
- [ ] 9 tables visible in Supabase Table Editor
- [ ] RLS policies shown in table policies
- [ ] Storage bucket `activity-packages-images` exists with policies
- [ ] `TransferPackageForm.tsx` updated with hook
- [ ] Code committed and pushed to main
- [ ] Netlify deployed successfully
- [ ] Can create a transfer package via UI
- [ ] Package visible in `transfer_packages` table
- [ ] Can edit/delete the package

---

## 🎉 Next Steps

Once transfer packages are working:
1. Create a packages listing page for transfers
2. Add transfer package detail/preview page
3. Implement booking flow for transfers
4. Add pricing calculator for distance-based pricing
5. Create multi-city packages (if needed)

---

**Ready to set up transfer packages? Start with Step 1!** 🚀

