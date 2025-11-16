# 🗺️ Itinerary Creation - Final Understanding & Agreement

## ✅ Confirmed Understanding Based on All 5 Package Forms

---

## 📦 **1. Package Options Available to Agent (From Forms)**

### **A. Activity Packages**
**Available Options:**
- ✅ **TICKET_ONLY**: Just ticket price
  - Adult price (per person)
  - Child price (per person) with age range (childMinAge to childMaxAge)
  
- ✅ **PRIVATE_TRANSFER**: Ticket + Private transfer
  - Adult/Child pricing (same as Ticket Only)
  - **Vehicle Selection**: Multiple vehicle options per package
    - Vehicle Type (Sedan, SUV, Van, Mini Bus, Bus, Luxury Sedan, Luxury SUV, Others)
    - Max Capacity
    - Vehicle Category (Economy, Standard, Premium, Luxury, Group Transport)
    - **Vehicle Price** (added to base ticket price)

- ✅ **SHARED_TRANSFER**: Ticket + Shared transfer
  - Adult/Child pricing (same as Ticket Only)
  - Shared transfer price included

**NO Variants**: ❌ Package variants tab is commented out/removed - no variants available
**NO Group Discounts**: ❌ No group discount functionality in pricing

---

### **B. Transfer Packages**
**Available Options:**
- ✅ **Hourly Pricing Options**:
  - Hours (number of hours)
  - Vehicle Type selection
  - Vehicle Name
  - Max Passengers
  - **Rate USD** (per hour)
  - Calculation: `rateUSD × hours`

- ✅ **Point-to-Point Pricing Options**:
  - From Location → To Location
  - Vehicle Type selection
  - Vehicle Name
  - Max Passengers
  - **Cost USD** (fixed price for route)

**NO Group Discounts**: ❌ No group discount functionality

---

### **C. Multi-City Packages**
**Available Options:**
- ✅ **Pricing Model Selection**:
  - **STANDARD**: Per person pricing only
    - Adult price
    - Child price (with age range: childMinAge to childMaxAge)
    - Infant price (with maxAge: infantMaxAge)
  
  - **GROUP**: Per person pricing + Vehicle options
    - All STANDARD pricing options PLUS
    - Vehicle selection:
      - Vehicle Type
      - Max Capacity
      - **Vehicle Price** (total for vehicle)

- ✅ **Hotel Selection** (per city):
  - Each city in package has hotel options from `multi_city_package_city_hotels` table
  - Agent selects hotel **per city night**
  - **Hotel pricing** affects total package cost
  - **Inline minimal selection** with real-time price updates

**NO Group Discounts**: ❌ No group discount functionality

---

### **D. Multi-City Hotel Packages**
**Available Options:**
- ✅ **Same as Multi-City Packages**:
  - STANDARD or GROUP pricing model
  - Adult/Child/Infant pricing
  - Vehicle options (if GROUP)
  - **Hotel selection per city** (from `multi_city_hotel_package_city_hotels` table)
  - **Inline minimal selection** with real-time price updates

**NO Group Discounts**: ❌ No group discount functionality

---

### **E. Fixed Departure Flight Packages**
**Available Options:**
- ✅ **Same as Multi-City Packages**:
  - STANDARD or GROUP pricing model
  - Adult/Child/Infant pricing
  - Vehicle options (if GROUP)
  - Hotel selection per city
  - **Fixed departure dates**

**NO Group Discounts**: ❌ No group discount functionality

---

## 🎯 **2. Hotel Selection Implementation**

### **Requirement**
- **Inline minimal selection** with **real-time price updates**
- Hotel options come from package (multi-city, multi-city hotel, fixed departure)
- Agent selects hotel per city night
- Total price updates immediately as selection changes

### **Implementation Approach**
```
When agent adds multi-city package to itinerary:

┌─────────────────────────────────────────────┐
│ Multi-City Package: Bali-Lombok Experience│
│                                             │
│ City: Bali (3 nights)                       │
│ Hotel: [Select ▼]                          │
│   • Luxury Resort ($150/night) - $450      │
│   • Mid Hotel ($80/night) - $240           │
│   • Budget ($40/night) - $120              │
│                                             │
│ City: Lombok (2 nights)                     │
│ Hotel: [Select ▼]                          │
│   • Beach Resort ($120/night) - $240      │
│   • Standard Hotel ($60/night) - $120      │
│                                             │
│ ────────────────────────────────────────   │
│ Subtotal: $450 (updated in real-time)      │
└─────────────────────────────────────────────┘
```

**Real-time Updates:**
- As agent changes hotel selection, price updates immediately
- Total itinerary cost recalculates automatically
- Budget comparison updates instantly

---

