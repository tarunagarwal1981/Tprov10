# Agent Functionality - Complete Planning Document

## 📋 Overview

This document outlines the complete planning for agent functionality including lead management, itinerary creation, and customer engagement features.

---

## 🎯 Current State Analysis

### ✅ Already Implemented
1. **Lead Marketplace**
   - Admin can post leads (`lead_marketplace` table exists)
   - Leads contain basic info without customer details in marketplace
   - Agent can browse available leads
   - Purchase flow exists but uses dummy button (no payment yet)

2. **Lead Purchases**
   - `lead_purchases` table tracks agent purchases
   - After purchase, leads appear in "My Leads" page
   - Customer details are revealed after purchase

3. **My Leads Page**
   - Shows purchased leads
   - Displays customer contact information
   - Basic lead details visible

### ❌ Not Yet Implemented
1. **Leads Table** - Full leads table doesn't exist (only marketplace and purchases)
2. **Itinerary System** - No itinerary creation or management
3. **Package Selection** - No way to browse and select packages for itineraries
4. **PDF Generation** - No itinerary PDF export
5. **Email Functionality** - No email sending capability
6. **WhatsApp Integration** - Future feature

---

## 🗄️ Database Schema Design

### 1. Leads Table (Create New)

**Purpose**: Store all leads owned by agents (both purchased and manually created)

```sql
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Customer Information (Full details after purchase)
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    
    -- Trip Details (from marketplace or manually entered)
    destination TEXT NOT NULL,
    trip_type trip_type, -- References marketplace trip_type enum
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    duration_days INTEGER,
    travelers_count INTEGER DEFAULT 1,
    travel_date_start DATE,
    travel_date_end DATE,
    
    -- Lead Management
    source lead_source DEFAULT 'MARKETPLACE', -- MARKETPLACE, MANUAL, REFERRAL, etc.
    priority lead_priority DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    stage lead_stage DEFAULT 'NEW', -- NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST, ARCHIVED
    assigned_to UUID REFERENCES auth.users(id),
    
    -- Additional Information
    requirements TEXT,
    notes TEXT,
    tags TEXT[],
    
    -- Marketplace Integration
    marketplace_lead_id UUID REFERENCES lead_marketplace(id) ON DELETE SET NULL,
    is_purchased BOOLEAN DEFAULT FALSE,
    purchased_from_marketplace BOOLEAN DEFAULT FALSE,
    purchase_id UUID REFERENCES lead_purchases(id) ON DELETE SET NULL,
    
    -- Follow-up Management
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    
    -- Conversion Tracking
    converted_to_booking BOOLEAN DEFAULT FALSE,
    booking_id UUID,
    estimated_value DECIMAL(10,2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_budget CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_max >= budget_min),
    CONSTRAINT valid_duration CHECK (duration_days IS NULL OR duration_days > 0),
    CONSTRAINT valid_travelers CHECK (travelers_count > 0)
);

-- Enums needed
CREATE TYPE lead_source AS ENUM ('MARKETPLACE', 'MANUAL', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'EMAIL_CAMPAIGN', 'PHONE_INQUIRY', 'WALK_IN', 'PARTNER', 'OTHER');
CREATE TYPE lead_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE lead_stage AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST', 'ARCHIVED');

-- Indexes
CREATE INDEX idx_leads_agent_id ON leads(agent_id);
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_destination ON leads(destination);
CREATE INDEX idx_leads_marketplace_id ON leads(marketplace_lead_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
```

### 2. Itineraries Table

**Purpose**: Store itineraries created by agents for leads

