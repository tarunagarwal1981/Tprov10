# 🗺️ Itinerary Creation - Requirements Discussion

## 📋 Updated Requirements & Discussion

---

## 🔍 1. Package Filtering by Country

### **Requirement**
- Show packages **only for the destination country** of the lead
- With 1000+ operators and multiple packages each, showing everything is not practical
- Need efficient filtering by country/destination

### **Implementation Approach**
```typescript
// Package Search Logic
function searchPackages(lead: Lead) {
  // Extract country from lead destination
  const country = extractCountry(lead.destination); // "Indonesia" from "Bali, Indonesia"
  
  // Search all package types for that country
  const packages = {
    activities: searchActivityPackages({ country }),
    transfers: searchTransferPackages({ country }),
    multiCity: searchMultiCityPackages({ country }),
    hotels: searchHotelPackages({ country }),
    flights: searchFlightPackages({ country })
  };
  
  return packages;
}
```

### **Questions**
- **Q1**: Should we match by exact country name, or also handle variations (e.g., "USA" vs "United States")?
- **Q2**: What if lead destination is vague like "Southeast Asia"? Should we show packages from all SEA countries or ask agent to specify?
- **Q3**: Should we cache package listings per country for performance?

---

## 🎯 2. Complex Package Selection with Options

### **Requirement**
- Agent selects packages with **configurable options**
- Examples:
  - **Multi-city package**: Agent chooses specific hotels from available options
  - **Activity package**: Agent selects transfer type (private vs shared)
  - **Pricing adjusts dynamically** based on selections

### **Detailed Scenarios**

#### **Scenario A: Multi-City Package with Hotel Selection**
```
Package: "Bali-Lombok 4-Day Experience"
├─ Day 1: Activities included
├─ Day 2: Activities included
├─ Hotels: [Agent selects]
│   ├─ Option 1: Luxury Beach Resort ($150/night)
│   ├─ Option 2: Mid-range Hotel ($80/night)
│   └─ Option 3: Budget Hotel ($40/night)
└─ Pricing: Base package + Selected hotel price × nights × rooms
```

#### **Scenario B: Activity with Transfer Options**
```
Package: "Mount Batur Sunrise Trek"
├─ Activity: Fixed ($75/person)
├─ Transfer: [Agent selects]
│   ├─ Private Transfer: +$30 per vehicle
│   └─ Shared Transfer: +$10 per person
└─ Pricing: Activity price + Transfer price × (adults + children)
```

#### **Scenario C: Pricing Based on Adults/Children**
```
Agent inputs at start:
├─ Adults: 2
└─ Children: 1

Activity Package:
├─ Adult price: $75
├─ Child price: $50 (discounted)
└─ Total: (2 × $75) + (1 × $50) = $200
```

### **Implementation Structure**

#### **A. Start Itinerary Creation - Input Form**
```
┌─────────────────────────────────────┐
│ Create Itinerary for Lead           │
│                                      │
│ Lead: Bali Adventure & Culture      │
│ Destination: Bali, Indonesia         │
│                                      │
│ Travel Details:                      │
│ ┌───────────────────────────────┐  │
│ │ Adults: [2]                    │  │
│ │ Children: [1]                  │  │
│ │ (Age: [8])                     │  │
│ │                                │  │
│ │ Start Date: [Date Picker]     │  │
│ │ End Date: [Date Picker]       │  │
│ │                                │  │
│ │ Notes: [Optional feedback]    │  │
│ └───────────────────────────────┘  │
│                                      │
│ [Continue]                           │
└─────────────────────────────────────┘
```

