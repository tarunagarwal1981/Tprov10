# Simulation/Demo Setup Plan - Complete Itinerary Workflow

## 🎯 Overview

This plan outlines creating a complete simulation with dummy data where:
- 5 Tour Operators are created with full profiles
- Multiple packages (Activities, Transfers, Multi-City, etc.) are added for Indonesia
- 2-3 Marketplace Leads are created that match the packages
- Travel Agent can purchase leads → create itineraries → download PDF

**Goal**: End-to-end demonstration where agent can create complete 3-4 day itineraries using real database data.

---

## 📊 Simulation Data Strategy

### Destination Focus: **Indonesia**

**Why Indonesia?**
- Popular destination with diverse activities
- Can include: Bali (beaches, temples, activities), Jakarta (city tours), Yogyakarta (cultural), Lombok (adventure)
- Supports multiple package types naturally
- Allows for multi-city itineraries

### Package Mix Strategy

**For a complete 3-4 day itinerary, we need:**
1. **Arrival Day**: Airport transfers, hotel check-in activities
2. **Day 1-2**: Main activities, tours, experiences
3. **Day 3-4**: More activities, possibly multi-city transfer, departure transfers
4. **Throughout**: Accommodation options, meals, transport

---

## 👥 Step 1: Create 5 Tour Operators

### Operator Profiles

#### **Operator 1: "Bali Adventure Tours"**
- **Email**: `bali.adventure@touroperator.com`
- **Business Name**: "Bali Adventure Tours"
- **Specialization**: Adventure activities, water sports, trekking
- **Focus**: Bali, Lombok
- **Packages to Create**:
  - Activity: Sunrise Mount Batur Trekking
  - Activity: White Water Rafting in Ayung River
  - Transfer: Airport to Ubud Hotels
  - Transfer: Ubud to Tanah Lot Temple

#### **Operator 2: "Java Cultural Experiences"**
- **Email**: `java.cultural@touroperator.com`
- **Business Name**: "Java Cultural Experiences"
- **Specialization**: Cultural tours, temple visits, heritage
- **Focus**: Yogyakarta, Central Java, Borobudur
- **Packages to Create**:
  - Activity: Borobudur Sunrise Tour
  - Activity: Prambanan Temple Complex Tour
  - Transfer: Yogyakarta Airport to Hotels
  - Transfer: City Tour - Temple Circuit

#### **Operator 3: "Island Paradise Transfers"**
- **Email**: `island.transfers@touroperator.com`
- **Business Name**: "Island Paradise Transfers"
- **Specialization**: Premium transfers, inter-city transport
- **Focus**: Bali, Lombok, inter-island
- **Packages to Create**:
  - Transfer: Bali Airport VIP Transfer
  - Transfer: Bali to Lombok Ferry Transfer
  - Transfer: Premium City-to-City Transfers
  - Multi-City: Bali - Lombok - Gili Islands Package

#### **Operator 4: "Bali Beach Activities"**
- **Email**: `bali.beach@touroperator.com`
- **Business Name**: "Bali Beach Activities"
- **Specialization**: Water sports, beach activities, relaxation
- **Focus**: Bali beaches (Seminyak, Canggu, Sanur)
- **Packages to Create**:
  - Activity: Surfing Lessons in Canggu
  - Activity: Snorkeling Day Trip to Nusa Penida
  - Activity: Beach Club Access + Lunch
  - Transfer: Hotel to Beach Locations

#### **Operator 5: "Premium Indonesia Tours"**
- **Email**: `premium.indonesia@touroperator.com`
- **Business Name**: "Premium Indonesia Tours"
- **Specialization**: Luxury experiences, multi-city packages
- **Focus**: All Indonesia, premium services
- **Packages to Create**:
  - Multi-City: Bali - Yogyakarta - Jakarta (4 days)
  - Fixed Departure: Luxury Java Discovery Tour
  - Activity: Private Cooking Class in Ubud
  - Transfer: Premium Airport Concierge Service

---