```sql
CREATE TABLE itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Itinerary Basic Info
    title TEXT NOT NULL,
    description TEXT,
    destination TEXT NOT NULL, -- Detected from lead or manually set
    
    -- Trip Details
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    travelers_count INTEGER NOT NULL DEFAULT 1,
    
    -- Status
    status itinerary_status DEFAULT 'DRAFT', -- DRAFT, SHARED, ACCEPTED, REJECTED, COMPLETED
    version INTEGER DEFAULT 1, -- Track revisions
    
    -- Pricing (calculated from selected packages)
    total_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Customer Interaction
    shared_with_customer_at TIMESTAMP WITH TIME ZONE,
    customer_feedback TEXT,
    
    -- Metadata
    notes TEXT,
    tags TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (end_date >= start_date),
    CONSTRAINT valid_total_days CHECK (total_days > 0),
    CONSTRAINT valid_price CHECK (total_price IS NULL OR total_price >= 0)
);

CREATE TYPE itinerary_status AS ENUM ('DRAFT', 'SHARED', 'ACCEPTED', 'REJECTED', 'COMPLETED');

-- Indexes
CREATE INDEX idx_itineraries_lead_id ON itineraries(lead_id);
CREATE INDEX idx_itineraries_agent_id ON itineraries(agent_id);
CREATE INDEX idx_itineraries_status ON itineraries(status);
CREATE INDEX idx_itineraries_created_at ON itineraries(created_at DESC);
```

### 3. Itinerary Days Table

**Purpose**: Store day-wise breakdown of itinerary

```sql
CREATE TABLE itinerary_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    
    -- Day Information
    day_number INTEGER NOT NULL,
    date DATE NOT NULL,
    city_name TEXT,
    location_name TEXT,
    
    -- Day Description
    title TEXT,
    description TEXT,
    
    -- Accommodation (if applicable)
    accommodation_type TEXT, -- HOTEL, RESORT, HOMESTAY, etc.
    accommodation_name TEXT,
    accommodation_address TEXT,
    
    -- Meal Information
    breakfast_included BOOLEAN DEFAULT FALSE,
    lunch_included BOOLEAN DEFAULT FALSE,
    dinner_included BOOLEAN DEFAULT FALSE,
    meal_details TEXT,
    
    -- Notes
    notes TEXT,
    special_instructions TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_day_number CHECK (day_number > 0),
    CONSTRAINT unique_itinerary_day UNIQUE(itinerary_id, day_number)
);

-- Indexes
CREATE INDEX idx_itinerary_days_itinerary_id ON itinerary_days(itinerary_id);
CREATE INDEX idx_itinerary_days_day_number ON itinerary_days(itinerary_id, day_number);
CREATE INDEX idx_itinerary_days_date ON itinerary_days(date);
```

### 4. Itinerary Day Items Table

**Purpose**: Store packages/activities assigned to specific days

```sql
CREATE TABLE itinerary_day_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_day_id UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    
    -- Package Reference
    package_type package_type_enum NOT NULL, -- ACTIVITY, TRANSFER, MULTI_CITY, FIXED_DEPARTURE, HOTEL
    package_id UUID NOT NULL, -- References the specific package table
    operator_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Item Details
    item_type item_type_enum NOT NULL, -- TRANSFER, ACTIVITY, ACCOMMODATION, MEAL, OTHER
    item_name TEXT NOT NULL,
    item_description TEXT,
    
    -- Timing
    start_time TIME,
    end_time TIME,
    duration_hours DECIMAL(4,2),
    
    -- Location
    location_name TEXT,
    location_address TEXT,
    location_coordinates JSONB, -- {latitude, longitude}
    
    -- Pricing
    item_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    price_per_person BOOLEAN DEFAULT FALSE,
    
    -- Additional Info
    operator_name TEXT, -- Tour operator name for display
    booking_reference TEXT, -- If already booked
    confirmation_number TEXT,
    
    -- Notes
    notes TEXT,
    special_instructions TEXT,
    
    -- Ordering
    display_order INTEGER DEFAULT 0, -- Order within the day
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time CHECK (end_time IS NULL OR start_time IS NULL OR end_time >= start_time),
    CONSTRAINT valid_duration CHECK (duration_hours IS NULL OR duration_hours > 0),
    CONSTRAINT valid_price CHECK (item_price IS NULL OR item_price >= 0)
);

CREATE TYPE package_type_enum AS ENUM ('ACTIVITY', 'TRANSFER', 'MULTI_CITY', 'FIXED_DEPARTURE', 'HOTEL', 'OTHER');
CREATE TYPE item_type_enum AS ENUM ('TRANSFER', 'ACTIVITY', 'ACCOMMODATION', 'MEAL', 'FLIGHT', 'OTHER');

-- Indexes
CREATE INDEX idx_itinerary_day_items_day_id ON itinerary_day_items(itinerary_day_id);
CREATE INDEX idx_itinerary_day_items_itinerary_id ON itinerary_day_items(itinerary_id);
CREATE INDEX idx_itinerary_day_items_package ON itinerary_day_items(package_type, package_id);
CREATE INDEX idx_itinerary_day_items_operator ON itinerary_day_items(operator_id);
CREATE INDEX idx_itinerary_day_items_order ON itinerary_day_items(itinerary_day_id, display_order);
```