#### **B. Package Selection with Options Modal**
When agent clicks "Add Package", show:
```
┌─────────────────────────────────────┐
│ Mount Batur Sunrise Trek             │
│ Operator: Bali Adventure Tours      │
│ Base Price: $75/person               │
│                                      │
│ Configuration:                       │
│ ┌───────────────────────────────┐  │
│ │ Transfer Type:                  │  │
│ │ ○ Private Transfer (+$30)      │  │
│ │ ● Shared Transfer (+$10)       │  │
│ │                                │  │
│ │ Group Size:                     │  │
│ │ [Based on adults/children]     │  │
│ │ 2 Adults × $75 = $150          │  │
│ │ 1 Child × $50 = $50            │  │
│ │ Transfer: 3 × $10 = $30       │  │
│ │ ───────────────────────────── │  │
│ │ Total: $230                    │  │
│ └───────────────────────────────┘  │
│                                      │
│ [Add to Itinerary]                   │
└─────────────────────────────────────┘
```

#### **C. Multi-City Package with Hotel Selection**
```
┌─────────────────────────────────────┐
│ Bali-Lombok Experience (4 Days)     │
│ Operator: Island Tours              │
│ Base Package: $500                  │
│                                      │
│ Hotel Selection (3 nights):        │
│ ┌───────────────────────────────┐  │
│ │ Night 1 (Bali):                │  │
│ │ [Select Hotel ▼]               │  │
│ │   • Luxury Resort ($150/night) │  │
│ │   • Mid Hotel ($80/night)      │  │
│ │   • Budget ($40/night)         │  │
│ │                                │  │
│ │ Night 2 (Lombok):              │  │
│ │ [Select Hotel ▼]               │  │
│ │                                │  │
│ │ Night 3 (Bali):                 │  │
│ │ [Select Hotel ▼]               │  │
│ └───────────────────────────────┘  │
│                                      │
│ Pricing Breakdown:                   │
│ ├─ Base Package: $500              │
│ ├─ Hotels: $240 (3 nights × $80)   │
│ └─ Total: $740                     │
│                                      │
│ [Add to Itinerary]                   │
└─────────────────────────────────────┘
```

### **Database Schema Updates**

