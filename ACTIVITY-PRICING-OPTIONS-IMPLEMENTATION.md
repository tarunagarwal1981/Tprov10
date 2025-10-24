# Activity Package Pricing Options Implementation

## Overview

This document describes the complete implementation of a comprehensive pricing system for activity packages with two distinct pricing types:

1. **Ticket Only Pricing** - Simple admission tickets with adult and child pricing
2. **Ticket with Transfer Pricing** - Combined ticket + transfer packages with vehicle options

## 🎯 Features

### Ticket Only Pricing
- **Adult & Child Pricing** - Separate pricing for adults and children
- **Age Specifications** - Define age ranges for child pricing (e.g., 3-12 years)
- **Infant Pricing** - Optional pricing for infants (can be set to free)
- **Included Items** - List what's included with each ticket option
- **Featured Options** - Mark certain options as featured/recommended
- **Active/Inactive Status** - Control visibility of pricing options

### Ticket with Transfer Pricing
- **Vehicle Selection** - Multiple vehicle types (Sedan, SUV, Van, Bus, Luxury, Minibus, Minivan)
- **Vehicle Details** - Specify vehicle name/model and maximum capacity
- **Vehicle Features** - List amenities (AC, WiFi, leather seats, etc.)
- **Adult & Child Pricing** - Pricing per person including transfer
- **Infant Pricing** - Optional pricing for infants
- **Transfer Details** - Pickup and dropoff locations with instructions
- **Included Items** - Comprehensive list of what's included
- **Multiple Options** - Offer different vehicle types for the same activity

## 📊 Database Schema

### Tables Created

#### 1. `activity_ticket_only_pricing`
```sql
- id (UUID, Primary Key)
- package_id (UUID, Foreign Key → activity_packages)
- option_name (VARCHAR)
- description (TEXT, optional)
- adult_price (DECIMAL)
- child_price (DECIMAL)
- child_min_age (INTEGER)
- child_max_age (INTEGER)
- infant_price (DECIMAL, optional)
- infant_max_age (INTEGER, optional)
- included_items (TEXT[], array)
- excluded_items (TEXT[], array)
- is_active (BOOLEAN)
- is_featured (BOOLEAN)
- display_order (INTEGER)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### 2. `activity_ticket_with_transfer_pricing`
```sql
- id (UUID, Primary Key)
- package_id (UUID, Foreign Key → activity_packages)
- option_name (VARCHAR)
- description (TEXT, optional)
- vehicle_type (VARCHAR) - SEDAN, SUV, VAN, BUS, LUXURY, MINIBUS, MINIVAN
- vehicle_name (VARCHAR)
- max_capacity (INTEGER)
- vehicle_features (TEXT[], array)
- adult_price (DECIMAL)
- child_price (DECIMAL)
- child_min_age (INTEGER)
- child_max_age (INTEGER)
- infant_price (DECIMAL, optional)
- infant_max_age (INTEGER, optional)
- pickup_location (VARCHAR, optional)
- pickup_instructions (TEXT, optional)
- dropoff_location (VARCHAR, optional)
- dropoff_instructions (TEXT, optional)
- included_items (TEXT[], array)
- excluded_items (TEXT[], array)
- is_active (BOOLEAN)
- is_featured (BOOLEAN)
- display_order (INTEGER)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Security (RLS Policies)

Both tables have Row Level Security enabled with comprehensive policies:

**For Tour Operators:**
- ✅ View their own pricing options
- ✅ Create pricing options for their packages
- ✅ Update their own pricing options
- ✅ Delete their own pricing options

**For Public/Travel Agents:**
- ✅ View only active pricing options for published packages

### Indexes

Performance indexes are created for:
- Package ID lookups
- Active status filtering
- Featured options
- Vehicle type filtering
- Display ordering

## 🎨 User Interface

### ActivityPricingOptionsTab Component

A comprehensive React component with the following features:

#### Ticket Only Section
- **Card-based UI** - Each pricing option displayed as a collapsible card
- **Inline Editing** - Edit mode with full form validation
- **Visual Pricing Display** - Color-coded pricing for adults, children, and infants
- **Included Items** - Expandable list of what's included
- **Status Badges** - Visual indicators for featured and inactive options
- **Easy Management** - Add, edit, delete with confirmation

#### Ticket with Transfer Section
- **Vehicle Information Display** - Shows vehicle type, name, and capacity
- **Feature Tags** - Visual display of vehicle amenities
- **Transfer Details** - Pickup and dropoff information
- **Capacity Indicators** - Clear display of maximum passengers
- **Pricing Summary** - Comprehensive pricing breakdown
- **Multiple Options** - Support for multiple vehicle choices

### User Experience Features
- ✨ Smooth animations for adding/editing/removing options
- 🎯 Real-time form validation
- 📱 Responsive design for mobile and desktop
- 🌙 Dark mode support
- ♿ Accessible with keyboard navigation
- 💾 Auto-save integration (optional)

## 💻 Implementation Files

