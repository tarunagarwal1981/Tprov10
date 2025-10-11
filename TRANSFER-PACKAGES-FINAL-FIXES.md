# 🔧 Transfer Packages - Final Fixes Needed

## Issue 1: Tabs Not Intuitive ❌
**Problem:** Too many tabs cause horizontal scrolling
- Basic Info
- Transfer Details  
- Vehicle Options
- Driver & Service
- Pricing & Policies
- Availability & Booking ← Hard to reach
- Review & Publish ← Hard to reach

**Solution:** Make tabs wrap to multiple rows

## Issue 2: Transfer Packages Not Showing ❌
**Problem:** Packages page only queries `activity_packages` table
```typescript
// Current (line 99):
.from('activity_packages')  // ❌ Only shows activity packages!
```

**Solution:** Query BOTH tables and combine results
```typescript
// Fetch activity packages
const activityPackages = await supabase.from('activity_packages')...
// Fetch transfer packages  
const transferPackages = await supabase.from('transfer_packages')...
// Combine them
const allPackages = [...activityPackages, ...transferPackages]
```

## Fixes to Apply:

### Fix 1: Update Packages Page Query
File: `src/app/operator/packages/page.tsx`
- Add transfer packages query
- Combine results
- Show package type badge

### Fix 2: Make Tabs Wrap
File: `src/components/packages/forms/TransferPackageForm.tsx`
- Update TabsList to allow wrapping
- Adjust layout for better mobile/desktop experience

