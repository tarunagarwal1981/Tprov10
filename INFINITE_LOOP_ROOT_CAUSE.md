# Infinite Loop Root Cause Analysis

## 🔍 Problem Identified

**Symptom:** `fetchLeadData()` is being called repeatedly in an infinite loop, causing the page to reload continuously.

**Console Logs Show:**
```
[LeadDetailPage] Fetching lead data for leadId: "2b838a35-90ac-49fc-83cb-b3234b941501"
[LeadDetailPage] Lead data fetched successfully
[LeadDetailPage] Fetched itineraries: 8
[LeadDetailPage] Fetched queries: 8
```
This pattern repeats indefinitely.

## 🎯 Root Cause Chain

### **Step-by-Step Loop:**

1. **`DayByDayItineraryView` mounts** (when "View Days" is clicked)
   - Component fetches items via `fetchItems()`
   - Items are loaded and state is updated

2. **`useEffect` in `DayByDayItineraryView` (line 88-99) runs:**
   ```typescript
   useEffect(() => {
     const total = normalizedItems.reduce(...);
     setTotalPrice(total);
     onPriceUpdated?.(total);  // ⚠️ Calls parent callback
   }, [items, onPriceUpdated]);  // ⚠️ Depends on onPriceUpdated
   ```

3. **`onPriceUpdated` callback is called:**
   - This is `createHandlePriceUpdated(itinerary.id)` from parent
   - It debounces for 1 second, then calls `fetchLeadData()`

4. **`fetchLeadData()` updates state:**
   - Updates `itineraries` state
   - Updates `queries` state
   - This causes parent component to re-render

5. **Re-render causes `toast` to be a new object:**
   - `toast` comes from `useToast()` hook
   - `useToast()` returns a new object on every render (line 49-57 in `useToast.ts`)
   - Object reference changes: `{ success, error, warning, info, ... }`

6. **`fetchLeadData` is recreated:**
   ```typescript
   const fetchLeadData = useCallback(async () => {
     // ...
   }, [leadId, user?.id, toast]);  // ⚠️ toast is in dependencies
   ```
   - Because `toast` is a new object, `fetchLeadData` is recreated

7. **`createHandlePriceUpdated` is recreated:**
   ```typescript
   const createHandlePriceUpdated = useCallback((itineraryId: string) => {
     // ...
   }, [fetchLeadData, leadId, user?.id]);  // ⚠️ Depends on fetchLeadData
   ```
   - Because `fetchLeadData` changed, `createHandlePriceUpdated` is recreated

8. **`onPriceUpdated` prop changes:**
   - `onPriceUpdated={createHandlePriceUpdated(itinerary.id)}`
   - New callback function is passed to `DayByDayItineraryView`

9. **`useEffect` in `DayByDayItineraryView` sees `onPriceUpdated` changed:**
   - Dependency array: `[items, onPriceUpdated]`
   - `onPriceUpdated` changed, so `useEffect` runs again
   - Calls `onPriceUpdated(total)` again
   - **LOOP CONTINUES!**

## 🔧 The Core Issues

### **Issue 1: `toast` in `fetchLeadData` dependencies**

**Location:** `src/app/agent/leads/[leadId]/page.tsx:202`

```typescript
const fetchLeadData = useCallback(async () => {
  // ... uses toast.error() inside
}, [leadId, user?.id, toast]);  // ⚠️ toast is unstable
```

**Problem:**
- `toast` from `useToast()` is a new object on every render
- This causes `fetchLeadData` to be recreated on every render
- Even though the object contents are the same, the reference changes

### **Issue 2: `onPriceUpdated` in `DayByDayItineraryView` useEffect dependencies**

**Location:** `src/components/agent/DayByDayItineraryView.tsx:99`

```typescript
useEffect(() => {
  const total = normalizedItems.reduce(...);
  setTotalPrice(total);
  onPriceUpdated?.(total);
}, [items, onPriceUpdated]);  // ⚠️ onPriceUpdated changes frequently
```

**Problem:**
- `onPriceUpdated` is recreated every time parent re-renders
- This triggers the `useEffect` to run again
- Which calls `onPriceUpdated(total)` again
- Which triggers `fetchLeadData()` again
- Which updates state and causes re-render
- **INFINITE LOOP**

### **Issue 3: `useToast()` returns unstable object**

**Location:** `src/hooks/useToast.ts:49-57`

```typescript
return {
  toasts,
  addToast,
  removeToast,
  success,
  error,
  warning,
  info,
};
```

**Problem:**
- Returns a new object literal on every render
- Even though the functions are memoized, the object itself is new
- This causes any `useCallback` depending on `toast` to be recreated

## 🎯 Solutions

### **Solution 1: Remove `toast` from `fetchLeadData` dependencies (RECOMMENDED)**

**Fix:** Use `toast` functions directly without including in dependencies, or use a ref.

```typescript
const fetchLeadData = useCallback(async () => {
  // ... use toast.error() inside
}, [leadId, user?.id]);  // ✅ Remove toast from dependencies
```

**Why this works:**
- `toast.error()` is stable (memoized in `useToast`)
- We don't need `toast` object in dependencies
- Only the functions are used, not the object itself

### **Solution 2: Remove `onPriceUpdated` from `DayByDayItineraryView` useEffect dependencies**

**Fix:** Use a ref to store the callback, or only call it when `items` actually change.

```typescript
const onPriceUpdatedRef = useRef(onPriceUpdated);
useEffect(() => {
  onPriceUpdatedRef.current = onPriceUpdated;
}, [onPriceUpdated]);

useEffect(() => {
  const total = normalizedItems.reduce(...);
  setTotalPrice(total);
  onPriceUpdatedRef.current?.(total);
}, [items]);  // ✅ Only depend on items
```

**Why this works:**
- `useEffect` only runs when `items` changes
- Not when `onPriceUpdated` callback changes
- Prevents infinite loop

### **Solution 3: Memoize `toast` object in `useToast` hook**

**Fix:** Use `useMemo` to memoize the return object.

```typescript
return useMemo(() => ({
  toasts,
  addToast,
  removeToast,
  success,
  error,
  warning,
  info,
}), [toasts, addToast, removeToast, success, error, warning, info]);
```

**Why this works:**
- Object reference only changes when dependencies change
- Functions are already memoized, so object is stable
- Prevents `fetchLeadData` from being recreated

## 📋 Recommended Fix Strategy

**Apply all three solutions for maximum stability:**

1. **Remove `toast` from `fetchLeadData` dependencies** (Primary fix)
2. **Use ref for `onPriceUpdated` in `DayByDayItineraryView`** (Secondary fix)
3. **Memoize `toast` object in `useToast` hook** (Tertiary fix - optional but good practice)

## 🔍 Verification Steps

After applying fixes, verify:

1. **Console logs:** `fetchLeadData()` should only be called:
   - On initial mount
   - When `leadId` or `user?.id` changes
   - When explicitly triggered (not in a loop)

2. **Network tab:** API calls should not repeat indefinitely

3. **Component behavior:** "View Days" should expand without page reload

4. **Price updates:** Price should still update correctly when items change

---

**The infinite loop is caused by the unstable `toast` object causing `fetchLeadData` to be recreated, which causes `onPriceUpdated` callback to be recreated, which triggers the `useEffect` in `DayByDayItineraryView` to run again, creating an infinite cycle.**