## 👥 **3. Adult/Child Input at Start**

### **Flow**
1. Agent clicks "Create Itinerary" from lead
2. **Input Form** appears:
   ```
   Adults: [2]
   Children: [1]
   (Optional: Child ages if needed)
   Start Date: [Date Picker]
   End Date: [Date Picker]
   Notes: [Optional]
   ```
3. Agent clicks "Continue"
4. These numbers used for **all pricing calculations** across all packages

---

## 💰 **4. Real-Time Pricing Calculation**

### **Calculation Logic**
```typescript
function calculateTotal(itineraryItems, adults, children, infants) {
  let total = 0;
  
  for (item of itineraryItems) {
    switch (item.packageType) {
      case 'activity':
        if (item.option.packageType === 'TICKET_ONLY') {
          total += (item.option.adultPrice × adults) + 
                   (item.option.childPrice × children);
        } else if (item.option.packageType === 'PRIVATE_TRANSFER') {
          total += (item.option.adultPrice × adults) + 
                   (item.option.childPrice × children) + 
                   item.selectedVehicle.price;
        } else if (item.option.packageType === 'SHARED_TRANSFER') {
          total += (item.option.adultPrice × adults) + 
                   (item.option.childPrice × children) + 
                   sharedTransferPrice;
        }
        break;
        
      case 'transfer':
        if (item.option.type === 'hourly') {
          total += item.option.rateUSD × item.hours;
        } else {
          total += item.option.costUSD;
        }
        break;
        
      case 'multi_city':
      case 'multi_city_hotel':
      case 'fixed_departure':
        let base = (item.pricing.adultPrice × adults) + 
                   (item.pricing.childPrice × children) + 
                   (item.pricing.infantPrice × infants);
        
        if (item.pricing.pricingType === 'GROUP') {
          base += item.selectedVehicle.price;
        }
        
        // Add selected hotel prices
        base += sum(item.selectedHotels.map(h => h.price));
        
        total += base;
        break;
    }
  }
  
  return total;
}
```

**Real-time Updates:**
- Updates as agent adds/removes packages
- Updates as agent changes options (transfer types, hotels, vehicles)
- Updates as agent modifies hotel selections
- Shows in right panel (Summary) immediately

---

## 📝 **5. Multiple Itineraries Per Lead**

### **Requirement**
- Agent can create **multiple itineraries** for same lead
- **No auto-save**: Agent creates complete itinerary, then generates PDF
- Each itinerary can have:
  - Different hotel selections
  - Different package combinations
  - Different pricing options
- Purpose: Send multiple PDFs to customer for comparison

### **Itinerary Naming**
- **Default**: "Itinerary #1", "Itinerary #2", "Itinerary #3"
- **Editable**: Agent can change name
- Example: "Budget Option", "Luxury Option", "Family-Friendly"

### **Duplicate Functionality**
- Agent can **duplicate** existing itinerary
- Creates new itinerary with same packages/options
- Agent can then modify

### **Editing After "Sent"**
- **Status Flow**: draft → completed → sent
- Editing after "sent" - **to be determined later**

---

## 👥 **6. Operator Information & Contact**

### **Requirement**
- **Operator info is very important** for every package
- After itinerary creation: **Consolidated view** showing:
  - All unique operators used
  - All packages from each operator
  - Operator contact details (email, phone, WhatsApp, website)
- Future: Individual operator-agent chat per package

### **Display**
- In package cards (search panel): Show operator name
- In itinerary package cards: Show operator badge
- **Consolidated Modal/Section** after itinerary creation:
  - Lists all operators
  - Shows all packages per operator
  - Shows contact details
  - [Chat] [Copy Details] [Export All] buttons

### **In PDF**
- Separate section at end
- Lists all operators with contact details

---

## 💱 **7. Currency Handling**

### **Current Requirement**
- **Single currency** (USD as default)
- All pricing in one currency
- Real-time conversion not needed

### **Future Enhancement**
- Multi-currency support - **to be implemented later**

---

## 🎨 **8. UI Layout - Most Intuitive**

### **Recommended: Responsive 3-Column → 2-Column → Stacked**

#### **Desktop (1920px+): 3-Column Layout**
```
┌──────────┬───────────────────┬─────────┐
│ Packages │   Itinerary        │ Summary │
│ (30%)    │   (50%)            │ (20%)   │
│          │                    │         │
│ Search   │   Day 1            │ Total:  │
│ Filters  │   Day 2            │ $1,250  │
│ Package  │   Day 3            │ Budget: │
│ List     │   [+ Add Day]      │ ✅ OK   │
│          │                    │         │
│          │                    │ Actions │
└──────────┴───────────────────┴─────────┘
```

