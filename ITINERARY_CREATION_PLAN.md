# 🗺️ Itinerary Creation Flow - Planning Document

## 📋 Overview

Agents need to create day-wise itineraries for purchased leads by combining packages from different tour operators. This document outlines the complete flow, data structure, and implementation plan.

---

## 🔄 User Flow

### 1. **Starting Point: My Leads Page**
- Agent views purchased leads in `/agent/leads`
- Each lead card shows:
  - Lead details (destination, budget, duration, travelers)
  - Customer contact information (name, email, phone)
  - Purchase date and price

### 2. **Trigger: Create Itinerary Button**
- **Location**: On each lead card in "My Leads" page
- **Button**: "Create Itinerary" (primary action)
- **Action**: Navigates to `/agent/itineraries/create?leadId={leadId}`

### 3. **Itinerary Creation Page**
- **Route**: `/agent/itineraries/create`
- **Purpose**: Build day-wise itinerary for the lead

---

## 📊 Itinerary Builder Components

### A. **Top Section: Lead Summary**
```
┌─────────────────────────────────────────────────┐
│ Lead: "Bali Adventure & Culture - 4 Days"     │
│ Destination: Bali, Indonesia                   │
│ Duration: 4 days | Travelers: 2                │
│ Budget: $2,500 - $3,500                         │
│ Customer: Sarah & John Mitchell                │
└─────────────────────────────────────────────────┘
```

### B. **Left Panel: Available Packages (Filterable)**
```
┌─────────────────────────────────────┐
│ Available Packages                  │
│ ┌───────────────────────────────┐  │
│ │ 🔍 Search: [___________]      │  │
│ │ 📍 Destination: Bali [v]     │  │
│ │ 📦 Type: [All] [v]           │  │
│ │                                │  │
│ │ ACTIVITIES                     │  │
│ │ ┌─────────────────────────┐   │  │
│ │ │ 🏔️ Mount Batur Trek     │   │  │
│ │ │ Operator 1 | $75       │   │  │
│ │ │ [Add to Day]            │   │  │
│ │ └─────────────────────────┘   │  │
│ │                                │  │
│ │ TRANSFERS                      │  │
│ │ ┌─────────────────────────┐   │  │
│ │ │ 🚗 Airport Transfer      │   │  │
│ │ │ Operator 3 | $45       │   │  │
│ │ │ [Add to Day]            │   │  │
│ │ └─────────────────────────┘   │  │
│ │                                │  │
│ │ MULTI-CITY                     │  │
│ │ (if applicable)                │  │
│ └────────────────────────────────┘  │
└─────────────────────────────────────┘
```

### C. **Center Panel: Day-wise Itinerary Builder**
```
┌──────────────────────────────────────────────┐
│ Day 1: [Date picker]                         │
│ ┌────────────────────────────────────────┐  │
│ │ Morning:                                │  │
│ │   🚗 Airport Transfer                   │  │
│ │   Operator 3 | $45 | [Remove]         │  │
│ │                                         │  │
│ │ Afternoon:                               │  │
│ │   🏔️ Mount Batur Trek                  │  │
│ │   Operator 1 | $75 | [Remove]         │  │
│ │                                         │  │
│ │ Evening:                                 │  │
│ │   [Add Activity]                        │  │
│ └────────────────────────────────────────┘  │
│                                             │
│ Day 2: [Date picker]                        │
│ [Add Transfer] | [Add Activity]            │
│                                             │
│ [+ Add Day]                                 │
└──────────────────────────────────────────────┘
```

### D. **Right Panel: Summary & Actions**
```
┌─────────────────────────────────────┐
│ Itinerary Summary                   │
│ ─────────────────────────────────── │
│ Total Days: 4                        │
│ Packages: 8                          │
│ Total Cost: $1,250                   │
│ Customer Budget: $2,500 - $3,500    │
│ Budget Status: ✅ Within Budget      │
│                                     │
│ Actions:                             │
│ [📄 Preview]                         │
│ [💾 Save Draft]                      │
│ [📧 Send to Customer]                │
│ [📥 Download PDF]                    │
└─────────────────────────────────────┘
```

---

## 🗃️ Database Schema

