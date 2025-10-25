# Transfer Package Pricing Options Implementation

## Overview

This document describes the implementation of the pricing options feature for transfer packages. The feature allows tour operators to set up multiple pricing configurations for their transfer packages using two different pricing models:

1. **Hourly Pricing** - Price based on time duration (ideal for chauffeur services)
2. **Point-to-Point Pricing** - Fixed price for specific routes (ideal for airport transfers and intercity trips)

## Features

### Hourly Pricing Options
- Set duration in hours
- Specify vehicle type and name
- Define maximum passenger capacity
- Set hourly rate in USD
- Add optional description
- Manage active/inactive status
- Multiple options per package

### Point-to-Point Pricing Options
- Define "From" and "To" locations
- Optional address and coordinates for each location
- Specify vehicle type and name
- Define maximum passenger capacity
- Set fixed cost in USD
- Optional distance and estimated duration
- Add optional description
- Manage active/inactive status
- Multiple routes per package

## Database Schema

### Tables Created

#### 1. `transfer_hourly_pricing`
```sql
- id (UUID, Primary Key)
- package_id (UUID, Foreign Key → transfer_packages)
- hours (INTEGER)
- vehicle_type (VARCHAR)
- vehicle_name (VARCHAR)
- max_passengers (INTEGER)
- rate_usd (DECIMAL)
- description (TEXT, optional)
- features (TEXT[], array)
- is_active (BOOLEAN)
- display_order (INTEGER)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### 2. `transfer_point_to_point_pricing`
```sql
- id (UUID, Primary Key)
- package_id (UUID, Foreign Key → transfer_packages)
- from_location (VARCHAR)
- from_address (TEXT, optional)
- from_coordinates (JSONB, optional)
- to_location (VARCHAR)
- to_address (TEXT, optional)
- to_coordinates (JSONB, optional)
- distance (DECIMAL, optional)
- distance_unit (VARCHAR)
- estimated_duration_minutes (INTEGER, optional)
- vehicle_type (VARCHAR)
- vehicle_name (VARCHAR)
- max_passengers (INTEGER)
- cost_usd (DECIMAL)
- description (TEXT, optional)
- features (TEXT[], array)
- is_active (BOOLEAN)
- display_order (INTEGER)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Security (RLS Policies)

Both tables have Row Level Security enabled with the following policies:

**For Tour Operators:**
- Can view their own pricing options
- Can create pricing options for their packages
- Can update their own pricing options
- Can delete their own pricing options

**For Public/Travel Agents:**
- Can view only active pricing options for published packages

## Setup Instructions

### Step 1: Run Database Migration

Execute the SQL file to create the necessary tables:

```bash
# In your Supabase SQL Editor, run:
create-transfer-pricing-options-schema.sql
```

This will create:
- Both pricing tables
- Indexes for performance
- RLS policies
- Triggers for automatic timestamp updates

### Step 2: TypeScript Types

The following TypeScript types have been added to `src/lib/types/transfer-package.ts`:

```typescript
export interface HourlyPricingOption {
  id: string;
  hours: number;
  vehicleType: VehicleType;
  vehicleName: string;
  maxPassengers: number;
  rateUSD: number;
  description?: string;
  features: VehicleFeature[];
  isActive: boolean;
  displayOrder: number;
}

export interface PointToPointPricingOption {
  id: string;
  fromLocation: string;
  fromAddress?: string;
  fromCoordinates?: { latitude: number; longitude: number };
  toLocation: string;
  toAddress?: string;
  toCoordinates?: { latitude: number; longitude: number };
  distance?: number;
  distanceUnit: DistanceUnit;
  estimatedDurationMinutes?: number;
  vehicleType: VehicleType;
  vehicleName: string;
  maxPassengers: number;
  costUSD: number;
  description?: string;
  features: VehicleFeature[];
  isActive: boolean;
  displayOrder: number;
}
```

### Step 3: Frontend Components

A new component has been created for managing pricing options:

**Component:** `src/components/packages/forms/tabs/TransferPricingOptionsManager.tsx`

**Features:**
- Tabbed interface for Hourly vs Point-to-Point pricing
- Add/Edit/Delete functionality for both pricing types
- Beautiful card-based UI with icons and visual indicators
- Form validation
- Active/Inactive status management
- Drag-and-drop support (via display_order)

### Step 4: Integration

The pricing options manager is integrated into the `PricingPoliciesTab` component and appears at the top of the pricing section.

## Usage Guide

### For Tour Operators

#### Adding Hourly Pricing Option:

1. Navigate to the "Pricing & Policies" tab in the transfer package form
2. Click on the "Hourly Pricing" tab
3. Click "Add Option" button
4. Fill in:
   - Hours (e.g., 3, 5, 8)
   - Vehicle Type (Sedan, SUV, Van, etc.)
   - Vehicle Name (e.g., "Mercedes-Benz S-Class")
   - Max Passengers (e.g., 4)
   - Hourly Rate in USD (e.g., 75.00)
   - Optional: Description