### 5. Itinerary Documents Table

**Purpose**: Track PDF generation and email sending

```sql
CREATE TABLE itinerary_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    
    -- Document Info
    document_type document_type_enum NOT NULL, -- PDF, EMAIL
    file_path TEXT, -- For PDFs stored in storage
    file_name TEXT,
    file_size INTEGER, -- in bytes
    mime_type TEXT DEFAULT 'application/pdf',
    
    -- Email Specific
    email_to TEXT, -- Recipient email
    email_subject TEXT,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_opened_at TIMESTAMP WITH TIME ZONE,
    
    -- Generation Info
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by UUID REFERENCES auth.users(id),
    
    -- Status
    status document_status DEFAULT 'GENERATED', -- GENERATED, SENT, OPENED, FAILED
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE document_type_enum AS ENUM ('PDF', 'EMAIL');
CREATE TYPE document_status AS ENUM ('GENERATED', 'SENT', 'OPENED', 'FAILED');

-- Indexes
CREATE INDEX idx_itinerary_documents_itinerary_id ON itinerary_documents(itinerary_id);
CREATE INDEX idx_itinerary_documents_type ON itinerary_documents(document_type);
CREATE INDEX idx_itinerary_documents_status ON itinerary_documents(status);
```

### 6. Package Search Cache (Optional - for performance)

**Purpose**: Cache package search results by destination

```sql
CREATE TABLE package_search_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination TEXT NOT NULL,
    search_filters JSONB, -- Store filters used
    
    -- Cache Metadata
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Results (store as JSON for quick retrieval)
    packages_json JSONB NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_destination_filters UNIQUE(destination, search_filters)
);

-- Indexes
CREATE INDEX idx_package_cache_destination ON package_search_cache(destination);
CREATE INDEX idx_package_cache_expires ON package_search_cache(expires_at);
```

---

## 🔄 Data Flow & Process Flow

### Flow 1: Lead Purchase → My Leads

```
1. Admin posts lead to marketplace (customer details hidden)
   └─> lead_marketplace table

2. Agent browses marketplace and clicks "Buy Lead" (dummy button for now)
   └─> Creates entry in lead_purchases table
   └─> Trigger: Mark lead_marketplace.status = 'PURCHASED'

3. System automatically creates entry in leads table
   └─> Copies data from lead_marketplace
   └─> Unlocks customer details (customer_name, customer_email, customer_phone)
   └─> Sets purchased_from_marketplace = TRUE
   └─> Links via marketplace_lead_id and purchase_id

4. Lead appears in agent's "My Leads" page
   └─> Query: SELECT * FROM leads WHERE agent_id = current_user AND purchased_from_marketplace = TRUE
```

### Flow 2: Create Itinerary from Lead