#### **Medium Screens (1024-1920px): 2-Column with Bottom Bar**
```
┌──────────────┬──────────────────┐
│ Packages     │   Itinerary      │
│ (40%)        │   (60%)          │
│              │                  │
└──────────────┴──────────────────┘
┌──────────────────────────────────┐
│ Summary: Total $1,250 | Actions  │
└──────────────────────────────────┘
```

#### **Mobile/Tablet (<1024px): Stacked with Tabs**
```
┌──────────────────────────┐
│ [Packages] [Itinerary]   │ ← Tabs
│                          │
│ Itinerary Builder        │
│                          │
│ [+ Add Package]          │
└──────────────────────────┘
[Summary: Expandable Panel]
```

---

## 📋 **9. Package Configuration Modal**

### **When Agent Clicks "Add Package"**

Show modal with configuration based on package type:

#### **Activity Package:**
```
┌─────────────────────────────────────┐
│ Mount Batur Trek                     │
│ Operator: Bali Adventure Tours      │
│                                      │
│ Package Option:                      │
│ ○ Ticket Only ($75/person)          │
│ ○ Private Transfer                   │
│   [Select Vehicle ▼]                │
│     • Sedan - $30                    │
│     • SUV - $45                      │
│ ○ Shared Transfer ($10/person)      │
│                                      │
│ Pricing Breakdown:                   │
│ Adults (2): 2 × $75 = $150          │
│ Children (1): 1 × $50 = $50         │
│ Vehicle: $30                         │
│ ──────────────────────────────      │
│ Total: $230                          │
│                                      │
│ [Add to Itinerary]                   │
└─────────────────────────────────────┘
```

#### **Multi-City Package:**
```
┌─────────────────────────────────────┐
│ Bali-Lombok Experience (4 Days)     │
│ Operator: Island Tours              │
│                                      │
│ Pricing Model:                       │
│ ○ STANDARD (Per Person)            │
│ ● GROUP (Per Person + Vehicles)    │
│                                      │
│ Per Person Pricing:                 │
│ Adult: $500, Child: $350            │
│                                      │
│ Vehicle (if GROUP):                 │
│ [Select Vehicle ▼]                  │
│   • Sedan - $200                    │
│   • SUV - $300                      │
│                                      │
│ Hotel Selection:                     │
│ City: Bali (3 nights)               │
│   [Select Hotel ▼]                  │
│     • Luxury Resort - $150/night   │
│     • Mid Hotel - $80/night         │
│                                      │
│ City: Lombok (2 nights)             │
│   [Select Hotel ▼]                  │
│     • Beach Resort - $120/night    │
│                                      │
│ Pricing:                             │
│ Base: (2×$500) + (1×$350) = $1,350 │
│ Vehicle: $200                        │
│ Hotels: ($150×3) + ($120×2) = $690  │
│ ──────────────────────────────      │
│ Total: $2,240                        │
│                                      │
│ [Add to Itinerary]                   │
└─────────────────────────────────────┘
```

---

## ✅ **Confirmed Requirements Summary**

1. ✅ **Package Options**: Use ONLY options from 5 package forms
   - Activity: TICKET_ONLY, PRIVATE_TRANSFER, SHARED_TRANSFER
   - Transfer: Hourly or Point-to-Point
   - Multi-City: STANDARD or GROUP pricing + Hotel selection
   - Multi-City Hotel: Same as Multi-City
   - Fixed Departure: Same as Multi-City + Fixed dates

2. ✅ **NO Variants**: Activity packages have NO variants (tab removed)

3. ✅ **NO Group Discounts**: None of the 5 package types have group discounts

4. ✅ **Hotel Selection**: Inline minimal selection with real-time price updates
   - Hotels come from packages only
   - Select per city night
   - Price updates immediately

5. ✅ **Adult/Child Input**: At start of itinerary creation
   - Used for all pricing calculations

6. ✅ **Real-Time Pricing**: Total updates as agent adds/modifies packages

7. ✅ **Multiple Itineraries**: 
   - Default names: "Itinerary #1", "#2", "#3"
   - Editable names
   - Can duplicate
   - Editing after "sent" - TBD later

8. ✅ **Operator Contact**: Consolidated view after creation

9. ✅ **Currency**: Single currency (USD) for now

10. ✅ **UI Layout**: Responsive 3-column → 2-column → stacked

---

## 🎯 **Ready for Implementation**

All requirements are confirmed and understood! ✅

**Key Takeaways:**
- Use ONLY fields/options from the 5 package forms
- NO variants, NO group discounts
- Hotel selection: inline, minimal, real-time pricing
- Multiple itineraries with editable names
- Duplicate functionality
- Operator contact consolidated view

**Next Step:** Ready to start implementation! 🚀

