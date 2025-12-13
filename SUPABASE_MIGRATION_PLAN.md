# Supabase to Lambda Database Migration Plan - Itinerary Flow

## Overview
This document tracks all Supabase usages in the itinerary creation/management flow that need to be migrated to Lambda Database Service (API routes).

## Files with Supabase Usage

### 1. **`src/app/agent/itineraries/[itineraryId]/configure/[itemId]/page.tsx`** ⚠️ CRITICAL
**Status**: Heavy Supabase usage - needs migration

**Supabase Calls Found**:
- Line 99: Fetch itinerary (`itineraries` table)
- Line 109: Fetch itinerary item (`itinerary_items` table)
- Line 143: Fetch multi-city hotel package (`multi_city_hotel_packages`)
- Line 152: Fetch pricing packages (`multi_city_hotel_pricing_packages`)
- Line 168: Fetch pricing rows (`multi_city_hotel_pricing_rows`)
- Line 175: Fetch private package rows (`multi_city_hotel_private_package_rows`)
- Line 192: Fetch day plans (`multi_city_hotel_package_day_plans`)
- Line 201: Fetch cities (`multi_city_hotel_package_cities`)
- Line 211: Fetch hotels (`multi_city_hotel_package_city_hotels`)
- Line 278: Fetch cities (fallback)
- Line 289: Fetch hotels (fallback)
- Line 414: Fetch activity items (`itinerary_items`)
- Line 454: Fetch transfer items (`itinerary_items`)
- Line 488: Fetch multi-city package (`multi_city_packages`)
- Line 497: Fetch pricing packages
- Line 513: Fetch pricing rows
- Line 520: Fetch private package rows
- Line 537: Fetch day plans (`multi_city_package_day_plans`)
- Line 553: Fetch cities (`multi_city_package_cities`)
- Line 758: Fetch pricing option
- Line 789: Create activity item (`itinerary_items`)
- Line 846: Create transfer item (`itinerary_items`)
- Line 901: Delete activity item
- Line 928: Delete transfer item
- Line 1002: Update itinerary item
- Line 1015: Fetch existing days (`itinerary_days`)
- Line 1045: Update day (`itinerary_days`) - **Recently fixed for backward compatibility**
- Line 1076: Create day (`itinerary_days`) - **Recently fixed for backward compatibility**
- Line 1110: Update itinerary item day_id
- Line 1125: Update activity item day_id
- Line 1133: Update transfer item day_id
- Line 1141: Fetch all items (`itinerary_items`)
- Line 1152: Update itinerary total price

**Migration Strategy**:
1. Replace itinerary/itinerary_item fetches with `/api/itineraries/[itineraryId]` and `/api/itineraries/[itineraryId]/items`
2. Replace package fetches with `/api/packages/[packageId]?type=...`
3. Create new API routes for:
   - Update itinerary day: `PATCH /api/itineraries/[itineraryId]/days/[dayId]`
   - Update itinerary item: `PATCH /api/itineraries/[itineraryId]/items/[itemId]`
   - Delete itinerary item: `DELETE /api/itineraries/[itineraryId]/items/[itemId]`
   - Fetch pricing data: `/api/packages/[packageId]/pricing?type=...`
   - Fetch day plans: `/api/packages/[packageId]/day-plans?type=...`
   - Fetch hotels: `/api/packages/[packageId]/hotels?type=...`

### 2. **`src/components/itinerary/EnhancedItineraryBuilder.tsx`**
**Status**: Moderate Supabase usage

**Supabase Calls Found**:
- Line 129: Create activity item (`itinerary_items`)
- Line 175: Update day time_slots (`itinerary_days`) - **Recently fixed for backward compatibility**
- Line 199: Fetch activities (`activity_packages`)
- Line 603: Delete item (`itinerary_items`)

**Migration Strategy**:
- Use `/api/itineraries/[itineraryId]/items/create` for creating items
- Use `/api/itineraries/[itineraryId]/days/[dayId]` for updating days (needs to be created)
- Use `/api/packages?type=activity&destination=...` for fetching activities
- Use `DELETE /api/itineraries/[itineraryId]/items/[itemId]` for deleting items