### **Table: `itineraries`**
```sql
CREATE TABLE itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    agent_id UUID NOT NULL REFERENCES auth.users(id),
    lead_id UUID NOT NULL REFERENCES leads(id),
    marketplace_lead_id UUID REFERENCES lead_marketplace(id),
    
    -- Itinerary Info
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INTEGER NOT NULL,
    travelers_count INTEGER NOT NULL,
    
    -- Budget
    estimated_cost DECIMAL(10,2) NOT NULL,
    customer_budget_min DECIMAL(10,2),
    customer_budget_max DECIMAL(10,2),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, approved, rejected
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE
);
```

### **Table: `itinerary_days`**
```sql
CREATE TABLE itinerary_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    
    day_number INTEGER NOT NULL,
    date DATE NOT NULL,
    
    -- Daily summary
    title TEXT,
    description TEXT,
    
    -- Ordering
    display_order INTEGER NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_itinerary_day UNIQUE(itinerary_id, day_number)
);
```

### **Table: `itinerary_items`**
```sql
CREATE TABLE itinerary_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    itinerary_day_id UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
    
    -- Package reference (polymorphic)
    package_type TEXT NOT NULL, -- 'activity', 'transfer', 'multi_city', 'hotel', 'flight'
    package_id UUID NOT NULL,
    
    -- Time slot
    time_slot TEXT NOT NULL, -- 'morning', 'afternoon', 'evening', 'full_day'
    start_time TIME,
    end_time TIME,
    
    -- Pricing
    price_per_person DECIMAL(10,2),
    total_price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    
    -- Notes
    notes TEXT,
    
    -- Display
    display_order INTEGER NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_day_time_slot UNIQUE(itinerary_day_id, time_slot, display_order)
);
```

### **Table: `itinerary_package_mapping`** (for quick lookups)
```sql
CREATE TABLE itinerary_package_mapping (
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    package_type TEXT NOT NULL,
    package_id UUID NOT NULL,
    
    PRIMARY KEY (itinerary_id, package_type, package_id)
);
```

---

## 🔍 Package Search Logic

### **Search Parameters**
1. **Destination Matching**:
   - Match lead's destination with package destinations
   - Support for: city, country, region matching
   - Example: Lead "Bali, Indonesia" → Packages with destination "Bali" OR "Indonesia"

2. **Package Type**:
   - Activity packages
   - Transfer packages
   - Multi-city packages
   - Hotel packages (if available)
   - Fixed departure flight packages (if available)

3. **Filtering Options**:
   - Budget range (package price within customer budget)
   - Duration (package duration suitable for itinerary)
   - Availability (package status = 'published')
   - Operator (show operator name)

4. **Sorting**:
   - Price (low to high)
   - Popularity (if available)
   - Quality score (if available)
   - Newest first

---

## 📱 UI/UX Flow

### **Step 1: Select Packages**
- Agent searches/browses available packages
- Click "Add to Day X" button
- Package appears in selected day's itinerary

### **Step 2: Build Day-wise Itinerary**
- **Day Selection**: Click day tab or use date picker
- **Time Slots**: Morning, Afternoon, Evening, Full Day
- **Drag & Drop**: (Future enhancement) Drag packages between days/time slots
- **Remove**: Click remove button on package card

### **Step 3: Package Details in Itinerary**
Each package card in itinerary shows:
- Package title and type
- Operator name
- Price (per person or total)
- Duration/time
- Brief description
- Remove button

### **Step 4: Validation**
- **Budget Check**: Compare total cost with customer budget
  - ✅ Green if within budget
  - ⚠️ Yellow if close to limit (80-100%)
  - ❌ Red if exceeds budget
- **Duration Check**: Ensure itinerary matches lead's duration
- **Day Coverage**: Ensure all days have activities (warnings for empty days)

### **Step 5: Save & Send**
- **Save Draft**: Save progress without sending
- **Preview**: Show formatted itinerary preview
- **Send to Customer**: Email itinerary to customer
- **Download PDF**: Generate and download PDF

---

## 🎨 UI Components Needed

### **1. Itinerary Builder Page**
- `/agent/itineraries/create/page.tsx`
- Main layout with three panels

### **2. Package Search Panel**
- `PackageSearchPanel.tsx`
- Search input, filters, package cards

### **3. Itinerary Day Builder**
- `ItineraryDayBuilder.tsx`
- Day tabs, time slots, package placement

### **4. Package Card (in itinerary)**
- `ItineraryPackageCard.tsx`
- Compact package display with remove button

