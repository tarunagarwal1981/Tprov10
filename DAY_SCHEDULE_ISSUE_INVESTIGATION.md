# Day-Wise Schedule Not Showing - Investigation Report

## 🔍 Current Situation

**User Report:** Day-wise schedule is still not showing after CORS fix implementation.

**Logs Analysis:**
- ✅ Lambda calls are successful (backend working)
- ✅ Lead data fetching successful
- ✅ Itineraries and queries fetched (8 of each)
- ❌ No browser console errors shown in latest logs
- ❌ Day-wise schedule not displaying

## 📋 Flow Analysis

### 1. **Component Rendering Conditions**

The `DayByDayItineraryView` component only renders when ALL of these are true:
```typescript
isCreateItinerary && isExpanded && itinerary.query_id
```

**Where:**
- `isCreateItinerary = itinerary.name.toLowerCase().includes('create')` (line 626)
- `isExpanded = expandedItineraryId === itinerary.id` (line 627)
- `itinerary.query_id` must exist (line 727)

### 2. **Component State Logic**

The component shows different states based on:
- `loading || generatingDays` → Shows loading spinner
- `days.length === 0` → Shows "No days generated yet" message
- `days.length > 0` → Shows actual day-by-day schedule

### 3. **Data Fetching Flow**

**Initial Load (useEffect on mount):**
```typescript
useEffect(() => {
  if (itineraryId) {
    fetchDays();      // Fetches from /api/itineraries/[id]/days
    fetchItems();     // Fetches from /api/itineraries/[id]/items
    fetchRepository(); // Fetches from /api/packages/search
  }
}, [itineraryId]);
```

**Auto-Generation (useEffect when query exists):**
```typescript
useEffect(() => {
  if (queryId && days.length === 0 && !loading && !generatingDays) {
    generateDaysFromQuery(); // Calls /api/itineraries/[id]/days/generate-from-query
  }
}, [queryId, days.length, loading, generatingDays]);
```

## 🔎 Potential Issues

### Issue 1: **CORS Still Blocking (Even After Middleware)**

**Symptoms:**
- Fetch calls fail silently (caught in try-catch)
- `response.ok` is false
- Days array remains empty
- Component shows "No days generated yet"

**Check:**
- Browser Network tab → Look for failed requests
- Check response headers for CORS headers
- Verify middleware is actually running

**Why Middleware Might Not Work:**
- Next.js middleware might not execute in Amplify the same way
- Headers might be getting stripped
- Route handlers might be overriding headers

### Issue 2: **Component Not Rendering (Conditions Not Met)**

**Check:**
1. Is itinerary name exactly "Create Itinerary"? (case-sensitive check)
2. Is `expandedItineraryId` set to the itinerary ID?
3. Does `itinerary.query_id` exist?

**Debug:**
```javascript
// In browser console on Lead Detail page:
console.log('Itineraries:', window.itineraries);
console.log('Expanded ID:', window.expandedItineraryId);
```

### Issue 3: **Days Not Being Generated**

**Possible Causes:**
- `generateDaysFromQuery()` failing silently
- Query doesn't have destinations
- API route `/api/itineraries/[id]/days/generate-from-query` failing
- Days created but not fetched

**Check:**
- Browser console for "Error generating days" messages
- Network tab for POST to `/api/itineraries/[id]/days/generate-from-query`
- Database to see if days were actually created

### Issue 4: **Error Handling Too Silent**

**Current Code:**
```typescript
const fetchDays = async () => {
  try {
    const response = await fetch(`/api/itineraries/${itineraryId}/days`);
    if (response.ok) {
      const { days: daysData } = await response.json();
      setDays(daysData || []);
    }
    // ❌ No else clause - silently fails if response.ok is false
  } catch (err) {
    console.error('Error fetching days:', err);
    // ❌ Error logged but no user feedback
  } finally {
    setLoading(false);
  }
};
```

**Problem:** If the fetch fails (CORS, network, etc.), the error is caught but:
- No user-visible error message
- Days remain empty
- Component shows "No days generated yet" (which is misleading)

## 🧪 Investigation Steps Needed

### Step 1: Check Browser Console

**What to look for:**
1. CORS errors (should be gone if middleware works)
2. Network errors
3. "Error fetching days" messages
4. "Error generating days" messages
5. Any failed fetch requests

### Step 2: Check Network Tab

**For each API call:**
1. `/api/itineraries/[itineraryId]/days`
   - Status code (200? 404? 500?)
   - Response headers (CORS headers present?)
   - Response body (empty array? error message?)

2. `/api/itineraries/[itineraryId]/items`
   - Same checks as above

3. `/api/packages/search?type=activity&limit=1000`
   - Same checks as above

4. `/api/queries/by-id/[queryId]`
   - Same checks as above

5. `/api/itineraries/[itineraryId]/days/generate-from-query` (POST)
   - Same checks as above

### Step 3: Check Component State

**Add temporary logging:**
```typescript
console.log('[DayByDayItineraryView] State:', {
  itineraryId,
  queryId,
  days: days.length,
  loading,
  generatingDays,
  items: items.length
});
```

### Step 4: Verify Middleware is Running

**Check:**
1. Is middleware file in correct location? (`src/middleware.ts`)
2. Does Next.js detect it? (should be automatic)
3. Are CORS headers in response? (check Network tab)

### Step 5: Check Database

**Verify:**
1. Does itinerary have `query_id`?
2. Do days exist in `itinerary_days` table?
3. Does query have `destinations`?

## 🎯 Most Likely Root Causes

### **Scenario A: CORS Still Failing**
- Middleware not executing in Amplify
- Headers being stripped
- Need to add CORS headers directly in route handlers

### **Scenario B: Component Conditions Not Met**
- Itinerary name doesn't match "create" (case/typo)
- `expandedItineraryId` not set
- `query_id` is null/undefined

### **Scenario C: Days Generation Failing**
- `generateDaysFromQuery()` not being called
- API route failing
- Query missing destinations

### **Scenario D: Silent Failures**
- Fetch calls failing but errors caught silently
- No user feedback
- Component shows misleading "No days generated yet"

## 📝 Next Steps (Before Implementation)

1. **Get Browser Console Logs:**
   - All errors (especially CORS)
   - All console.log messages
   - Network request details

2. **Check Network Tab:**
   - Status codes for all API calls
   - Response headers (CORS headers?)
   - Response bodies

3. **Verify Component State:**
   - Is component rendering at all?
   - What state is it in? (loading, empty, error?)

4. **Check Database:**
   - Does itinerary have query_id?
   - Do days exist?

5. **Test Middleware:**
   - Is it running?
   - Are headers being added?

## 🔧 Potential Solutions (After Investigation)

### Solution 1: Add CORS Headers Directly in Route Handlers
If middleware isn't working in Amplify, add headers in each route.

### Solution 2: Improve Error Handling
Add better error messages and user feedback when fetches fail.

### Solution 3: Fix Component Conditions
Ensure all conditions for rendering are met and add debugging.

### Solution 4: Fix Days Generation
Ensure days are generated correctly and fetched properly.

---

**Please provide:**
1. Browser console errors (if any)
2. Network tab screenshots/details for failed requests
3. What you see on the page (loading spinner? "No days generated yet"? Nothing?)
4. Whether the "View Days" button is visible and clickable