#### **Table: `itinerary_items`** (Updated)
```sql
CREATE TABLE itinerary_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id UUID NOT NULL REFERENCES itineraries(id),
    itinerary_day_id UUID NOT NULL REFERENCES itinerary_days(id),
    
    -- Package reference
    package_type TEXT NOT NULL,
    package_id UUID NOT NULL,
    
    -- Configuration/Options (stored as JSONB)
    configuration JSONB, -- e.g., {"transfer_type": "private", "hotel_id": "uuid", ...}
    
    -- Pricing (calculated based on configuration)
    adult_count INTEGER NOT NULL,
    child_count INTEGER NOT NULL DEFAULT 0,
    base_price DECIMAL(10,2) NOT NULL,
    option_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    
    -- Time slot
    time_slot TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Table: `package_options`** (New - if packages have configurable options)
```sql
CREATE TABLE package_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_type TEXT NOT NULL,
    package_id UUID NOT NULL,
    
    -- Option metadata
    option_type TEXT NOT NULL, -- 'transfer_type', 'hotel_selection', 'meal_plan', etc.
    option_key TEXT NOT NULL, -- 'private', 'shared', 'hotel_uuid', etc.
    option_label TEXT NOT NULL,
    option_price_modifier DECIMAL(10,2), -- +$30, -$10, etc.
    
    -- Constraints
    is_available BOOLEAN DEFAULT true,
    
    UNIQUE(package_type, package_id, option_type, option_key)
);
```

### **Questions**
- **Q1**: Should hotel options come from multi-city packages only, or should we have standalone hotel packages too?
- **Q2**: How detailed should option configurations be? (transfer type, meal plan, room type, etc.)
- **Q3**: Should operators define package options when creating packages, or are options predefined?
- **Q4**: How to handle package-specific pricing rules? (e.g., child discounts, group discounts)

---

## 💰 3. Real-Time Pricing Calculation

### **Requirement**
- **Total itinerary cost updates in real-time** as agent adds/removes/modifies packages
- Show breakdown (base prices + options + totals)
- Compare against customer budget

### **Implementation**

#### **Pricing Display (Right Panel)**
```
┌─────────────────────────────────────┐
│ Itinerary Summary                   │
│ ─────────────────────────────────── │
│                                      │
│ Package Breakdown:                   │
│ ├─ Day 1:                           │
│ │   • Mount Batur Trek: $230       │
│ │   • Airport Transfer: $45        │
│ ├─ Day 2:                           │
│ │   • Snorkeling: $285             │
│ └─ Day 3:                           │
│     • Cooking Class: $170          │
│                                      │
│ ─────────────────────────────────── │
│ Subtotal: $730                      │
│                                      │
│ Customer Budget:                     │
│ $2,500 - $3,500                     │
│                                      │
│ Budget Status: ✅ 21% of budget     │
│                                      │
│ [Updates automatically]             │
└─────────────────────────────────────┘
```

### **Questions**
- **Q1**: Should we show per-person breakdown or just totals?
- **Q2**: How to handle currency conversion if packages are in different currencies?
- **Q3**: Should we calculate taxes/fees separately or include in package prices?

---

## 🎨 4. Most Intuitive UI Layout

### **Proposed Layout**

#### **Desktop (Large Screens) - 3 Column**
```
┌──────────┬───────────────────┬─────────┐
│          │                    │         │
│ Packages │   Itinerary        │ Summary │
│ (Left)   │   (Center)         │ (Right) │
│          │                    │         │
│ 30%      │   50%              │ 20%     │
└──────────┴───────────────────┴─────────┘
```

#### **Desktop (Medium Screens) - 2 Column with Tabs**
```
┌──────────────┬──────────────────┐
│              │                  │
│ Packages     │   Itinerary      │
│ (Left)       │   (Center)       │
│              │                  │
│ 40%          │   60%            │
└──────────────┴──────────────────┘
Summary: [Collapsed tab at bottom]
```

#### **Tablet/Mobile - Stacked with Tabs**
```
┌──────────────────────────┐
│ [Packages] [Itinerary]   │ ← Tabs
│                          │
│ Itinerary Builder        │
│                          │
│ [+ Add Package]          │
└──────────────────────────┘
[Summary: Collapsed → Expandable]
```

### **Alternative: Accordion Layout**
```
┌──────────────────────────┐
│ ▼ Packages (Collapsed)   │
│   Search, filters        │
├──────────────────────────┤
│ Itinerary Builder         │
│ [Main focus area]         │
├──────────────────────────┤
│ ▼ Summary (Collapsed)     │
│   Pricing, actions       │
└──────────────────────────┘
```

### **Recommendation: Responsive 3-Column → 2-Column → Stacked**
- **Large screens (1920px+)**: 3-column layout
- **Medium screens (1024px-1920px)**: 2-column (Packages + Itinerary), Summary as bottom bar
- **Small screens (<1024px)**: Stacked with tabs

### **Questions**
- **Q1**: Which layout feels most intuitive for you?
- **Q2**: Should packages panel be collapsible/expandable?
- **Q3**: Should we use a drawer/sidebar for packages on mobile?

---

## 📝 5. Multiple Itineraries Per Lead

### **Requirement**
- **No auto-save**: Agent creates complete itinerary, then generates PDF
- **Multiple itineraries**: Agent can create different versions for same lead
  - Different hotel selections
  - Different package combinations
  - Different pricing options
- **Purpose**: Send multiple PDFs to customer for comparison/choice

### **Implementation Flow**

#### **A. Itinerary Creation**
1. Agent creates itinerary → Saved immediately
2. Agent builds itinerary (adds packages)
3. Agent generates PDF → Downloads/Emails
4. Agent can create another itinerary for same lead

#### **B. Itinerary List View**
```
┌─────────────────────────────────────┐
│ My Itineraries for:                 │
│ "Bali Adventure & Culture"          │
│                                      │
│ ┌───────────────────────────────┐  │
│ │ Itinerary #1                   │  │
│ │ Created: Jan 15, 2024          │  │
│ │ Total: $1,250                  │  │
│ │ Status: Sent                   │  │
│ │ [View] [Edit] [PDF] [Delete]  │  │
│ └───────────────────────────────┘  │
│                                      │
│ ┌───────────────────────────────┐  │
│ │ Itinerary #2                   │  │
│ │ Created: Jan 15, 2024          │  │
│ │ Total: $2,100                  │  │
│ │ Status: Draft                  │  │
│ │ [View] [Edit] [PDF] [Delete]  │  │
│ └───────────────────────────────┘  │
│                                      │
│ [+ Create New Itinerary]            │
└─────────────────────────────────────┘
```

#### **C. From "My Leads" Page**
```
┌─────────────────────────────────────┐
│ Lead Card: Bali Adventure           │
│                                      │
│ [Create Itinerary]                  │
│                                      │
│ Existing Itineraries: (2)           │
│ ▼ Show                              │
│   • Itinerary #1 - $1,250          │
│   • Itinerary #2 - $2,100          │
└─────────────────────────────────────┘
```

### **Database Updates**
```sql
-- itinerary.status values
-- 'draft' - In progress
-- 'completed' - Ready, PDF generated
-- 'sent' - Emailed to customer
-- 'archived' - Old version
```

### **Questions**
- **Q1**: Should agents be able to duplicate/clone an existing itinerary?
- **Q2**: Should we limit number of itineraries per lead?
- **Q3**: How to name/organize multiple itineraries? (Auto-name like "Itinerary #1" or allow custom names?)

---

## 👥 6. Operator Information & Contact

### **Requirement**
- **Operator info is very important** for each package
- After itinerary creation: **Consolidated view** showing:
  - All operators used
  - Package names
  - Operator contact details
- Future: Individual operator-agent chat per package

### **Implementation**

#### **A. Operator Info in Package Cards**
```
┌─────────────────────────────────────┐
│ 🏔️ Mount Batur Trek                 │
│ Operator: Bali Adventure Tours      │
│ [View Operator Details →]            │
│                                      │
│ Price: $75/person                    │
│ [Add to Itinerary]                   │
└─────────────────────────────────────┘
```

#### **B. Operator Details Modal**
```
┌─────────────────────────────────────┐
│ Bali Adventure Tours                 │
│                                      │
│ Contact Information:                 │
│ ├─ Email: info@baliadventure.com    │
│ ├─ Phone: +62-361-123-456           │
│ ├─ Website: www.baliadventure.com   │
│ └─ WhatsApp: +62-812-345-678       │
│                                      │
│ [Contact via Chat] (Future)          │
│ [Copy Details]                       │
└─────────────────────────────────────┘
```

#### **C. Consolidated Operator View (After Itinerary Creation)**
```
┌─────────────────────────────────────┐
│ Operators in This Itinerary         │
│ ─────────────────────────────────── │
│                                      │
│ 1. Bali Adventure Tours             │
│    Packages:                        │
│    • Mount Batur Trek               │
│    • White Water Rafting            │
│    Contact:                         │
│    • Email: info@baliadventure.com  │
│    • Phone: +62-361-123-456        │
│    [Chat] [Copy]                   │
│                                      │
│ 2. Island Transfers Co.             │
│    Packages:                        │
│    • Airport Transfer               │
│    • Inter-island Transfer          │
│    Contact:                         │
│    • Email: bookings@island.co     │
│    • Phone: +62-361-789-012        │
│    [Chat] [Copy]                   │
│                                      │
│ 3. Premium Indonesia Tours          │
│    Packages:                        │
│    • Snorkeling Nusa Penida         │
│    Contact:                         │
│    • Email: contact@premium.com    │
│    • Phone: +62-361-345-678        │
│    [Chat] [Copy]                   │
│                                      │
│ [Export All Contacts]               │
└─────────────────────────────────────┘
```

#### **D. Operator Contact in PDF**
```
┌─────────────────────────────────────┐
│ ITINERARY - Bali Adventure          │
│                                      │
│ [Itinerary content...]              │
│                                      │
│ ─────────────────────────────────── │
│ OPERATOR CONTACT INFORMATION        │
│                                      │
│ Bali Adventure Tours                │
│ Email: info@baliadventure.com      │
│ Phone: +62-361-123-456             │
│                                      │
│ Island Transfers Co.                │
│ Email: bookings@island.co          │
│ Phone: +62-361-789-012             │
└─────────────────────────────────────┘
```

### **Database Schema for Operator Info**
```sql
-- Already exists in users table, but we need operator profile
CREATE TABLE operator_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    
    -- Business info
    business_name TEXT NOT NULL,
    business_email TEXT NOT NULL,
    business_phone TEXT NOT NULL,
    business_website TEXT,
    whatsapp_number TEXT,
    
    -- Address
    address TEXT,
    city TEXT,
    country TEXT,
    
    -- Additional
    about TEXT,
    logo_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Future: Per-Package Chat**
