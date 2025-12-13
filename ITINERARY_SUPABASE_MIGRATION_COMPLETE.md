# Itinerary Flow Supabase Migration - Complete Guide

## ✅ Migration Status

**Phase 1: API Routes Created** ✅ COMPLETE
- ✅ PATCH/DELETE routes for itinerary days
- ✅ GET/PATCH/DELETE routes for itinerary items  
- ✅ Enhanced package details route with all data

**Phase 2: Frontend Migration** 🔄 IN PROGRESS
- ⏳ Configure page migration
- ⏳ EnhancedItineraryBuilder migration
- ⏳ Other components migration

**Phase 3: Database Verification** ⏳ PENDING
- ⏳ Verify all tables exist in AWS RDS
- ⏳ Run migration scripts if needed

---

## 📋 Created API Routes

### 1. Itinerary Days Management
- **PATCH** `/api/itineraries/[itineraryId]/days/[dayId]` - Update day (with time_slots backward compatibility)
- **DELETE** `/api/itineraries/[itineraryId]/days/[dayId]` - Delete day

### 2. Itinerary Items Management
- **GET** `/api/itineraries/[itineraryId]/items/[itemId]` - Get single item
- **PATCH** `/api/itineraries/[itineraryId]/items/[itemId]` - Update item
- **DELETE** `/api/itineraries/[itineraryId]/items/[itemId]` - Delete item

### 3. Package Details
- **GET** `/api/packages/[packageId]/details?type=multi_city|multi_city_hotel` - Get complete package details
  - Includes: package data, pricing packages, pricing rows, day plans, cities, hotels, images
  - Handles time_slots backward compatibility

---

## 🔄 Migration Pattern

Following the pattern from `AWS_MIGRATION_PLAN.md` and `FINAL_MIGRATION_SUMMARY.md`:

### Backend (API Routes)
1. Use `@/lib/aws/lambda-database` with `query` function
2. Handle backward compatibility (e.g., time_slots column)
3. Return proper error messages
4. Use parameterized queries for security

### Frontend Migration
1. Replace Supabase client calls with fetch to API routes
2. Update error handling
3. Maintain same data structures
4. Test each component independently

---

## 📝 Files to Migrate

### High Priority
1. **`src/app/agent/itineraries/[itineraryId]/configure/[itemId]/page.tsx`**
   - 36+ Supabase calls
   - Needs: Package details, pricing, hotels, day plans, cities
   - Use: `/api/packages/[packageId]/details` + item/day routes

2. **`src/components/itinerary/EnhancedItineraryBuilder.tsx`**
   - 4 Supabase calls
   - Needs: Create items, update days, fetch activities, delete items
   - Use: Item/day routes + activity search

### Medium Priority
3. **`src/components/itinerary/PackageConfigModal.tsx`**
   - Multiple Supabase calls
   - Use: Package routes

4. **`src/components/itinerary/ItineraryBuilderPanel.tsx`**
   - Multiple Supabase calls
   - Use: Day/item routes

### Low Priority
5. **`src/components/itinerary/ActivitySelectorModal.tsx`**
   - Light Supabase usage
   - Use: Activity search routes

---

## 🗄️ Database Tables Verification

All tables should already exist in AWS RDS (from previous migration). Verify:

### Itinerary Tables
- ✅ `itineraries`
- ✅ `itinerary_days` (with optional `time_slots` column)
- ✅ `itinerary_items`

### Package Tables
- ✅ `multi_city_packages`
- ✅ `multi_city_hotel_packages`
- ✅ `multi_city_pricing_packages`
- ✅ `multi_city_hotel_pricing_packages`
- ✅ `multi_city_pricing_rows`
- ✅ `multi_city_hotel_pricing_rows`
- ✅ `multi_city_private_package_rows`
- ✅ `multi_city_hotel_private_package_rows`
- ✅ `multi_city_package_day_plans`
- ✅ `multi_city_hotel_package_day_plans`
- ✅ `multi_city_package_cities`
- ✅ `multi_city_hotel_package_cities`
- ✅ `multi_city_hotel_package_city_hotels`
- ✅ `multi_city_package_images`
- ✅ `multi_city_hotel_package_images`

### Verification Script
```bash
# Connect to RDS and verify tables
psql --host=[RDS_ENDPOINT] \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  -c "\dt" | grep -E "(itinerary|multi_city)"
```

---

## 🚀 Next Steps

1. **Migrate Configure Page** (Highest Priority)
   - Replace all Supabase calls with API routes
   - Test package loading
   - Test save functionality

2. **Migrate EnhancedItineraryBuilder**
   - Replace Supabase calls
   - Test activity/transfer adding
   - Test day updates

3. **Migrate Other Components**
   - PackageConfigModal
   - ItineraryBuilderPanel
   - ActivitySelectorModal

4. **Database Verification**
   - Run verification script
   - Check for missing columns
   - Run migrations if needed

5. **Testing**
   - End-to-end itinerary creation
   - Package configuration
   - Day/item management
   - Error handling

---

## 📚 Reference Documents

- `AWS_MIGRATION_PLAN.md` - Overall migration strategy
- `AWS_MIGRATION_STEP_BY_STEP.md` - Detailed steps
- `FINAL_MIGRATION_SUMMARY.md` - Completed migrations
- `SUPABASE_MIGRATION_PLAN.md` - Original plan

---

## ⚠️ Important Notes

1. **Backward Compatibility**: All routes handle missing `time_slots` column gracefully
2. **Error Handling**: All routes return proper error messages
3. **Security**: All queries use parameterized statements
4. **Testing**: Test each route independently before frontend migration

---

**Last Updated**: 2025-12-13
**Status**: API Routes Complete, Frontend Migration In Progress