## 📦 Step 2: Create Packages (SQL Queries)

### Package Distribution by Operator

**Total Packages Needed**: ~20-25 packages

#### **Activity Packages** (~10)
- Mountain trekking
- Water activities (rafting, snorkeling, surfing)
- Cultural tours (temples, heritage)
- Cooking classes
- Beach activities

#### **Transfer Packages** (~8)
- Airport transfers (various locations)
- Inter-city transfers
- City tour transfers
- Premium/VIP transfers

#### **Multi-City Packages** (~3-4)
- Bali + Lombok
- Java Cultural Circuit
- Beach to City packages

#### **Fixed Departure Packages** (~2)
- Pre-planned group tours
- Scheduled departures

### Package Details Structure

Each package should have:
- Realistic titles and descriptions
- Proper pricing (in USD or IDR)
- Destination matching Indonesia locations
- Status = 'published' (so agents can see them)
- Realistic duration, capacity, etc.
- Images (optional but nice to have placeholder URLs)

---

## 🎫 Step 3: Create 2-3 Marketplace Leads

### Lead Design Criteria

**Each lead should:**
1. **Match available packages** - Destination should align with packages created
2. **Support 3-4 day itinerary** - Duration and requirements allow complete itinerary
3. **Have realistic requirements** - Budget, travelers, dates that work
4. **Include customer details** (hidden initially, revealed after purchase)

### Lead 1: "Bali Adventure & Culture - 4 Days"

**Profile:**
- **Title**: "Adventure & Culture Experience in Bali"
- **Destination**: "Bali, Indonesia"
- **Trip Type**: ADVENTURE
- **Budget**: $2,500 - $3,500
- **Duration**: 4 days
- **Travelers**: 2 adults
- **Travel Dates**: Flexible (next 3 months)
- **Special Requirements**: "Interested in mountain trekking, water sports, and cultural temple visits. Prefer active experiences."

**Customer Info** (hidden until purchase):
- Name: "Sarah & John Mitchell"
- Email: "sarah.mitchell@example.com"
- Phone: "+1-555-0123"
- Detailed Requirements: "We're celebrating our anniversary. Want a mix of adventure and relaxation. Prefer eco-friendly operators."

**Packages This Lead Will Use:**
- Sunrise Mount Batur Trek (Operator 1)
- White Water Rafting (Operator 1)
- Borobudur Temple Tour (Operator 2) - if agent includes Java
- Airport Transfers (Operator 3)
- Beach Activities (Operator 4)
- Premium Multi-City option (Operator 5)

**Itinerary Possibility:**
- Day 1: Arrival, airport transfer, check-in, optional beach activity
- Day 2: Sunrise Mount Batur trek, afternoon rafting
- Day 3: Temple tours, cultural experiences, beach time
- Day 4: Optional activities, departure

### Lead 2: "Java Cultural Discovery - 3 Days"

**Profile:**
- **Title**: "Java Cultural Heritage Tour"
- **Destination**: "Yogyakarta, Central Java, Indonesia"
- **Trip Type**: CULTURAL
- **Budget**: $1,800 - $2,500
- **Duration**: 3 days
- **Travelers**: 1 adult (solo traveler)
- **Travel Dates**: Next 2 months
- **Special Requirements**: "Focus on historical sites, temples, and local culture. Solo traveler, prefer small group tours."

**Customer Info** (hidden until purchase):
- Name: "Michael Chen"
- Email: "michael.chen@example.com"
- Phone: "+1-555-0456"
- Detailed Requirements: "First time in Indonesia. Interested in photography at historical sites. Comfortable with basic accommodations."

**Packages This Lead Will Use:**
- Borobudur Sunrise (Operator 2)
- Prambanan Tour (Operator 2)
- Airport Transfers (Operator 2)
- City Tour Transfers (Operator 2)
- Cultural Cooking Class (Operator 5)

**Itinerary Possibility:**
- Day 1: Arrival, airport transfer, hotel check-in, afternoon city orientation
- Day 2: Early morning Borobudur sunrise, afternoon Prambanan temple
- Day 3: Cultural experiences, optional cooking class, departure