### 1. Database Schema
**File:** `create-activity-pricing-options-schema.sql`
- Complete table definitions
- RLS policies
- Indexes for performance
- Triggers for timestamp updates
- Comprehensive comments

### 2. TypeScript Types
**File:** `src/lib/types/activity-package.ts` (updated)
- `VehicleType` enum
- `TicketOnlyPricingOption` interface
- `TicketWithTransferPricingOption` interface
- `ActivityPricingOptions` container interface
- Updated `ActivityPackageFormData` to include pricing options

### 3. Backend Service
**File:** `src/lib/supabase/activity-pricing-options.ts`
- CRUD operations for ticket-only pricing
- CRUD operations for ticket-with-transfer pricing
- Bulk upsert operations
- Data transformation functions (database ↔ TypeScript)
- Combined operations for fetching all options
- Public API for active options only

### 4. UI Component
**File:** `src/components/packages/forms/tabs/ActivityPricingOptionsTab.tsx`
- `TicketOnlyCard` component
- `TicketWithTransferCard` component
- Main `ActivityPricingOptionsTab` component
- Form integration with React Hook Form
- Animation and transition effects

## 🚀 Setup Instructions

### Step 1: Run Database Migration

1. Open your Supabase SQL Editor
2. Run the SQL file:
```sql
-- Execute: create-activity-pricing-options-schema.sql
```

This creates:
- Both pricing tables
- Indexes for performance
- RLS policies for security
- Triggers for automatic timestamp updates

### Step 2: Verify Tables

Run this query to verify the tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'activity_ticket_only_pricing',
    'activity_ticket_with_transfer_pricing'
  );
```

### Step 3: Integrate into Activity Package Form

Update your `ActivityPackageForm.tsx` to include the new pricing options tab:

```typescript
import { ActivityPricingOptionsTab } from './tabs/ActivityPricingOptionsTab';

// In your tabs configuration:
const tabs: TabInfo[] = [
  // ... existing tabs ...
  {
    id: 'pricing-options',
    label: 'Pricing Options',
    icon: <FaTicketAlt className="h-4 w-4" />,
    badge: 0,
    isComplete: false,
    hasErrors: false,
  },
  // ... other tabs ...
];

// In your tab content:
const tabContent = {
  // ... existing tab content ...
  'pricing-options': <ActivityPricingOptionsTab />,
  // ... other tab content ...
};
```

### Step 4: Update Form Save Logic

Add pricing options save logic to your activity package save function:

```typescript
import { savePricingOptions } from '@/lib/supabase/activity-pricing-options';

// In your save function:
const handleSave = async (formData: ActivityPackageFormData) => {
  // ... save other package data ...
  
  if (packageId && formData.pricingOptions) {
    await savePricingOptions(
      packageId,
      formData.pricingOptions.ticketOnlyOptions || [],
      formData.pricingOptions.ticketWithTransferOptions || []
    );
  }
};
```

### Step 5: Load Pricing Options

Load pricing options when editing an existing package:

```typescript
import { getAllPricingOptions } from '@/lib/supabase/activity-pricing-options';

// When loading package:
const loadPackage = async (packageId: string) => {
  // ... load package data ...
  
  const pricingOptions = await getAllPricingOptions(packageId);
  
  // Set form data with pricing options
  reset({
    ...packageData,
    pricingOptions,
  });
};
```

## 📝 Usage Examples

### Creating a Ticket Only Option

```typescript
const ticketOption: TicketOnlyPricingOption = {
  id: generateId(),
  optionName: 'Standard Admission',
  description: 'General admission to the activity',
  adultPrice: 50.00,
  childPrice: 25.00,
  childMinAge: 3,
  childMaxAge: 12,
  infantPrice: 0, // Free for infants
  infantMaxAge: 2,
  includedItems: [
    'Activity entrance',
    'Safety equipment',
    'Professional guide',
    'Water bottle'
  ],
  excludedItems: ['Meals', 'Transport'],
  isActive: true,
  isFeatured: true,
  displayOrder: 1,
};
```

### Creating a Ticket with Transfer Option

```typescript
const transferOption: TicketWithTransferPricingOption = {
  id: generateId(),
  optionName: 'Premium Package with Hotel Transfer',
  description: 'Activity ticket with round-trip hotel transfer in luxury vehicle',
  vehicleType: 'SEDAN',
  vehicleName: 'Mercedes E-Class',
  maxCapacity: 4,
  vehicleFeatures: [
    'Air conditioning',
    'WiFi',
    'Leather seats',
    'Bottled water',
    'Phone charger'
  ],
  adultPrice: 75.00,
  childPrice: 40.00,
  childMinAge: 3,
  childMaxAge: 12,
  infantPrice: 10.00,
  infantMaxAge: 2,
  pickupLocation: 'Hotel lobby',
  pickupInstructions: 'Driver will wait in lobby with name sign',
  dropoffLocation: 'Activity venue',
  dropoffInstructions: 'Return pickup at same location',
  includedItems: [
    'Activity entrance',
    'Safety equipment',
    'Professional guide',
    'Round-trip hotel transfer',
    'Bottled water',
    'Snacks'
  ],
  excludedItems: ['Meals', 'Gratuities'],
  isActive: true,
  isFeatured: true,
  displayOrder: 1,
};
```

## 🔍 API Functions

### Ticket Only Pricing

```typescript
// Get all ticket-only options for a package
const options = await getTicketOnlyPricingOptions(packageId);