```
┌─────────────────────────────────────┐
│ Chat: Bali Adventure Tours           │
│ Package: Mount Batur Trek            │
│                                      │
│ [Chat interface]                    │
│                                      │
│ Agent: "Hi, I need to modify..."    │
│ Operator: "Sure, we can adjust..."   │
└─────────────────────────────────────┘
```

### **Questions**
- **Q1**: Should operator contact info be visible in package search panel, or only after adding to itinerary?
- **Q2**: Do operators provide all contact methods, or should we standardize?
- **Q3**: For chat, should it be per-package or one chat per operator across all packages?

---

## 🗂️ Updated Database Schema Summary

### **Tables Needed**

1. **`itineraries`** - Main itinerary records
2. **`itinerary_days`** - Days in itinerary
3. **`itinerary_items`** - Packages with configurations
4. **`package_options`** - Configurable options per package
5. **`operator_profiles`** - Operator contact/business info (if not exists)

### **Key Fields**
- **Configuration JSONB** in `itinerary_items` for package options
- **Adult/Child counts** in itinerary and items
- **Real-time pricing** calculation based on selections
- **Status tracking** for multiple itineraries

---

## 🎯 Implementation Priorities

### **Phase 1: Core Functionality**
1. ✅ Database schema
2. ✅ Itinerary creation flow (adults/children input)
3. ✅ Package search by country
4. ✅ Basic package addition to days

### **Phase 2: Configuration Options**
1. Package options (transfer types, hotel selection)
2. Configuration modal
3. Pricing calculation based on selections

### **Phase 3: Real-Time Pricing**
1. Price calculation service
2. Real-time summary updates
3. Budget validation

### **Phase 4: Multiple Itineraries**
1. Itinerary list view
2. Create/edit multiple versions
3. Itinerary management

### **Phase 5: Operator Information**
1. Operator profile display
2. Consolidated operator view
3. Contact information export

### **Phase 6: PDF & Email**
1. PDF generation with operator info
2. Email sending
3. Multiple PDF management

---

## ❓ Final Questions for Clarification

1. **Package Options**: Should all packages support configuration, or only specific types?
2. **Hotel Selection**: Do hotel options come from multi-city packages, or standalone hotel packages too?
3. **Itinerary Naming**: Auto-generated names or allow custom names?
4. **Operator Chat**: Per-package chat or one chat per operator?
5. **Currency**: Handle multiple currencies or convert all to one?

---

## 🚀 Next Steps

1. **Review this discussion document**
2. **Clarify any questions above**
3. **Confirm database schema approach**
4. **Agree on UI layout preference**
5. **Finalize implementation priorities**

**Ready to refine based on your feedback!** 🎯