5. Click "Add Option" to save

#### Adding Point-to-Point Pricing Option:

1. Navigate to the "Pricing & Policies" tab
2. Click on the "Point-to-Point" tab
3. Click "Add Route" button
4. Fill in:
   - From Location (e.g., "JFK Airport")
   - To Location (e.g., "Manhattan Hotel")
   - Vehicle Type
   - Vehicle Name
   - Max Passengers
   - Total Cost in USD (e.g., 120.00)
   - Optional: Addresses, Distance, Duration, Description
5. Click "Add Route" to save

#### Editing/Deleting Options:

- Click the **Edit** icon to modify an option
- Click the **Delete** icon to remove an option
- Toggle the **Active** switch to enable/disable an option

### For Travel Agents (Future Implementation)

When adding a transfer package to an itinerary, travel agents will be able to:

1. View all active pricing options for the package
2. Filter by:
   - Pricing type (Hourly vs Point-to-Point)
   - Vehicle type
   - Passenger capacity
3. Select the appropriate option that matches their client's needs
4. The selected pricing will be automatically applied to the booking

## API/Database Service Functions

The following functions have been updated in `src/lib/supabase/transfer-packages.ts`:

### Create Package
```typescript
createTransferPackage(data, userId)
// Now saves hourly_pricing and point_to_point_pricing
```

### Get Package
```typescript
getTransferPackage(id)
// Now retrieves hourly_pricing and point_to_point_pricing
```

### Update Package
```typescript
updateTransferPackage(id, data)
// Now updates hourly_pricing and point_to_point_pricing
```

### Form Data Conversion
```typescript
formDataToDatabase(formData, userId)
// Converts form data including pricing options to database format
```

## Data Flow

```
Tour Operator Creates Package
    ↓
Fills Transfer Package Form
    ↓
Adds Pricing Options (Hourly/P2P)
    ↓
Saves Package
    ↓
formDataToDatabase() converts form data
    ↓
createTransferPackage() saves to database
    ↓
Main package → transfer_packages table
Hourly options → transfer_hourly_pricing table
P2P options → transfer_point_to_point_pricing table
```

## Example Use Cases

### Use Case 1: Airport Transfer Service
**Pricing Type:** Point-to-Point

```
Route 1:
- From: "LAX Airport"
- To: "Downtown Los Angeles"
- Vehicle: "Toyota Camry" (Sedan)
- Max Passengers: 3
- Cost: $65

Route 2:
- From: "LAX Airport"
- To: "Santa Monica"
- Vehicle: "Mercedes-Benz Sprinter" (Van)
- Max Passengers: 10
- Cost: $120
```

### Use Case 2: Chauffeur Service
**Pricing Type:** Hourly

```
Option 1:
- Hours: 3
- Vehicle: "BMW 7 Series" (Luxury)
- Max Passengers: 3
- Rate: $85/hour

Option 2:
- Hours: 8
- Vehicle: "Mercedes-Benz S-Class" (Luxury)
- Max Passengers: 3
- Rate: $75/hour (discounted for longer duration)
```

### Use Case 3: Intercity Transfer
**Pricing Type:** Point-to-Point

```
Route:
- From: "New York City"
- To: "Boston"
- Distance: 215 miles
- Duration: 240 minutes
- Vehicle: "Cadillac Escalade" (SUV)
- Max Passengers: 6
- Cost: $450
```

## Future Enhancements

### Planned Features:
1. **Dynamic Pricing**
   - Peak hour surcharges
   - Seasonal pricing
   - Demand-based pricing

2. **Package Deals**
   - Discounts for round trips
   - Multi-day packages

3. **Advanced Filtering for Travel Agents**
   - Search by route
   - Filter by price range
   - Sort by vehicle type

4. **Price Calculation Engine**
   - Automatic calculation based on distance
   - Fuel surcharges
   - Additional fees (tolls, parking, etc.)

5. **Analytics Dashboard**
   - Most popular routes
   - Pricing optimization suggestions
   - Booking conversion rates per pricing option

## Troubleshooting

### Issue: Pricing options not saving
**Solution:** Ensure the database tables are created by running the SQL migration file.

### Issue: Cannot see pricing options
**Solution:** Check RLS policies and ensure the user has proper permissions.

### Issue: Form validation errors
**Solution:** Ensure all required fields are filled:
- Hourly: hours, vehicle_name, rate_usd, max_passengers
- P2P: from_location, to_location, vehicle_name, cost_usd, max_passengers

## Summary

This implementation provides a comprehensive pricing system for transfer packages that:
- ✅ Supports multiple pricing models (Hourly & Point-to-Point)
- ✅ Allows unlimited options per package
- ✅ Has proper database schema with RLS
- ✅ Includes beautiful, user-friendly UI
- ✅ Integrates seamlessly with existing transfer package flow
- ✅ Is ready for travel agent integration
- ✅ Follows best practices for security and performance

The system is production-ready and can handle complex pricing scenarios while remaining easy to use for tour operators.