// Create a new option
const newOption = await createTicketOnlyPricingOption(packageId, optionData);

// Update an option
const updated = await updateTicketOnlyPricingOption(optionId, packageId, updates);

// Delete an option
await deleteTicketOnlyPricingOption(optionId);

// Bulk upsert (create/update/delete)
const saved = await upsertTicketOnlyPricingOptions(packageId, options);
```

### Ticket with Transfer Pricing

```typescript
// Get all ticket-with-transfer options for a package
const options = await getTicketWithTransferPricingOptions(packageId);

// Create a new option
const newOption = await createTicketWithTransferPricingOption(packageId, optionData);

// Update an option
const updated = await updateTicketWithTransferPricingOption(optionId, packageId, updates);

// Delete an option
await deleteTicketWithTransferPricingOption(optionId);

// Bulk upsert (create/update/delete)
const saved = await upsertTicketWithTransferPricingOptions(packageId, options);
```

### Combined Operations

```typescript
// Get all pricing options at once
const allOptions = await getAllPricingOptions(packageId);
// Returns: { ticketOnlyOptions: [], ticketWithTransferOptions: [] }

// Save all pricing options at once
await savePricingOptions(
  packageId,
  ticketOnlyOptions,
  ticketWithTransferOptions
);

// Get only active options (for public display)
const activeOptions = await getActivePricingOptions(packageId);
```

## 🎨 Styling

The component uses:
- Tailwind CSS for styling
- Custom package-specific classes (package-text-fix, package-button-fix)
- Framer Motion for animations
- Dark mode support via dark: variants
- Responsive design with md: breakpoints

## 🔧 Customization

### Adding New Vehicle Types

Update the enum in the database schema and TypeScript types:

```sql
-- In database schema:
CHECK (vehicle_type IN ('SEDAN', 'SUV', 'VAN', 'BUS', 'LUXURY', 'MINIBUS', 'MINIVAN', 'YOUR_NEW_TYPE'))
```

```typescript
// In TypeScript:
export type VehicleType = 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS' | 'MINIVAN' | 'YOUR_NEW_TYPE';
```

### Customizing Age Ranges

Default age ranges can be customized when creating new options:
- Child: 3-12 years (customizable)
- Infant: 0-2 years (customizable)

### Adding Custom Fields

To add custom fields:
1. Update database schema (add column)
2. Update TypeScript interface
3. Update transformation functions in service layer
4. Update UI component to display/edit the field

## 🐛 Troubleshooting

### Issue: Pricing options not saving
**Solution:** Ensure package exists and user has proper permissions (operator role)

### Issue: RLS policies blocking access
**Solution:** Verify user is authenticated and owns the package

### Issue: Type errors in TypeScript
**Solution:** Ensure all types are imported from `@/lib/types/activity-package`

### Issue: Missing vehicle features
**Solution:** Check that arrays are properly initialized (not null)

## 📚 Best Practices

1. **Always validate pricing** - Ensure adult_price >= child_price >= infant_price
2. **Age range validation** - child_max_age > child_min_age
3. **Capacity limits** - Set realistic max_capacity for vehicles
4. **Featured options** - Limit to 1-2 featured options per package
5. **Active status** - Use is_active to hide options without deleting
6. **Display order** - Set logical ordering for better UX
7. **Descriptions** - Provide clear descriptions for each option
8. **Included items** - Be comprehensive and specific

## 🚦 Next Steps

1. ✅ Run database migration
2. ✅ Integrate into activity package form
3. ✅ Test creating/editing/deleting options
4. ⬜ Add validation rules in UI
5. ⬜ Create booking flow integration
6. ⬜ Add pricing calculation logic
7. ⬜ Create public-facing pricing display
8. ⬜ Add analytics for pricing options
9. ⬜ Implement A/B testing for pricing
10. ⬜ Add seasonal pricing adjustments

## 📄 Related Files

- `create-activity-pricing-options-schema.sql` - Database schema
- `src/lib/types/activity-package.ts` - TypeScript types
- `src/lib/supabase/activity-pricing-options.ts` - Backend service
- `src/components/packages/forms/tabs/ActivityPricingOptionsTab.tsx` - UI component
- `src/components/packages/forms/ActivityPackageForm.tsx` - Main form

## 🤝 Contributing

When extending this implementation:
1. Follow existing naming conventions
2. Add proper TypeScript types
3. Include RLS policies for new tables
4. Add indexes for performance
5. Update documentation
6. Write tests for new features

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review the code comments
3. Check Supabase logs for database errors
4. Verify RLS policies are correct
5. Test with different user roles

---

**Version:** 1.0.0  
**Last Updated:** October 24, 2025  
**Author:** Travel Selbuy Development Team

