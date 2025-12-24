# Page Reload Issue Investigation

## 🔍 Problem Description

**User Report:**
- When clicking "View Days" button on a "Create Itinerary" card
- The page keeps reloading and comes back to create/insert package card page
- This happens repeatedly (infinite loop)

## 🎯 Root Cause Analysis

### **Finding 1: Button Click Handler**

**Location:** `src/app/agent/leads/[leadId]/page.tsx:715`

```typescript
<Button
  variant="outline"
  size="sm"
  onClick={() => setExpandedItineraryId(isExpanded ? null : itinerary.id)}
  className="flex-1"
>
```

**Analysis:**
- Button is NOT inside a `<form>` element (confirmed)
- Button does NOT have `type="button"` explicitly set
- Button component defaults to `<button>` (not `type="submit"` unless in a form)
- Click handler only updates state, no navigation

**Conclusion:** Button click handler itself is NOT causing the reload.

### **Finding 2: State Change Triggers**

**When `expandedItineraryId` is set:**
1. Component re-renders
2. `DayByDayItineraryView` component conditionally renders (line 727):
   ```typescript
   {isCreateItinerary && isExpanded && itinerary.query_id && (
     <DayByDayItineraryView ... />
   )}
   ```

3. `DayByDayItineraryView` mounts and runs `useEffect` hooks:
   - `fetchDays()` - line 79
   - `fetchItems()` - line 82
   - `fetchRepository()` - line 83
   - `generateDaysFromQuery()` - line 102 (if conditions met)

**Potential Issues:**
- If `itinerary.query_id` is missing, component won't render
- If API calls fail, errors are caught but might cause issues
- If `generateDaysFromQuery` has dependency issues, it might cause infinite loops

### **Finding 3: useEffect Dependencies**

**Location:** `src/components/agent/DayByDayItineraryView.tsx:102`

```typescript
useEffect(() => {
  if (queryId && days.length === 0 && !loading && !generatingDays) {
    generateDaysFromQuery();
  }
}, [queryId, days.length, loading, generatingDays]);
```

**Issue:**
- `generateDaysFromQuery` is NOT in the dependency array
- `generateDaysFromQuery` is NOT memoized with `useCallback`
- This means `generateDaysFromQuery` is recreated on every render
- However, this shouldn't cause infinite loops since the condition checks prevent re-execution

### **Finding 4: Parent Component useEffect**

**Location:** `src/app/agent/leads/[leadId]/page.tsx:268`

```typescript
useEffect(() => {
  if (leadId && user?.id) {
    const currentKey = `${leadId}-${user.id}`;
    if (lastFetchKeyRef.current !== currentKey && !isFetchingRef.current) {
      // ... fetch logic
    }
  }
}, [leadId, user?.id]);
```

**Analysis:**
- This useEffect depends on `leadId` and `user?.id`
- It does NOT depend on `expandedItineraryId`
- So changing `expandedItineraryId` should NOT trigger this useEffect

**However, there's a potential issue:**
- When creating a new itinerary (line 442-464), it calls `fetchLeadData()` after setting `expandedItineraryId`
- This might cause a re-render that resets state

### **Finding 5: Error Handling**

**All fetch operations in `DayByDayItineraryView` have try-catch:**
- `fetchDays()` - has try-catch (line 108-120)
- `fetchItems()` - has try-catch (line 122-138)
- `fetchRepository()` - has try-catch (line 140-161)
- `generateDaysFromQuery()` - has try-catch (line 163-205)

**Conclusion:** Errors should be caught and logged, not cause page reloads.

### **Finding 6: Possible Navigation/Reload Triggers**

**Checked for:**
- ❌ No `router.push()` in button click handler
- ❌ No `window.location` in component
- ❌ No form submission
- ❌ No error boundaries that redirect
- ❌ No unhandled promise rejections (all have try-catch)

## 🚨 Most Likely Causes

### **Hypothesis 1: Missing `query_id` Causes Component Not to Render**

**Scenario:**
1. User clicks "View Days"
2. `expandedItineraryId` is set
3. Component tries to render `DayByDayItineraryView`
4. But `itinerary.query_id` is `null` or `undefined`
5. Component doesn't render (shows "Query is being linked..." message)
6. But something else triggers a reload

**Check:** Does the itinerary have `query_id` set?

### **Hypothesis 2: API Call Failure Causes Unhandled Error**