```
1. Agent views lead details in "My Leads" page
   └─> Sees full customer info and trip requirements

2. Agent clicks "Create Itinerary" button
   └─> Navigate to: /agent/itineraries/create?leadId={lead_id}

3. System detects destination from lead
   └─> Extracts destination field from leads table

4. System searches all packages matching destination
   └─> Query activity_packages WHERE destination_name ILIKE '%{destination}%'
   └─> Query transfer_packages WHERE destination_city ILIKE '%{destination}%'
   └─> Query multi_city_packages WHERE destination_region ILIKE '%{destination}%'
   └─> Query fixed_departure_flight_packages WHERE destination ILIKE '%{destination}%'
   └─> Only show packages with status = 'published'

5. Agent creates day-wise itinerary
   └─> Day 1: Add transfer package (Airport → Hotel) from Operator A
   └─> Day 1: Add activity package (City Tour) from Operator B
   └─> Day 1: Add accommodation (optional manual entry or from hotel packages)
   └─> Day 2: Add activity package (Beach Activity) from Operator C
   └─> Day 2: Add transfer package (Hotel → Beach) from Operator D
   └─> ... continue for all days

6. System calculates total price
   └─> Sum all package prices from itinerary_day_items
   └─> Update itineraries.total_price

7. Agent saves itinerary as DRAFT
   └─> INSERT into itineraries table
   └─> INSERT into itinerary_days (one per day)
   └─> INSERT into itinerary_day_items (each package added)

8. Agent can edit, preview, or finalize itinerary
```

### Flow 3: Itinerary to Customer (PDF & Email)

```
1. Agent finalizes itinerary (status = DRAFT → SHARED)
   └─> Update itinerary status

2. Agent clicks "Generate PDF"
   └─> Backend generates PDF using template
   └─> Upload to Supabase Storage: /itineraries/{itinerary_id}/{timestamp}.pdf
   └─> INSERT into itinerary_documents (type = PDF)

3. Agent clicks "Email to Customer"
   └─> System fetches customer_email from leads table
   └─> Uses email service (SendGrid/Resend/etc.) to send PDF
   └─> Email includes:
      - Subject: "Your Travel Itinerary for {destination}"
      - Body: HTML email with itinerary summary
      - Attachment: PDF generated in step 2
   └─> UPDATE itinerary_documents (type = EMAIL, email_sent_at = NOW())
   └─> UPDATE itineraries.shared_with_customer_at = NOW()
   └─> Update lead stage: PROPOSAL_SENT or NEGOTIATION

4. Customer receives email
   └─> (Future: Track email opens via pixel tracking)
```

---

## 🎨 UI/UX Flow Design

### Page 1: My Leads (`/agent/leads`)

**Current State**: ✅ Partially implemented (shows purchased leads)

**Enhancements Needed**:

1. **Lead Card Enhancements**:
   - Add "Create Itinerary" button (prominent CTA)
   - Show lead stage badge (NEW, CONTACTED, QUALIFIED, etc.)
   - Show priority indicator
   - Show if itinerary exists (link to view/edit)

2. **Lead Detail Modal/Page**:
   - Full customer information section
   - Trip requirements expanded view
   - Timeline/activity log
   - Actions:
     - Create Itinerary (primary)
     - Send Email
     - Make Call
     - Update Stage
     - Add Notes

3. **Filtering & Sorting**:
   - Filter by stage
   - Filter by priority
   - Filter by destination
   - Filter by has itinerary / no itinerary
   - Sort by date, priority, destination

### Page 2: Create Itinerary (`/agent/itineraries/create?leadId={id}`)

**New Page - Design**:

```
┌─────────────────────────────────────────────────────────────┐
│ Create Itinerary for [Lead Title]                           │
│ Destination: [Destination Name] | Duration: [X] days        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌───────── Sidebar ─────────┐  ┌──────── Main Area ──────┐│
│ │                           │  │                          ││
│ │ Package Browser           │  │ Day-by-Day Builder       ││
│ │ ───────────────────       │  │                          ││
│ │                          │  │ Day 1: [Date]           ││
│ │ Filter by:               │  │ ┌──────────────────────┐││
│ │ ☐ Activities             │  │ │ 9:00 AM - Transfer   │││
│ │ ☐ Transfers              │  │ │    Airport → Hotel   │││
│ │ ☐ Multi-City             │  │ │    [Package Card]     │││
│ │ ☐ Hotels                 │  │ └──────────────────────┘││
│ │                          │  │ ┌──────────────────────┐││
│ │ Search: [________]      │  │ │ 2:00 PM - Activity   │││
│ │                          │  │ │    City Tour          │││
│ │ Results:                │  │ │    [Package Card]     │││
│ │ ┌──────────────┐        │  │ └──────────────────────┘││
│ │ │ Package Card │        │  │ [Add Package to Day 1]  ││
│ │ │ Title        │        │  │                         ││
│ │ │ Operator     │        │  │ Day 2: [Date]          ││
│ │ │ Price: $XXX  │        │  │ [Add items...]         ││
│ │ │ [Add]        │        │  │                         ││
│ │ └──────────────┘        │  │ ...                     ││
│ │                         │  │                         ││
│ │ ┌──────────────┐        │  │ Total Price: $X,XXX    ││
│ │ │ Package Card │        │  │ [Save Draft] [Preview] ││
│ │ └──────────────┘        │  │ [Generate PDF]          ││
│ │                         │  │                         ││
│ └──────────────────────────┘  └──────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Features**:

1. **Left Sidebar - Package Browser**:
   - Search bar
   - Filter by package type (Activity, Transfer, Multi-City, Hotel)
   - Filter by operator
   - Filter by price range
   - Sort by price, rating, popularity
   - Shows available packages matching destination
   - Each package card shows:
     - Title, description
     - Operator name
     - Price
     - Duration (for activities)
     - "Add to Day X" button

2. **Main Area - Day Builder**:
   - Auto-generate days based on `leads.duration_days`
   - Each day shows:
     - Day number and date
     - Timeline view (items in chronological order)
     - Add buttons for different item types
   - Drag-and-drop reordering (nice-to-have)
   - Manual entry option (for items not from packages)

3. **Actions**:
   - Save as Draft (doesn't update lead stage)
   - Preview Itinerary (modal/page preview)
   - Generate PDF (creates PDF, shows download)
   - Email to Customer (generates PDF + sends email)
   - Continue Editing (stays on page)

### Page 3: View/Edit Itinerary (`/agent/itineraries/[id]`)

**Features**:
- View itinerary in read-only mode by default
- Edit button to modify
- PDF download button
- Email to customer button
- Print-friendly view
- Customer feedback section (if shared)

### Page 4: Itineraries List (`/agent/itineraries`)

**Features**:
- List all itineraries created by agent
- Filter by status (Draft, Shared, Accepted, etc.)
- Filter by lead
- Sort by date, price
- Quick actions: View, Edit, Duplicate, Delete

---

## 🔧 Technical Implementation Details

### 1. Package Search Service

**File**: `src/lib/services/packageSearchService.ts`

```typescript
class PackageSearchService {
  // Search all package types by destination
  async searchByDestination(destination: string, filters?: PackageFilters): Promise<UnifiedPackage[]>
  
  // Get packages by type
  async getActivityPackages(destination: string): Promise<ActivityPackage[]>
  async getTransferPackages(destination: string): Promise<TransferPackage[]>
  async getMultiCityPackages(destination: string): Promise<MultiCityPackage[]>
  async getFixedDeparturePackages(destination: string): Promise<FixedDeparturePackage[]>
  
  // Unified package interface
  interface UnifiedPackage {
    id: string;
    type: 'ACTIVITY' | 'TRANSFER' | 'MULTI_CITY' | 'FIXED_DEPARTURE' | 'HOTEL';
    title: string;
    description: string;
    operatorId: string;
    operatorName: string;
    price: number;
    currency: string;
    destination: string;
    // ... other common fields
  }
}
```

**Implementation Strategy**:
- Query all package tables in parallel
- Normalize to unified interface
- Cache results for performance
- Support fuzzy destination matching

### 2. Itinerary Builder Service

**File**: `src/lib/services/itineraryService.ts`

```typescript
class ItineraryService {
  // Create new itinerary from lead
  async createFromLead(leadId: string, agentId: string): Promise<Itinerary>
  