### Lead 3: "Bali-Lombok Island Hopping - 4 Days"

**Profile:**
- **Title**: "Island Hopping: Bali & Lombok Experience"
- **Destination**: "Bali & Lombok, Indonesia"
- **Trip Type**: BEACH
- **Budget**: $3,000 - $4,000
- **Duration**: 4 days
- **Travelers**: 2 adults, 1 child (age 8)
- **Travel Dates**: School holiday period
- **Special Requirements**: "Family vacation. Need child-friendly activities. Beach-focused but some cultural exposure. All transfers included."

**Customer Info** (hidden until purchase):
- Name: "The Rodriguez Family"
- Email: "maria.rodriguez@example.com"
- Phone: "+1-555-0789"
- Detailed Requirements: "Traveling with 8-year-old. Need family-friendly operators. Prefer morning activities (child's energy levels). Vegetarian meal options required."

**Packages This Lead Will Use:**
- Multi-City Package (Operator 3) - Bali to Lombok
- Beach Activities (Operator 4)
- Family-friendly Activities (Operators 1, 4)
- Premium Transfers (Operator 3)
- Family Transfer Packages (Multiple operators)

**Itinerary Possibility:**
- Day 1: Bali arrival, transfer, beach activity
- Day 2: Morning activity, transfer to Lombok
- Day 3: Lombok beach activities, family-friendly experiences
- Day 4: Return to Bali or direct departure from Lombok

---

## 🔄 Step 4: Agent Purchase & Lead Transfer Flow

### Current State
- Leads are in `lead_marketplace` table with `status = 'AVAILABLE'`
- Customer details are hidden (not in marketplace table initially)

### Purchase Flow (Dummy Button - No Payment)

1. **Agent browses marketplace** (`/agent/marketplace`)
   - Sees the 2-3 leads created
   - Can see public info (destination, budget, duration, requirements)
   - Customer details are NOT visible

2. **Agent clicks "Buy Lead"** (dummy button - no payment processing)
   - Backend creates entry in `lead_purchases` table
   - Updates `lead_marketplace.status = 'PURCHASED'`
   - **Creates entry in `leads` table** with:
     - All public info from marketplace
     - **Unlocks customer details** (customer_name, customer_email, customer_phone, detailed_requirements)
     - Links via `marketplace_lead_id` and `purchase_id`
     - Sets `purchased_from_marketplace = TRUE`
     - Sets `source = 'MARKETPLACE'`
     - Sets `stage = 'NEW'`

3. **Lead appears in My Leads**
   - Query: `SELECT * FROM leads WHERE agent_id = current_user AND purchased_from_marketplace = TRUE`
   - Shows full customer information
   - Shows "Create Itinerary" button

### Tables to Update/Create

**If `leads` table doesn't exist, create it:**
```sql
-- Create leads table (from previous plan)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Customer Information (revealed after purchase)
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    
    -- Trip Details (from marketplace)
    destination TEXT NOT NULL,
    trip_type trip_type,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    duration_days INTEGER,
    travelers_count INTEGER DEFAULT 1,
    travel_date_start DATE,
    travel_date_end DATE,
    
    -- Lead Management
    source lead_source DEFAULT 'MARKETPLACE',
    priority lead_priority DEFAULT 'MEDIUM',
    stage lead_stage DEFAULT 'NEW',
    
    -- Requirements
    requirements TEXT,
    notes TEXT,
    
    -- Marketplace Integration
    marketplace_lead_id UUID REFERENCES lead_marketplace(id) ON DELETE SET NULL,
    is_purchased BOOLEAN DEFAULT TRUE,
    purchased_from_marketplace BOOLEAN DEFAULT TRUE,
    purchase_id UUID REFERENCES lead_purchases(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enums if not exist
CREATE TYPE lead_source AS ENUM ('MARKETPLACE', 'MANUAL', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'EMAIL_CAMPAIGN', 'PHONE_INQUIRY', 'WALK_IN', 'PARTNER', 'OTHER');
CREATE TYPE lead_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE lead_stage AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST', 'ARCHIVED');
```