**Scenario:**
1. User clicks "View Days"
2. `DayByDayItineraryView` mounts
3. `useEffect` runs and calls `fetchDays()`, `fetchItems()`, `fetchRepository()`
4. One of these API calls fails with an error that's NOT caught properly
5. Error causes Next.js to reload the page

**Check:** Are there any unhandled errors in the API routes?

### **Hypothesis 3: Infinite Loop in State Updates**

**Scenario:**
1. User clicks "View Days"
2. `expandedItineraryId` is set
3. Component renders and calls `onPriceUpdated` callback
4. `onPriceUpdated` calls `createHandlePriceUpdated` which calls `fetchLeadData()`
5. `fetchLeadData()` updates state, causing re-render
6. Re-render might reset `expandedItineraryId` or cause another state update
7. Loop continues

**Check:** Does `onPriceUpdated` callback cause state updates that reset `expandedItineraryId`?

### **Hypothesis 4: Button Type Issue**

**Scenario:**
1. Button is somehow inside a form (even if not visible)
2. Button defaults to `type="submit"`
3. Click triggers form submission
4. Form submission causes page reload

**Check:** Is the button inside a form element? (Need to check full DOM structure)

## 🔎 Diagnostic Steps Needed

### **Step 1: Check Browser Console**

**What to look for:**
- Any unhandled errors
- Any "Uncaught (in promise)" errors
- Any React errors about infinite loops
- Any navigation warnings

### **Step 2: Check Network Tab**

**What to look for:**
- Are API calls being made when clicking "View Days"?
- Do any API calls fail?
- Are there multiple rapid requests (indicating a loop)?
- What's the response status and body?

### **Step 3: Check React DevTools**

**What to look for:**
- Does `expandedItineraryId` state actually change?
- Does it get reset immediately after being set?
- Are there multiple re-renders happening?
- Is `DayByDayItineraryView` actually mounting?

### **Step 4: Check Component Rendering**

**Add temporary logging:**

```typescript
// In LeadDetailPage, around line 627
{itineraries.map((itinerary) => {
  const isCreateItinerary = itinerary.name.toLowerCase().includes('create');
  const isExpanded = expandedItineraryId === itinerary.id;
  
  console.log('[LeadDetailPage] Rendering itinerary:', {
    id: itinerary.id,
    name: itinerary.name,
    isCreateItinerary,
    isExpanded,
    query_id: itinerary.query_id,
    willRenderDayView: isCreateItinerary && isExpanded && itinerary.query_id
  });
  
  // ... rest of code
})}
```

### **Step 5: Check Button Click Event**

**Add temporary logging:**

```typescript
<Button
  variant="outline"
  size="sm"
  onClick={(e) => {
    e.preventDefault(); // Prevent any default behavior
    e.stopPropagation(); // Stop event bubbling
    console.log('[LeadDetailPage] View Days clicked:', {
      itineraryId: itinerary.id,
      currentExpanded: expandedItineraryId,
      willExpand: !isExpanded
    });
    setExpandedItineraryId(isExpanded ? null : itinerary.id);
  }}
  className="flex-1"
>
```

## 🎯 Recommended Fixes (After Confirmation)

### **Fix 1: Add `type="button"` to Button**

```typescript
<Button
  type="button"  // Explicitly set type
  variant="outline"
  size="sm"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItineraryId(isExpanded ? null : itinerary.id);
  }}
  className="flex-1"
>
```

### **Fix 2: Memoize `generateDaysFromQuery`**

```typescript
const generateDaysFromQuery = useCallback(async () => {
  // ... existing code
}, [queryId, itineraryId, adultsCount, childrenCount, infantsCount]);
```

### **Fix 3: Add Error Boundary**

Wrap `DayByDayItineraryView` in an error boundary to catch any rendering errors.

### **Fix 4: Prevent State Reset During Fetch**

Ensure `expandedItineraryId` doesn't get reset when `fetchLeadData()` is called.

## 📋 Next Steps

**Before implementing fixes, need to confirm:**

1. **Browser Console:** Any errors when clicking "View Days"?
2. **Network Tab:** What API calls are made? Do any fail?
3. **React DevTools:** Does `expandedItineraryId` state persist or get reset?
4. **Component State:** Does `itinerary.query_id` exist?
5. **DOM Structure:** Is the button inside a form element?

---

**The fact that the page "keeps on reloading" suggests an infinite loop or repeated error. The most likely cause is either:**
1. An unhandled error in `DayByDayItineraryView` that causes Next.js to reload
2. A state update loop where setting `expandedItineraryId` triggers a fetch that resets it
3. A form submission (even if not visible) that's being triggered

