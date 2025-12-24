# Day-by-Day Itinerary Page - Implementation Plan

## 🎯 Objective

Move the day-by-day itinerary view from an inline expansion on the proposals/leads page to a separate dedicated page, similar to how "Insert Itinerary" works.

## 📋 Current State

### **Current Flow:**
1. User is on `/agent/leads/[leadId]` (Lead Detail Page)
2. User sees "Create Itinerary" cards with "View Days" button
3. Clicking "View Days" expands `DayByDayItineraryView` component inline
4. Component shows day-by-day schedule with activities/transfers

### **Current Code Location:**
- **Lead Detail Page:** `src/app/agent/leads/[leadId]/page.tsx`
  - Lines 700-738: "View Days" button and inline `DayByDayItineraryView` component
  - Uses `expandedItineraryId` state to show/hide inline view

### **Similar Implementation:**
- **Insert Itinerary Page:** `src/app/agent/leads/[leadId]/insert/page.tsx`
  - Separate page for inserting packages into itinerary
  - Navigates from lead detail page with query params: `?queryId=...&itineraryId=...`

## 🎯 Target State

### **New Flow:**
1. User is on `/agent/leads/[leadId]` (Lead Detail Page)
2. User sees "Create Itinerary" cards with "View Days" button
3. Clicking "View Days" navigates to `/agent/leads/[leadId]/create/[itineraryId]`
4. New page displays `DayByDayItineraryView` component full-screen
5. User can navigate back to lead detail page

## 📐 Implementation Plan

### **Step 1: Create New Page Route**

**File to Create:** `src/app/agent/leads/[leadId]/create/[itineraryId]/page.tsx`

**Structure:**
- Similar to `insert/page.tsx` but focused on day-by-day view
- Fetch itinerary and query data on mount
- Display `DayByDayItineraryView` component
- Include back button to return to lead detail page
- Handle loading and error states

**Route Pattern:**
```
/agent/leads/[leadId]/create/[itineraryId]
```

**URL Parameters:**
- `leadId`: From route params
- `itineraryId`: From route params
- `queryId`: Can be fetched from itinerary data (itinerary.query_id)

### **Step 2: Update Lead Detail Page**

**File:** `src/app/agent/leads/[leadId]/page.tsx`

**Changes:**
1. **Remove inline expansion logic:**
   - Remove `expandedItineraryId` state (or keep for other uses if needed)
   - Remove inline `DayByDayItineraryView` component rendering (lines 714-738)
   - Remove "Collapse" functionality

2. **Update "View Days" button:**
   - Change from toggle button to navigation button
   - Navigate to: `/agent/leads/${leadId}/create/${itinerary.id}`
   - Remove `onClick` that sets `expandedItineraryId`
   - Use `router.push()` instead

3. **Remove unused state/callbacks:**
   - Remove `expandedItineraryId` state if not used elsewhere
   - Keep `handleDaysGenerated` and `createHandlePriceUpdated` if needed for other purposes
   - Or remove if only used for inline view

### **Step 3: New Page Implementation Details**

**Component Structure:**
```typescript
export default function CreateItineraryDaysPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  
  const leadId = params.leadId as string;
  const itineraryId = params.itineraryId as string;
  
  // State
  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [query, setQuery] = useState<ItineraryQuery | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch data on mount
  useEffect(() => {
    if (leadId && itineraryId && user?.id) {
      fetchData();
    }
  }, [leadId, itineraryId, user?.id]);
  
  // Fetch lead, itinerary, and query data
  const fetchData = async () => {
    // 1. Fetch lead details
    // 2. Fetch itinerary details (includes query_id)
    // 3. Fetch query details using itinerary.query_id
    // 4. Set loading to false
  };
  
  // Handle days generated callback
  const handleDaysGenerated = async () => {
    // Refresh itinerary data
    // Could navigate back or show success message
  };
  
  // Handle price updated callback
  const handlePriceUpdated = async (totalPrice: number) => {
    // Update itinerary price in database
    // No need to refetch all data (prevents loops)
  };
  
  return (
    <div className="container mx-auto p-6">
      {/* Header with back button */}
      {/* Lead info card */}
      {/* DayByDayItineraryView component */}
    </div>
  );
}
```

**Required Data:**
- `leadId`: From route params
- `itineraryId`: From route params
- `queryId`: From `itinerary.query_id` (fetched from API)
- `adultsCount`, `childrenCount`, `infantsCount`: From itinerary data

**API Calls Needed:**
1. `/api/leads/${leadId}?agentId=${user.id}` - Get lead details
2. `/api/itineraries/${itineraryId}?agentId=${user.id}` - Get itinerary details
3. `/api/queries/by-id/${queryId}` - Get query details (if query_id exists)

