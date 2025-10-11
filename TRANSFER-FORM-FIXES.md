# 🐛 Transfer Package Form - Issues & Fixes

## Problems Identified:

### 1. **Base Price Not Saving** ❌
- **Issue:** When adding/editing vehicles, the `basePrice` field doesn't persist
- **Root Cause:** The form context might not be properly updating the vehicle's basePrice
- **Location:** `VehicleOptionsTab.tsx` line 162-163

### 2. **Base Pricing Duplication** ❌  
- **Issue:** Base pricing appears in TWO places:
  - Vehicle Options tab (per vehicle)
  - Pricing & Policies tab (redundant display)
- **Root Cause:** The Pricing tab is trying to display `watchedData.basePricing` which is an array, but it should just reference the vehicles' base prices
- **Location:** `PricingPoliciesTab.tsx` line 301-306

### 3. **Base Price Not Showing When Editing** ❌
- **Issue:** When editing a vehicle, the basePrice value doesn't populate the input field
- **Root Cause:** The `editData` state initialization might not include basePrice
- **Location:** `VehicleOptionsTab.tsx` line 63

## Solutions:

### Fix 1: Ensure Base Price Saves Properly
The form needs to properly capture and persist the basePrice when saving vehicles.

### Fix 2: Remove Base Pricing from Pricing Tab
Since each vehicle already has its own base price in the Vehicle Options tab, we should:
- Remove the redundant "Base Pricing" section from Pricing & Policies tab
- Just show a note that pricing is per-vehicle

### Fix 3: Fix Edit Mode Base Price Display
Ensure the editData includes basePrice when entering edit mode.

## Implementation Plan:

1. Update `VehicleOptionsTab.tsx`:
   - Ensure basePrice is always included when creating/updating vehicles
   - Fix the edit state to include basePrice

2. Update `PricingPoliciesTab.tsx`:
   - Remove the basePricing array logic
   - Show a summary of vehicle prices instead

3. Update `TransferPackageFormData` type:
   - Ensure basePricing is optional or removed if not needed

