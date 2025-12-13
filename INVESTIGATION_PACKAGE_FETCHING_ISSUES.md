# Investigation Report: Package Fetching Issues in Travel Agent Dashboard

## Overview
Investigation of the itinerary creation flow where packages are fetched based on query destinations. Some packages are not being fetched as expected.

## Flow Analysis

### 1. Query Form Flow
**File**: `src/components/agent/QueryModal.tsx`
- Agent fills in destinations (cities with nights), leaving from, nationality, leaving on date, travelers, etc.
- Data is saved to `itinerary_queries` table via `/api/queries` endpoint
- Destinations are stored as: `[{city: string, nights: number}, ...]`

### 2. Insert Itinerary Page Flow
**File**: `src/app/agent/leads/[leadId]/insert/page.tsx`

**Steps:**
1. Fetches query data: `GET /api/queries/${leadId}`
2. Extracts cities from query: `query.destinations.map(d => d.city)`
3. Calls `fetchPackages(cities)` with array of city names
4. Makes two API calls:
   - `GET /api/packages/multi-city?cities=${citiesParam}` (cities joined by comma)
   - `GET /api/packages/multi-city-hotel?cities=${citiesParam}` (cities joined by comma)

### 3. API Route Implementation
**Files**: 
- `src/app/api/packages/multi-city/route.ts`
- `src/app/api/packages/multi-city-hotel/route.ts`

**Current Implementation:**
```typescript
// 1. Parse cities parameter
const citiesParam = searchParams.get('cities');
const cities = citiesParam ? citiesParam.split(',').map(c => c.trim().toLowerCase()) : [];

// 2. Fetch ALL published packages (LIMIT 50)
const packagesResult = await query(`
  SELECT id, title, ... 
  FROM multi_city_packages 
  WHERE status = 'published'
  LIMIT 50
`);

// 3. Fetch cities for those packages
const citiesResult = await query(`
  SELECT package_id, name, nights 
  FROM multi_city_package_cities 
  WHERE package_id::text = ANY($1::text[])
`, [packageIds]);

// 4. Filter packages by matching cities
matchingPackages = packagesResult.rows.filter((pkg: any) => {
  const pkgCities = citiesResult.rows
    .filter((c: any) => c.package_id === pkg.id)
    .map((c: any) => c.name.toLowerCase());
  
  return cities.some(queryCity => 
    pkgCities.some((pkgCity: string) => 
      pkgCity.includes(queryCity) || queryCity.includes(pkgCity)
    )
  );
});
```

## Issues Identified

### ✅ Issue #1: LIMIT 50 Restriction - **FIXED**
**Problem**: Only the first 50 published packages are fetched, then filtered. If there are more than 50 packages in the database, packages beyond the first 50 are never considered.

**Impact**: High - Packages beyond position 50 in the database will never be returned, regardless of city matching.

**Solution Implemented**: 
- ✅ Removed LIMIT 50 restriction
- ✅ Implemented database-level filtering using SQL EXISTS subqueries
- ✅ Filters packages at the database level before fetching related data
- ✅ Uses efficient Map-based lookups for combining results
- ✅ Optimized for 4-5k+ packages scalability

**New Implementation**:
- Uses SQL EXISTS subquery to filter packages that have matching cities
- Only fetches cities and images for packages that match the filter
- Reduces memory usage and improves query performance
- Scales efficiently for large datasets

### ✅ Issue #2: Loose City Name Matching - **FIXED**
**Problem**: The matching logic used bidirectional `includes()` which caused false positives and missed matches.

**Solution Implemented**:
- ✅ Created intelligent city matching system with 4 match levels:
  1. **Exact match**: Normalized city names match exactly
  2. **Alias match**: Cities are related (e.g., "Denpasar" ↔ "Bali")
  3. **Normalized match**: One city name contains the other (after normalization)
  4. **Partial match**: Word-level matching for significant words (3+ chars)
- ✅ City name normalization:
  - Removes country suffixes ("Bali, Indonesia" → "Bali")
  - Handles special characters and accents ("São Paulo" → "Sao Paulo")
  - Normalizes case and spacing
  - Removes common prefixes/suffixes ("The City", "Town")
- ✅ City alias mapping for related cities:
  - "Bali" includes: Denpasar, Ubud, Seminyak, Kuta, etc.
  - "New York" includes: NYC, Manhattan, Brooklyn
  - "Mumbai" includes: Bombay
  - And more...
- ✅ SQL-level filtering with intelligent conditions
- ✅ Post-processing filter for edge cases

**Impact**: High - Significantly improved matching accuracy, reduced false positives

### ✅ Issue #3: Package ID Comparison - **FIXED**
**Problem**: The filter used JavaScript strict equality which could fail with type mismatches.

**Solution Implemented**:
- ✅ Created `PackageId` type alias for type safety
- ✅ `normalizePackageId()` function:
  - Handles UUID, string, number, or any format
  - Converts all to consistent string type
  - Validates and throws on null/undefined