### **Step 4: Component Props**

**DayByDayItineraryView Props:**
```typescript
<DayByDayItineraryView
  itineraryId={itinerary.id}
  queryId={itinerary.query_id}
  adultsCount={itinerary.adults_count}
  childrenCount={itinerary.children_count}
  infantsCount={itinerary.infants_count}
  onDaysGenerated={handleDaysGenerated}
  onPriceUpdated={handlePriceUpdated}
/>
```

### **Step 5: Navigation Flow**

**From Lead Detail Page:**
- Button: "View Days"
- Action: `router.push(`/agent/leads/${leadId}/create/${itinerary.id}`)`
- Remove toggle/expand logic

**From New Page:**
- Back Button: `router.push(`/agent/leads/${leadId}`)`
- Or use browser back button

**After Days Generated:**
- Option 1: Stay on page, show success message
- Option 2: Navigate back to lead detail page
- Option 3: Show success message with option to go back

### **Step 6: Error Handling**

**Scenarios to Handle:**
1. **Itinerary not found:**
   - Show error message
   - Provide back button to lead detail page

2. **Query not linked:**
   - Show message: "Query is being linked to itinerary. Please wait..."
   - Or redirect back with message

3. **Unauthorized access:**
   - Check if user has access to this lead/itinerary
   - Redirect to lead detail page if not authorized

4. **Loading states:**
   - Show loading spinner while fetching data
   - Show skeleton UI for better UX

## 📁 File Structure

```
src/app/agent/leads/[leadId]/
├── page.tsx                          # Lead Detail Page (MODIFY)
├── insert/
│   └── page.tsx                      # Insert Itinerary Page (REFERENCE)
├── create/
│   └── [itineraryId]/
│       └── page.tsx                  # NEW: Day-by-Day Itinerary Page
└── itineraries/
    ├── page.tsx
    └── new/
        └── page.tsx                  # Create New Itinerary (REFERENCE)
```

## 🔄 Migration Checklist

- [ ] Create new page route: `src/app/agent/leads/[leadId]/create/[itineraryId]/page.tsx`
- [ ] Implement data fetching logic (lead, itinerary, query)
- [ ] Implement `DayByDayItineraryView` integration
- [ ] Add back button navigation
- [ ] Add loading and error states
- [ ] Update Lead Detail Page: Remove inline expansion
- [ ] Update "View Days" button to navigate instead of expand
- [ ] Remove `expandedItineraryId` state (if not used elsewhere)
- [ ] Test navigation flow
- [ ] Test data fetching and display
- [ ] Test error scenarios
- [ ] Verify no broken functionality

## 🎨 UI/UX Considerations

### **New Page Layout:**
- **Header:** Back button + Page title ("Day-by-Day Itinerary")
- **Lead Info Card:** Show lead details (customer name, destination, etc.)
- **Itinerary Info:** Show itinerary name, status, total price
- **Day-by-Day View:** Full-width `DayByDayItineraryView` component
- **Actions:** Back button, maybe "Save" or "Complete" button

### **Consistency:**
- Match styling with `insert/page.tsx` for consistency
- Use same card components and layout patterns
- Use same loading states and error handling

## 🔍 Testing Scenarios

1. **Happy Path:**
   - Click "View Days" → Navigate to new page → See day-by-day view → Navigate back

2. **Data Loading:**
   - Page loads → Shows loading state → Fetches data → Displays view

3. **Error Cases:**
   - Invalid itinerary ID → Show error → Can navigate back
   - Missing query_id → Show appropriate message
   - Network error → Show error message

4. **Interactions:**
   - Generate days → Success message → View updates
   - Add activity/transfer → Price updates → View updates
   - Navigate back → Returns to lead detail page

## 📝 Notes

- Keep the `DayByDayItineraryView` component unchanged (it's reusable)
- The new page is just a wrapper that fetches data and renders the component
- Similar pattern to `insert/page.tsx` but simpler (no package selection)
- Consider adding breadcrumbs for better navigation
- Consider adding a "Save" or "Complete" button if needed

## 🚀 Implementation Order

1. **Create new page file** with basic structure
2. **Implement data fetching** (lead, itinerary, query)
3. **Integrate DayByDayItineraryView** component
4. **Add navigation** (back button)
5. **Update Lead Detail Page** (remove inline, add navigation)
6. **Test and refine**

---

**This plan ensures a clean separation of concerns, maintains consistency with existing patterns, and provides a better user experience with a dedicated page for the day-by-day itinerary view.**