  // Add package to day
  async addPackageToDay(itineraryId: string, dayNumber: number, packageData: PackageToAdd): Promise<ItineraryDayItem>
  
  // Remove package from day
  async removePackageFromDay(itemId: string): Promise<void>
  
  // Reorder items in day
  async reorderDayItems(dayId: string, itemIds: string[]): Promise<void>
  
  // Calculate total price
  async calculateTotalPrice(itineraryId: string): Promise<number>
  
  // Save itinerary
  async saveItinerary(itinerary: Itinerary): Promise<Itinerary>
  
  // Generate PDF
  async generatePDF(itineraryId: string): Promise<PDFDocument>
  
  // Send email
  async sendEmail(itineraryId: string, customerEmail: string): Promise<void>
}
```

### 3. PDF Generation

**Library**: `react-pdf` or `@react-pdf/renderer` or server-side `puppeteer`

**Template Structure**:
- Cover page with destination image
- Customer details
- Day-by-day breakdown
- Package details per day
- Total pricing breakdown
- Terms & conditions
- Contact information

**Storage**: Supabase Storage bucket `/itineraries`

### 4. Email Service

**Library**: Resend or SendGrid

**Email Template**:
- HTML email with itinerary summary
- PDF attachment
- CTA buttons (Accept, Request Changes, Contact Agent)
- Tracking pixel for opens (future)

---

## 📱 API Endpoints Needed

### Itinerary Endpoints

```
POST   /api/itineraries              - Create new itinerary from lead
GET    /api/itineraries              - List agent's itineraries
GET    /api/itineraries/:id         - Get itinerary details
PUT    /api/itineraries/:id         - Update itinerary
DELETE /api/itineraries/:id         - Delete itinerary

POST   /api/itineraries/:id/days     - Add day to itinerary
PUT    /api/itineraries/:id/days/:dayId - Update day
DELETE /api/itineraries/:id/days/:dayId - Remove day

POST   /api/itineraries/:id/days/:dayId/items - Add package to day
PUT    /api/itineraries/:id/items/:itemId - Update day item
DELETE /api/itineraries/:id/items/:itemId - Remove day item

POST   /api/itineraries/:id/generate-pdf - Generate PDF
POST   /api/itineraries/:id/send-email - Send email to customer
```

### Package Search Endpoints

```
GET    /api/packages/search?destination={dest}&type={type}&... - Search packages
GET    /api/packages/:type/:id - Get specific package details
```

---

## 🔐 Security & RLS Policies

### Leads Table RLS

```sql
-- Agents can only see their own leads
CREATE POLICY "Agents can view own leads"
  ON leads FOR SELECT
  USING (agent_id = auth.uid());

-- Agents can create leads
CREATE POLICY "Agents can create leads"
  ON leads FOR INSERT
  WITH CHECK (agent_id = auth.uid());

-- Agents can update own leads
CREATE POLICY "Agents can update own leads"
  ON leads FOR UPDATE
  USING (agent_id = auth.uid());
```

### Itineraries Table RLS

```sql
-- Agents can only see their own itineraries
CREATE POLICY "Agents can view own itineraries"
  ON itineraries FOR SELECT
  USING (agent_id = auth.uid());

-- Agents can create itineraries for their own leads
CREATE POLICY "Agents can create itineraries"
  ON itineraries FOR INSERT
  WITH CHECK (
    agent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.id = itinerary_id 
      AND leads.agent_id = auth.uid()
    )
  );
```

### Itinerary Day Items RLS

```sql
-- Agents can manage items in their own itineraries
CREATE POLICY "Agents can manage itinerary items"
  ON itinerary_day_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_day_items.itinerary_id
      AND itineraries.agent_id = auth.uid()
    )
  );