**After purchase, insert into leads:**
```sql
-- This would be done by backend service when agent clicks "Buy"
INSERT INTO leads (
    agent_id,
    customer_name,
    customer_email,
    customer_phone,
    destination,
    trip_type,
    budget_min,
    budget_max,
    duration_days,
    travelers_count,
    travel_date_start,
    travel_date_end,
    requirements,
    source,
    marketplace_lead_id,
    purchase_id,
    is_purchased,
    purchased_from_marketplace
) 
SELECT 
    {agent_id}, -- from auth
    customer_name, -- from hidden marketplace field
    customer_email,
    customer_phone,
    destination,
    trip_type,
    budget_min,
    budget_max,
    duration_days,
    travelers_count,
    travel_date_start,
    travel_date_end,
    special_requirements,
    'MARKETPLACE',
    lm.id,
    lp.id, -- purchase_id
    TRUE,
    TRUE
FROM lead_marketplace lm
INNER JOIN lead_purchases lp ON lp.lead_id = lm.id
WHERE lm.id = {purchased_lead_id};
```

---

## 🗺️ Step 5: Itinerary Creation Flow

### Page: `/agent/itineraries/create?leadId={id}`

### Process Flow

1. **Agent clicks "Create Itinerary" on a lead**
   - Navigates to itinerary builder
   - System extracts `destination` from `leads` table
   - System extracts `duration_days` from leads (e.g., 3 or 4 days)

2. **System searches for matching packages**
   - Query all package tables for Indonesia-related packages:
     ```sql
     -- Activity packages
     SELECT * FROM activity_packages 
     WHERE destination_country ILIKE '%Indonesia%' 
       OR destination_city IN ('Bali', 'Jakarta', 'Yogyakarta', 'Lombok')
       AND status = 'published';
     
     -- Transfer packages
     SELECT * FROM transfer_packages
     WHERE destination_country ILIKE '%Indonesia%'
       OR destination_city IN ('Bali', 'Jakarta', 'Yogyakarta', 'Lombok')
       AND status = 'published';
     
     -- Multi-city packages
     SELECT * FROM multi_city_packages
     WHERE destination_region ILIKE '%Indonesia%'
       AND status = 'published';
     
     -- Fixed departure packages
     SELECT * FROM fixed_departure_flight_packages
     WHERE destination ILIKE '%Indonesia%'
       AND status = 'published';
     ```

3. **Display packages in sidebar**
   - Filter by type (Activity, Transfer, Multi-City, etc.)
   - Show operator name
   - Show price
   - Show duration
   - Show location

4. **Agent builds day-wise itinerary**
   - System auto-generates days based on `leads.duration_days`
   - Agent drags/drops or clicks to add packages to specific days
   - Can add multiple packages per day
   - System calculates total price

5. **Itinerary structure for 3-4 days:**

   **Example: 4-Day Bali Adventure (Lead 1)**
   ```
   Day 1 (Arrival):
   - 10:00 AM: Airport Transfer (Operator 3) - Bali Airport to Hotel
   - 02:00 PM: Hotel Check-in
   - 04:00 PM: Beach Activity (Operator 4) - Canggu Beach
   
   Day 2 (Adventure Day):
   - 02:00 AM: Pickup for Sunrise Trek
   - 03:00 AM: Mount Batur Sunrise Trek (Operator 1)
   - 01:00 PM: White Water Rafting (Operator 1)
   - 06:00 PM: Return to Hotel
   
   Day 3 (Cultural Day):
   - 09:00 AM: Transfer to Temples (Operator 2)
   - 10:00 AM: Temple Tour Activity (Operator 2)
   - 02:00 PM: Cultural Experience (Operator 5)
   - 06:00 PM: Return to Hotel
   
   Day 4 (Departure):
   - 10:00 AM: Optional Last Activity
   - 02:00 PM: Hotel to Airport Transfer (Operator 3)
   - 04:00 PM: Departure
   ```