- ✅ `comparePackageIds()` function for safe comparisons
- ✅ All ID operations use normalized IDs:
  - Package ID extraction from query results
  - Map key creation (imagesMap, citiesMap)
  - Package-to-city/image matching
- ✅ Type-safe Map declarations: `Map<PackageId, ...>`
- ✅ Comprehensive logging for ID normalization issues
- ✅ Graceful handling of invalid IDs (skips with warning)

**Impact**: High - Eliminates type mismatch bugs, ensures consistent ID handling

### ✅ Issue #4: No Error Handling for City Fetching - **FIXED**
**Problem**: If queries failed or returned unexpected data, the process would fail silently or incorrectly.

**Solution Implemented**:
- ✅ Comprehensive error handling at each step:
  - Packages query with try-catch and validation
  - Cities query with try-catch (continues with empty array on failure)
  - Images query with try-catch (continues with empty array on failure)
  - Post-processing filter with try-catch (falls back to SQL results)
- ✅ Detailed logging system:
  - **Info logs**: Request start, query results, processing steps, completion
  - **Warning logs**: Invalid IDs, skipped items, partial failures
  - **Error logs**: Full error details with stack traces and context
- ✅ Performance tracking: Request duration measurement
- ✅ Graceful degradation: Continues with partial data rather than failing completely
- ✅ Context-rich error messages: Includes query info, parameter counts, timestamps

**Impact**: High - Prevents silent failures, enables debugging, improves reliability

### ✅ Issue #5: City Name Format Inconsistency - **FIXED**
**Problem**: Query cities and package cities had different formats, causing matching failures.

**Solution Implemented**:
- ✅ Comprehensive city name normalization function
- ✅ Handles all format variations:
  - "Bali, Indonesia" → "Bali" ✅
  - "Denpasar" → matches "Bali" via alias ✅
  - "NYC" → matches "New York" via alias ✅
  - "São Paulo" → normalized to "Sao Paulo" ✅
- ✅ Both SQL-level and post-processing normalization
- ✅ City alias mapping handles related cities

**Impact**: High - Format inconsistencies no longer cause missed matches

## Data Flow Diagram

```
Query Form (QueryModal.tsx)
    ↓
Save to itinerary_queries table
    ↓
Insert Itinerary Page (insert/page.tsx)
    ↓
Extract cities: ["Bali", "Lombok"]
    ↓
API Call: /api/packages/multi-city?cities=Bali,Lombok
    ↓
API Route (multi-city/route.ts)
    ↓
1. Fetch first 50 published packages
2. Fetch cities for those 50 packages
3. Filter: match query cities with package cities
    ↓
Return filtered packages
    ↓
Display in UI
```

## Testing Recommendations

1. **Test with >50 packages**: Create 60+ packages and verify all matching packages are returned
2. **Test city name variations**:
   - "Bali" vs "Denpasar"
   - "New York" vs "NYC"
   - "Bali, Indonesia" vs "Bali"
3. **Test exact matches**: Verify exact city name matches work
4. **Test partial matches**: Verify partial matches work as expected
5. **Test with no matching cities**: Verify empty result is returned correctly
6. **Test with special characters**: "São Paulo", "México City", etc.

## Priority Fixes

1. ✅ **HIGH**: Remove or fix LIMIT 50 issue - **FIXED**
   - Removed LIMIT 50 restriction
   - Implemented database-level filtering using SQL EXISTS subqueries
   - Optimized for 4-5k+ packages scalability
2. ✅ **MEDIUM**: Improve city name matching logic - **FIXED**
   - Implemented intelligent multi-level matching (exact, normalized, partial, alias)
   - Uses SQL-level filtering with intelligent conditions
   - Post-processing filter for edge cases
   - Handles city aliases and related cities (e.g., "Denpasar" matches "Bali")
3. ✅ **MEDIUM**: Add city name normalization - **FIXED**
   - Created `src/lib/utils/cityMatching.ts` with comprehensive normalization
   - Removes country suffixes ("Bali, Indonesia" → "Bali")
   - Handles special characters and accents
   - Normalizes abbreviations and variations
   - Includes city alias mapping for related cities
4. ✅ **LOW**: Add error handling and logging - **FIXED**
   - Comprehensive error handling at each step
   - Detailed logging with context (info, warning, error levels)
   - Graceful degradation (continues with partial data if some queries fail)
   - Performance metrics (request duration tracking)
5. ✅ **LOW**: Add type safety for package ID comparisons - **FIXED**
   - Created `PackageId` type for consistent ID handling
   - `normalizePackageId()` function ensures type safety
   - `comparePackageIds()` for safe comparisons
   - All ID comparisons now use normalized strings
   - Map-based lookups with type-safe keys

## Code Locations

- Query Form: `src/components/agent/QueryModal.tsx`
- Insert Page: `src/app/agent/leads/[leadId]/insert/page.tsx`
- Multi-City API: `src/app/api/packages/multi-city/route.ts`
- Multi-City Hotel API: `src/app/api/packages/multi-city-hotel/route.ts`
- Database Schema: `supabase_schema.sql` (lines 275-285, 397-406)

 