```

---

## 🚀 Implementation Phases

### Phase 1: Database Setup (Week 1)
- [ ] Create `leads` table migration
- [ ] Create `itineraries` table migration
- [ ] Create `itinerary_days` table migration
- [ ] Create `itinerary_day_items` table migration
- [ ] Create `itinerary_documents` table migration
- [ ] Set up RLS policies
- [ ] Create triggers for auto-calculations
- [ ] Test database schema

### Phase 2: Lead Purchase Integration (Week 1-2)
- [ ] Update purchase flow to create `leads` entry
- [ ] Update "My Leads" page to query `leads` table
- [ ] Add "Create Itinerary" button to lead cards
- [ ] Add lead detail view/modal
- [ ] Test lead purchase → lead creation flow

### Phase 3: Package Search (Week 2)
- [ ] Create package search service
- [ ] Create unified package interface
- [ ] Build package browser component
- [ ] Implement filtering and sorting
- [ ] Add package preview modal
- [ ] Test package search functionality

### Phase 4: Itinerary Builder UI (Week 3)
- [ ] Create itinerary builder page layout
- [ ] Build day-by-day builder component
- [ ] Implement add package to day functionality
- [ ] Add remove/reorder functionality
- [ ] Implement save draft functionality
- [ ] Add price calculation display
- [ ] Test itinerary creation flow

### Phase 5: Itinerary Management (Week 3-4)
- [ ] Create itineraries list page
- [ ] Create itinerary view/edit page
- [ ] Implement edit functionality
- [ ] Add delete functionality
- [ ] Add duplicate functionality
- [ ] Test full CRUD operations

### Phase 6: PDF Generation (Week 4)
- [ ] Design PDF template
- [ ] Implement PDF generation service
- [ ] Add PDF download functionality
- [ ] Test PDF generation with sample data

### Phase 7: Email Integration (Week 4-5)
- [ ] Set up email service (Resend/SendGrid)
- [ ] Design email template
- [ ] Implement email sending functionality
- [ ] Add email tracking (optional)
- [ ] Test email sending

### Phase 8: Polish & Testing (Week 5)
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states
- [ ] Responsive design
- [ ] Performance optimization
- [ ] End-to-end testing
- [ ] Bug fixes

---

## 🔮 Future Enhancements (Not in Scope Now)

1. **WhatsApp Integration**:
   - Send itinerary PDF via WhatsApp Business API
   - Two-way chat for customer communication
   - Automated responses

2. **Real Payment Processing**:
   - Replace dummy purchase button with Stripe/PayPal
   - Agent wallet system
   - Commission tracking

3. **Advanced Itinerary Features**:
   - Itinerary templates
   - AI suggestions for package combinations
   - Auto-optimize itinerary (time, cost, distance)
   - Collaborative editing (multiple agents)

4. **Customer Portal**:
   - Customer login to view itinerary
   - Customer can accept/reject itinerary
   - Feedback and rating system

5. **Analytics & Reporting**:
   - Lead conversion rates
   - Itinerary acceptance rates
   - Package popularity
   - Revenue tracking

---

## 📝 Notes & Considerations

### 1. Package Data Structure
- Different package types have different schemas
- Need unified interface for display and selection
- Handle cases where package is deleted/archived after itinerary creation

### 2. Pricing
- Packages may have per-person vs fixed pricing
- Need to handle currency conversion
- Seasonal pricing variations
- Group discounts

### 3. Availability
- Packages may become unavailable after itinerary creation
- Need to handle this gracefully (show warning, suggest alternatives)

### 4. Customer Privacy
- Customer details only visible after purchase
- Itinerary should not expose internal package prices (use markup)

### 5. Performance
- Package search can be slow with many packages
- Implement caching strategy
- Pagination for package results
- Lazy loading for itinerary builder

### 6. Error Handling
- What if destination doesn't match any packages?
- What if lead is deleted while creating itinerary?
- What if package is deleted after being added?

---

## ✅ Summary

This planning document covers:
- ✅ Complete database schema design
- ✅ Data flow and process flows
- ✅ UI/UX design concepts
- ✅ Technical implementation strategy
- ✅ Security considerations
- ✅ Implementation phases
- ✅ Future enhancements

**Next Steps**: Review this plan, make adjustments as needed, then start implementing Phase 1 (Database Setup).