6. **Save itinerary**
   - Creates entry in `itineraries` table
   - Creates entries in `itinerary_days` table
   - Creates entries in `itinerary_day_items` table
   - Links all packages used

---

## 📄 Step 6: PDF Generation

### PDF Template Design

**Structure:**
1. **Cover Page**
   - Customer name
   - Destination: "Bali, Indonesia"
   - Duration: "4 Days"
   - Travel dates
   - Itinerary number/reference

2. **Customer Details Page**
   - Full customer information
   - Agent contact information
   - Booking reference

3. **Trip Overview**
   - Day-by-day summary
   - Total price breakdown
   - Included/Excluded items

4. **Daily Detailed Itinerary**
   - **Day 1**: Date, day title
     - Timeline view
     - Each activity/transfer with:
       - Time
       - Activity name
       - Operator name
       - Description
       - Location
       - Duration
       - Price
   - **Day 2-4**: Same format

5. **Package Details Section**
   - Detailed information about each package used
   - Operator contact information
   - Cancellation policies
   - Important notes

6. **Pricing Summary**
   - Itemized pricing
   - Subtotal
   - Taxes/fees
   - Total
   - Payment terms

7. **Terms & Conditions**
   - Booking terms
   - Cancellation policy
   - Contact information

### PDF Generation Technology

**Options:**
1. **React-PDF** (`@react-pdf/renderer`) - Client-side, good for React apps
2. **Puppeteer** - Server-side, renders HTML to PDF
3. **PDFKit** - Server-side, programmatic PDF creation
4. **jsPDF** - Client-side, simpler but less control

**Recommended**: React-PDF or Puppeteer for better formatting control

### PDF Storage

- Generate PDF
- Upload to Supabase Storage: `/itineraries/{itinerary_id}/{timestamp}.pdf`
- Store reference in `itinerary_documents` table
- Provide download link to agent

---

## 📋 Complete SQL Setup Script Structure

### Script Organization

```sql
-- ============================================================================
-- SIMULATION SETUP: Complete Demo Data for Indonesia Itinerary Workflow
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE TOUR OPERATORS
-- ============================================================================
-- 1.1 Create 5 operators in auth.users (via Supabase Auth or manual insert)
-- 1.2 Create user profiles in users table
-- 1.3 Set user roles and metadata

-- ============================================================================
-- PART 2: CREATE PACKAGES
-- ============================================================================
-- 2.1 Operator 1 Packages (Bali Adventure Tours)
--     - Activity: Mount Batur Trek
--     - Activity: White Water Rafting
--     - Transfer: Airport to Ubud
--     - Transfer: Ubud to Tanah Lot
--
-- 2.2 Operator 2 Packages (Java Cultural Experiences)
--     - Activity: Borobudur Sunrise
--     - Activity: Prambanan Tour
--     - Transfer: Yogyakarta Airport
--     - Transfer: Temple Circuit
--
-- 2.3 Operator 3 Packages (Island Paradise Transfers)
--     - Transfer: Bali Airport VIP
--     - Transfer: Bali to Lombok Ferry
--     - Multi-City: Bali-Lombok-Gili
--
-- 2.4 Operator 4 Packages (Bali Beach Activities)
--     - Activity: Surfing Lessons
--     - Activity: Snorkeling Nusa Penida
--     - Activity: Beach Club Access
--     - Transfer: Hotel to Beach
--
-- 2.5 Operator 5 Packages (Premium Indonesia Tours)
--     - Multi-City: Bali-Yogyakarta-Jakarta
--     - Fixed Departure: Java Discovery
--     - Activity: Cooking Class
--     - Transfer: Premium Airport Service

-- ============================================================================
-- PART 3: CREATE MARKETPLACE LEADS
-- ============================================================================
-- 3.1 Lead 1: "Bali Adventure & Culture - 4 Days"
-- 3.2 Lead 2: "Java Cultural Discovery - 3 Days"
-- 3.3 Lead 3: "Bali-Lombok Island Hopping - 4 Days"

-- ============================================================================
-- PART 4: CREATE LEADS TABLE (if not exists)
-- ============================================================================
-- 4.1 Create leads table structure
-- 4.2 Create enums (lead_source, lead_priority, lead_stage)
-- 4.3 Set up RLS policies
-- 4.4 Create indexes

-- ============================================================================
-- PART 5: VERIFY DATA
-- ============================================================================
-- 5.1 Check operator counts
-- 5.2 Check package counts per operator
-- 5.3 Check marketplace leads
-- 5.4 Verify package destinations match lead destinations
```