### 3. **`src/components/itinerary/PackageConfigModal.tsx`**
**Status**: Heavy Supabase usage

**Supabase Calls Found**:
- Multiple package fetches (multi-city, multi-city-hotel, transfer, fixed-departure)
- Fetching pricing, cities, hotels, day plans
- Creating itinerary items

**Migration Strategy**:
- Use existing `/api/packages/[packageId]?type=...` routes
- Create new routes for pricing, hotels, day plans if needed
- Use `/api/itineraries/[itineraryId]/items/create` for creating items

### 4. **`src/components/itinerary/ItineraryBuilderPanel.tsx`**
**Status**: Moderate Supabase usage

**Supabase Calls Found**:
- Delete day (`itinerary_days`)
- Delete item (`itinerary_items`)
- Fetch days (`itinerary_days`)
- Fetch items (`itinerary_items`)
- Update day (`itinerary_days`)

**Migration Strategy**:
- Use `/api/itineraries/[itineraryId]/days` for fetching days
- Use `/api/itineraries/[itineraryId]/items` for fetching items
- Create `DELETE /api/itineraries/[itineraryId]/days/[dayId]`
- Create `DELETE /api/itineraries/[itineraryId]/items/[itemId]`
- Create `PATCH /api/itineraries/[itineraryId]/days/[dayId]` for updating days

### 5. **`src/components/itinerary/ActivitySelectorModal.tsx`**
**Status**: Light Supabase usage

**Supabase Calls Found**:
- Fetch activities (`activity_packages`)

**Migration Strategy**:
- Use `/api/packages?type=activity&destination=...` or create dedicated route

## Missing API Routes Needed

### Days Management
- [ ] `PATCH /api/itineraries/[itineraryId]/days/[dayId]` - Update day (including time_slots)
- [ ] `DELETE /api/itineraries/[itineraryId]/days/[dayId]` - Delete day

### Items Management
- [ ] `GET /api/itineraries/[itineraryId]/items/[itemId]` - Get single item
- [ ] `PATCH /api/itineraries/[itineraryId]/items/[itemId]` - Update item
- [ ] `DELETE /api/itineraries/[itineraryId]/items/[itemId]` - Delete item

### Package Data
- [ ] `GET /api/packages/[packageId]/pricing?type=...` - Get pricing packages
- [ ] `GET /api/packages/[packageId]/day-plans?type=...` - Get day plans
- [ ] `GET /api/packages/[packageId]/hotels?type=...` - Get hotels
- [ ] `GET /api/packages/[packageId]/cities?type=...` - Get cities

### Itinerary Updates
- [ ] `PATCH /api/itineraries/[itineraryId]` - Already exists, verify it handles total_price updates

## Migration Priority

### Phase 1: Critical Routes (High Priority)
1. Create update/delete routes for days and items
2. Migrate configure page (`[itemId]/page.tsx`) - most critical
3. Migrate EnhancedItineraryBuilder component

### Phase 2: Supporting Routes (Medium Priority)
4. Create package data routes (pricing, hotels, day plans)
5. Migrate PackageConfigModal
6. Migrate ItineraryBuilderPanel

### Phase 3: Cleanup (Low Priority)
7. Migrate ActivitySelectorModal
8. Remove all Supabase imports
9. Test all flows end-to-end

## Notes

- **Backward Compatibility**: The recent fixes for `time_slots` column backward compatibility should be preserved in new API routes
- **Error Handling**: All new API routes should handle missing columns gracefully
- **Testing**: Each migration should be tested independently before moving to next phase

## Current Status

✅ **Completed**:
- Basic itinerary CRUD routes exist
- Days bulk-create route exists (with backward compatibility)
- Items create route exists (with error handling)
- Days GET route exists (with backward compatibility)

❌ **Needs Work**:
- Update/Delete routes for days
- Update/Delete routes for items
- Package data routes (pricing, hotels, day plans)
- Migration of frontend components