### **5. Itinerary Summary Panel**
- `ItinerarySummaryPanel.tsx`
- Total cost, budget status, action buttons

### **6. Preview Modal**
- `ItineraryPreviewModal.tsx`
- Formatted preview before sending

### **7. Services**
- `ItineraryService.ts`
- API calls for creating, saving, sending itineraries

---

## 🔌 API/Service Functions Needed

### **Package Search Service**
```typescript
async function searchPackagesByDestination(
  destination: string,
  filters: PackageSearchFilters
): Promise<Package[]>
```

### **Itinerary Service**
```typescript
// Create new itinerary
async function createItinerary(
  leadId: string,
  itineraryData: ItineraryData
): Promise<Itinerary>

// Save draft
async function saveItineraryDraft(
  itineraryId: string,
  itineraryData: Partial<ItineraryData>
): Promise<Itinerary>

// Add package to day
async function addPackageToDay(
  itineraryId: string,
  dayId: string,
  packageData: PackageItem
): Promise<void>

// Remove package from day
async function removePackageFromDay(
  itineraryId: string,
  itemId: string
): Promise<void>

// Send to customer
async function sendItineraryToCustomer(
  itineraryId: string
): Promise<void>

// Generate PDF
async function generateItineraryPDF(
  itineraryId: string
): Promise<Blob>

// Get itinerary
async function getItinerary(itineraryId: string): Promise<Itinerary>
```

---

## 📋 Implementation Steps

### **Phase 1: Database & Basic Structure**
1. ✅ Create database schema (tables above)
2. ✅ Create TypeScript types/interfaces
3. ✅ Create service functions (basic CRUD)

### **Phase 2: Package Search**
1. ✅ Build package search API endpoint
2. ✅ Create PackageSearchPanel component
3. ✅ Implement filtering and sorting

### **Phase 3: Itinerary Builder UI**
1. ✅ Create main itinerary builder page
2. ✅ Build day selector/tabs
3. ✅ Build time slot containers
4. ✅ Implement add/remove package functionality

### **Phase 4: Validation & Summary**
1. ✅ Add budget validation
2. ✅ Build itinerary summary panel
3. ✅ Add validation warnings

### **Phase 5: Save & Preview**
1. ✅ Implement save draft functionality
2. ✅ Build preview modal
3. ✅ Format itinerary for preview

### **Phase 6: Send & PDF**
1. ✅ Implement email sending
2. ✅ Generate PDF (use library like `react-pdf` or `jspdf`)
3. ✅ Add download functionality

---

## 🤔 Questions to Discuss

### **1. Package Selection**
- **Q**: Should agents be able to add the same package multiple times (e.g., same activity on different days)?
- **A**: Yes, if it makes sense (e.g., transfer packages for different days)

### **2. Time Slots**
- **Q**: Should we have fixed time slots (Morning/Afternoon/Evening) or allow custom times?
- **A**: Start with fixed time slots, add custom times later

### **3. Package Pricing**
- **Q**: How to handle package pricing when travelers count differs from package default?
- **A**: Show per-person price × travelers count, or package's group pricing if applicable

### **4. Multi-Operator Packages**
- **Q**: How to display operator information prominently?
- **A**: Show operator name/badge on each package card

### **5. Draft Saving**
- **Q**: Auto-save drafts or manual save?
- **A**: Start with manual save, add auto-save later

### **6. Itinerary Sharing**
- **Q**: Should agents be able to share itinerary with other team members?
- **A**: Future enhancement, not in initial version

### **7. PDF Template**
- **Q**: Should we have multiple PDF templates or one standard format?
- **A**: Start with one professional template, add more later

---

## 🎯 Next Steps

1. **Review this plan** and discuss any changes
2. **Confirm database schema** matches requirements
3. **Agree on UI/UX flow** before implementation
4. **Decide on PDF library** (react-pdf, jspdf, or server-side)
5. **Start Phase 1**: Database schema creation

---

## 📝 Notes

- **Responsive Design**: Itinerary builder should work on desktop (3-column layout) and mobile (stacked/tabs)
- **Performance**: Paginate package search results (load 20 at a time)
- **Real-time Updates**: Consider WebSocket for multi-user editing (future)
- **Version History**: Save versions when sending to customer (future)

---

**Ready to discuss and refine this plan!** 🚀