---

## ✅ Verification Checklist

Before marking setup complete:

### Operators
- [ ] 5 operators created in auth.users
- [ ] 5 operators have profiles in users table
- [ ] All operators have role = 'TOUR_OPERATOR'
- [ ] Can log in with operator emails

### Packages
- [ ] ~20-25 total packages created
- [ ] Packages distributed across all 5 operators
- [ ] All packages have status = 'published'
- [ ] All packages have destination matching "Indonesia"
- [ ] Package types: Activities, Transfers, Multi-City, Fixed Departure
- [ ] Packages can form complete 3-4 day itineraries

### Marketplace Leads
- [ ] 2-3 leads in lead_marketplace table
- [ ] All leads have status = 'AVAILABLE'
- [ ] Leads have realistic destinations (Bali, Java, Lombok)
- [ ] Leads have customer details (hidden initially)
- [ ] Leads match available packages

### Leads Table
- [ ] Leads table exists
- [ ] RLS policies set up
- [ ] Indexes created
- [ ] Can insert purchased leads

### Testing Flow
- [ ] Agent can see leads in marketplace
- [ ] Agent can click "Buy" (dummy) and lead creates in leads table
- [ ] Agent can see purchased leads in "My Leads"
- [ ] Agent can click "Create Itinerary" from lead
- [ ] Agent sees relevant packages from all 5 operators
- [ ] Agent can build complete 3-4 day itinerary
- [ ] Agent can save itinerary
- [ ] Agent can generate PDF
- [ ] PDF is properly formatted with all details

---

## 🎯 Key Design Decisions

### 1. All Packages for Same Region
- All packages focused on Indonesia (Bali, Java, Lombok)
- Ensures packages match leads naturally
- Allows complete itinerary creation

### 2. Realistic Data
- Use realistic names, emails, phone numbers
- Realistic pricing (USD or IDR)
- Realistic durations and descriptions
- Proper location names (real Indonesian destinations)

### 3. Interconnected Design
- Leads designed to use packages from multiple operators
- Packages designed to work together
- Itineraries can be fully formed

### 4. Database Integrity
- All foreign keys properly set
- All relationships maintained
- RLS policies ensure security
- Status fields control visibility

### 5. Progressive Reveal
- Customer details hidden in marketplace
- Revealed after purchase
- Maintains privacy until purchase

---

## 📝 Implementation Order

1. **Create operators** (Part 1)
2. **Create packages** (Part 2) - Start with Operator 1, then 2, etc.
3. **Create marketplace leads** (Part 3)
4. **Create/verify leads table** (Part 4)
5. **Test purchase flow** - Agent buys a lead
6. **Test itinerary creation** - Build complete itinerary
7. **Test PDF generation** - Generate and download PDF
8. **End-to-end test** - Complete workflow

---

## 🔍 Data Validation Queries

After setup, run these to verify:

```sql
-- Check operators
SELECT id, email, raw_user_meta_data->>'role' as role 
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'TOUR_OPERATOR';

-- Check packages per operator
SELECT 
    operator_id,
    COUNT(*) as package_count,
    status
FROM activity_packages
GROUP BY operator_id, status
UNION ALL
SELECT 
    operator_id,
    COUNT(*) as package_count,
    status
FROM transfer_packages
GROUP BY operator_id, status;

-- Check marketplace leads
SELECT 
    id,
    title,
    destination,
    status,
    lead_price
FROM lead_marketplace
WHERE status = 'AVAILABLE';

-- Verify lead-package match
SELECT 
    lm.destination,
    COUNT(DISTINCT ap.id) as activity_packages,
    COUNT(DISTINCT tp.id) as transfer_packages
FROM lead_marketplace lm
LEFT JOIN activity_packages ap ON ap.destination_country ILIKE '%' || lm.destination || '%'
LEFT JOIN transfer_packages tp ON tp.destination_country ILIKE '%' || lm.destination || '%'
GROUP BY lm.destination;
```

---

## 🎬 Simulation Scenarios

### Scenario 1: 4-Day Bali Adventure
- **Lead**: Lead 1 (Bali Adventure & Culture)
- **Packages Used**:
  - Day 1: Airport transfer (Op 3), Beach activity (Op 4)
  - Day 2: Mount Batur trek (Op 1), Rafting (Op 1)
  - Day 3: Temple tours (Op 2), Cultural experience (Op 5)
  - Day 4: Departure transfer (Op 3)
- **Result**: Complete 4-day itinerary using 5 different operators

### Scenario 2: 3-Day Java Culture
- **Lead**: Lead 2 (Java Cultural Discovery)
- **Packages Used**:
  - Day 1: Airport transfer (Op 2), City orientation
  - Day 2: Borobudur sunrise (Op 2), Prambanan (Op 2)
  - Day 3: Cooking class (Op 5), Departure transfer (Op 2)
- **Result**: Focused 3-day cultural itinerary

### Scenario 3: 4-Day Island Hopping
- **Lead**: Lead 3 (Bali-Lombok Island Hopping)
- **Packages Used**:
  - Day 1: Bali arrival (Op 3), Beach activities (Op 4)
  - Day 2: Multi-city transfer (Op 3) to Lombok, Family activities
  - Day 3: Lombok beach activities (Op 4)
  - Day 4: Departure from Lombok (Op 3)
- **Result**: Multi-island itinerary with inter-island transfer

---

## ✅ Success Criteria

The simulation is successful when:

1. ✅ Agent can browse marketplace and see 2-3 leads
2. ✅ Agent can purchase a lead (dummy button) and see it in My Leads
3. ✅ Agent can click "Create Itinerary" and see relevant packages from all 5 operators
4. ✅ Agent can build a complete 3-4 day itinerary using packages from multiple operators
5. ✅ Itinerary includes: transfers, activities, and possibly multi-city elements
6. ✅ Agent can save itinerary to database
7. ✅ Agent can generate a properly formatted PDF
8. ✅ PDF includes all itinerary details, customer info, package details, pricing

---

## 📌 Notes

1. **All data is in database** - No hardcoded mock data, everything in tables
2. **Real relationships** - Foreign keys, proper linking
3. **Can be extended** - Easy to add more operators, packages, leads
4. **Production-ready structure** - Same structure used in production
5. **Testing-friendly** - Clear scenarios to test
6. **Documentation** - Easy to understand and modify

---

## 🚀 Next Steps After Setup

Once simulation data is created:

1. Test marketplace browse functionality
2. Test purchase flow (dummy button)
3. Test lead transfer to My Leads
4. Test package search by destination
5. Test itinerary builder UI
6. Test itinerary save functionality
7. Test PDF generation
8. Test complete end-to-end flow
9. Fix any issues found
10. Document any deviations or special cases

---

## 📄 Summary

This plan creates a complete simulation where:
- **5 operators** create **20-25 packages** for Indonesia
- **2-3 marketplace leads** are created that match the packages
- **Agent can purchase leads** → **create itineraries** → **download PDFs**
- All data is **database-driven** and **properly related**
- **Complete end-to-end workflow** is demonstrated

The setup allows for realistic testing of the entire itinerary creation workflow with real database data that forms complete, usable itineraries.
