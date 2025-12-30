---
name: Comprehensive Itinerary Management and Operations System
overview: Implement a complete itinerary management system with operator details, PDF generation, payment workflow, lead communication tracking, sub-agent functionality, and additional roles (operations, sales). All features must be implemented without affecting existing functionality. UI/UX must be sleek, clean, intuitive, and aligned with the existing theme.
todos:
  - id: phase1-operator-details
    content: "Phase 1: Enhance operator details display in day-by-day itinerary (email, phone, address, website)"
    status: completed
  - id: phase2-communication-history
    content: "Phase 2: Implement lead communication history tracking (database, API, UI)"
    status: completed
  - id: phase3-sub-agents
    content: "Phase 3: Build sub-agent management system (create, assign leads, filter data)"
    status: completed
    dependencies:
      - phase2-communication-history
  - id: phase4-pdf-generation
    content: "Phase 4: Implement PDF generation for itineraries, invoices, and vouchers"
    status: completed
    dependencies:
      - phase1-operator-details
  - id: phase5-payment-workflow
    content: "Phase 5: Add payment tracking, confirmation, and itinerary locking system"
    status: completed
    dependencies:
      - phase4-pdf-generation
  - id: phase6-additional-roles
    content: "Phase 6: Add Operations and Sales roles with appropriate permissions"
    status: completed
    dependencies:
      - phase3-sub-agents
---

# Comprehensive Itinerary Management and Operations System

## Overview

This plan implements a complete workflow from itinerary creation to payment confirmation, including operator details, PDF generation, communication tracking, sub-agent management, and role-based access control. **All UI/UX must be sleek, clean, intuitive, and aligned with the existing TravelSelBuy theme.**

## Current System Analysis

### Existing Features (Preserve):

- Itinerary creation (Create/Insert flows)
- Day-by-day itinerary builder
- Operator names displayed on activities/transfers
- Itinerary status: `draft`, `completed`, `sent`, `approved`, `rejected`
- Customer ID generation for leads and itineraries
- Lead purchase and management

### Current Roles:

- `SUPER_ADMIN`, `ADMIN`, `TOUR_OPERATOR`, `TRAVEL_AGENT`, `USER`

### Current Theme & Design System:

**Color Palette:**

- Agent Theme: Primary `#004E89` (Deep Blue), Accent `#00B4D8` (Cyan)
- Gradients: `from-blue-500 to-purple-600` (Agent), `from-[#FF6B35] to-[#FF4B8C]` (Marketplace)
- Success: `#10B981` (Emerald), Warning: `#F59E0B` (Amber), Error: `#EF4444` (Rose)
- Background: `bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30`

**Design Patterns:**

- Cards: `border-gray-200 hover:shadow-xl transition-all duration-300`
- Buttons: Gradient backgrounds with hover effects, rounded corners
- Badges: Color-coded status indicators
- Animations: Framer Motion for smooth transitions
- Typography: Inter font family, clear hierarchy

## UI/UX Design Principles

### Core Principles:

1. **Sleek & Modern**: Clean lines, generous whitespace, subtle shadows
2. **Intuitive Navigation**: Clear visual hierarchy, consistent patterns
3. **Theme Alignment**: Use existing color palette and gradient patterns
4. **Responsive Design**: Mobile-first, works on all screen sizes
5. **Smooth Interactions**: Framer Motion animations, hover states, loading states
6. **Accessibility**: Proper contrast ratios, keyboard navigation, ARIA labels

### Design Standards:

- **Spacing**: Consistent padding (p-4, p-6), gap spacing (gap-2, gap-4)
- **Typography**: Font weights (font-medium, font-semibold, font-bold), sizes (text-sm, text-base, text-lg)
- **Colors**: Use theme colors from `BRAND` constants, avoid hardcoded colors
- **Shadows**: `shadow-sm`, `shadow-md`, `shadow-xl` for depth
- **Borders**: `border-gray-200`, `border-gray-300` for subtle separation
- **Transitions**: `transition-all duration-300` for smooth interactions

## Implementation Phases

### Phase 1: Operator Details Enhancement (Foundation)

**Priority: High | Dependencies: None | Risk: Low**

**Goal**: Display full operator contact details (email, phone, address, website) in the day-by-day itinerary view.

**UI/UX Requirements**:

1. **Operator Contact Cards**:

   - Design: Sleek card with gradient background (`bg-gradient-to-r from-blue-50 to-purple-50`)
   - Layout: Icon + contact info in organized rows
   - Icons: Use Feather Icons (FiMail, FiPhone, FiMapPin, FiGlobe)
   - Hover: Subtle shadow increase (`hover:shadow-md`)
   - Spacing: `p-4 rounded-lg border border-gray-200`

2. **Operator Details Modal/Expandable**:

   - Modal: Clean backdrop, centered card, smooth open/close animation
   - Expandable: Accordion-style with smooth expand/collapse
   - Content: Organized sections (Contact, Address, Website, Social)
   - Actions: Copy buttons for each contact method with toast notifications

3. **Visual Integration**:

   - Match existing operator badge styling (blue-50 background, blue-700 text)
   - Consistent with activity/transfer card design
   - Operator info appears below package title, above price

**Tasks**:

1. **Database**: Verify operator contact fields exist in `users` table (profile JSONB or separate columns)
2. **API Enhancement**: Update `/api/operators` to return full contact details (email, phone, address, website, WhatsApp)
3. **UI Enhancement**: 

   - Add operator details section in day-by-day itinerary page (`src/app/agent/leads/[leadId]/itineraries/new/page.tsx`)
   - Show operator contact card for each activity/transfer
   - Add "View Operator Details" modal/expandable section with sleek design

4. **Data Flow**: Ensure `operatorNames` state includes full contact info, not just names

**Files to Modify**:

- `src/app/api/operators/route.ts` - Return full operator details
- `src/app/agent/leads/[leadId]/itineraries/new/page.tsx` - Display operator details with sleek UI
- `src/lib/services/marketplaceService.ts` - Include operator contact in responses

---

### Phase 2: Lead Communication History Tracking

**Priority: High | Dependencies: None | Risk: Low**

**Goal**: Track all customer communications (emails, calls, app messages) with timestamps and responses.

**Database Schema**:

```sql
CREATE TABLE lead_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id), -- NULL if sub-agent
  sub_agent_id UUID REFERENCES users(id), -- NULL if main agent
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'phone_call', 'app_message', 'whatsapp', 'meeting', 'other')),
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  subject TEXT, -- For emails
  content TEXT, -- Message content or call notes
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  customer_response TEXT, -- 'positive', 'negative', 'no_response', 'pending'
  response_notes TEXT,
  attachments JSONB, -- Array of file URLs/names
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lead_communications_lead_id ON lead_communications(lead_id);
CREATE INDEX idx_lead_communications_created_at ON lead_communications(created_at DESC);
```

**UI/UX Requirements**:

1. **Communication History Panel**:

   - Design: Timeline view with vertical line connecting entries
   - Layout: Left-aligned timeline with icons, date/time, and content
   - Colors: Type-based color coding (email: blue, call: green, message: purple)
   - Icons: FiMail, FiPhone, FiMessageCircle, FiVideo for different types
   - Hover: Highlight on hover with smooth transition
   - Spacing: `space-y-4` between entries

2. **Add Communication Form**:

   - Modal: Clean, centered modal with backdrop blur
   - Form: Organized fields with labels, proper spacing
   - Type Selector: Icon-based buttons with active state
   - Date/Time Picker: Sleek date-time input component
   - Response Selector: Color-coded badges (positive: green, negative: red, pending: yellow)
   - Submit: Gradient button matching theme

3. **Timeline Design**:

   - Visual: Vertical line with dots for each entry
   - Date Grouping: Group by date with clear headers
   - Filters: Clean filter bar with chips (type, direction, date range)
   - Empty State: Friendly message with illustration

4. **Response Indicators**:

   - Badges: Color-coded (positive: emerald, negative: rose, no_response: gray, pending: amber)
   - Icons: Checkmark for positive, X for negative, clock for pending

**Tasks**:

1. **Database Migration**: Create `lead_communications` table
2. **API Routes**: 

   - `POST /api/leads/[leadId]/communications` - Create communication record
   - `GET /api/leads/[leadId]/communications` - Get communication history
   - `PATCH /api/leads/[leadId]/communications/[commId]` - Update response/notes

3. **UI Components**:

   - Communication history panel in lead detail page (timeline design)
   - Add communication form (sleek modal with organized fields)
   - Timeline view of communications (vertical timeline with icons)
   - Filter by type, direction, date range (clean filter chips)

4. **Integration Points**:

   - When PDF is sent → Auto-create communication record
   - When invoice is sent → Auto-create communication record
   - When voucher is sent → Auto-create communication record

**Files to Create**:

- `src/app/api/leads/[leadId]/communications/route.ts`
- `src/components/agent/LeadCommunicationHistory.tsx` - Timeline component with sleek design
- `src/components/agent/AddCommunicationForm.tsx` - Modal form with theme-aligned styling
- `supabase/migrations/XXX_create_lead_communications.sql`

**Files to Modify**:

- `src/app/agent/leads/[leadId]/page.tsx` - Add communication history section with timeline UI

---

### Phase 3: Sub-Agent Management System

**Priority: High | Dependencies: Phase 2 | Risk: Medium**

**Goal**: Allow agents to create sub-agents, assign leads, and manage their access.

**Database Schema**:

```sql
-- Add parent_agent_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_agent_id UUID REFERENCES users(id);
CREATE INDEX idx_users_parent_agent_id ON users(parent_agent_id);

-- Sub-agent assignments
CREATE TABLE sub_agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sub_agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  UNIQUE(lead_id, sub_agent_id)
);

CREATE INDEX idx_sub_agent_assignments_agent_id ON sub_agent_assignments(agent_id);
CREATE INDEX idx_sub_agent_assignments_sub_agent_id ON sub_agent_assignments(sub_agent_id);
CREATE INDEX idx_sub_agent_assignments_lead_id ON sub_agent_assignments(lead_id);
```

**Role Updates**:

- Add `SUB_AGENT` role to `user_role` enum
- Sub-agents inherit `TRAVEL_AGENT` permissions but with restricted scope

**UI/UX Requirements**:

1. **Sub-Agent Management Page**:

   - Layout: Clean dashboard with stats cards at top
   - Cards: Gradient stat cards showing total sub-agents, active assignments
   - Table/List: Sleek table or card grid with sub-agent info
   - Actions: Icon buttons (edit, delete, assign) with hover states
   - Empty State: Friendly illustration with "Create your first sub-agent" message

2. **Create Sub-Agent Form**:

   - Modal: Full-screen or large centered modal
   - Form Fields: Organized sections (Basic Info, Permissions, Notes)
   - Password Generator: Optional secure password generator with copy button
   - Validation: Real-time validation with clear error messages
   - Submit: Gradient button with loading state

3. **Sub-Agent Cards**:

   - Design: Card with avatar, name, email, status badge
   - Stats: Quick stats (assigned leads count, active status)
   - Actions: Dropdown menu with actions (assign lead, edit, delete)
   - Status: Color-coded badge (active: green, inactive: gray)

4. **Lead Assignment Interface**:

   - Modal: Clean modal with searchable lead list
   - Lead Cards: Compact cards showing lead details
   - Selection: Checkbox or radio selection
   - Bulk Actions: Select multiple leads for bulk assignment
   - Confirmation: Smooth confirmation dialog

**Tasks**:

1. **Database Migration**: 

   - Add `parent_agent_id` to users
   - Create `sub_agent_assignments` table
   - Add `SUB_AGENT` role

2. **Authentication**: 

   - Sub-agent login (separate credentials)
   - Scope data access to assigned leads only

3. **API Routes**:

   - `POST /api/agents/sub-agents` - Create sub-agent account
   - `GET /api/agents/sub-agents` - List sub-agents
   - `DELETE /api/agents/sub-agents/[subAgentId]` - Delete sub-agent
   - `POST /api/leads/[leadId]/assign` - Assign lead to sub-agent
   - `GET /api/agents/my-leads` - Get leads (filtered by role)

4. **UI Components**:

   - Sub-agent management page (`/agent/sub-agents`) with sleek dashboard design
   - Create sub-agent form (modal with organized sections)
   - Sub-agent list with actions (card grid or table)
   - Lead assignment interface (modal with searchable list)

5. **Data Filtering**:

   - Update lead queries to filter by `sub_agent_id` for sub-agents
   - Agent sees all leads (own + sub-agent assigned)
   - Sub-agent sees only assigned leads

**Files to Create**:

- `src/app/agent/sub-agents/page.tsx` - Sleek dashboard with theme-aligned design
- `src/app/api/agents/sub-agents/route.ts`
- `src/app/api/leads/[leadId]/assign/route.ts`
- `supabase/migrations/XXX_add_sub_agent_system.sql`

**Files to Modify**:

- `src/lib/types.ts` - Add `SUB_AGENT` to `UserRole`
- `src/app/api/leads/leads/route.ts` - Filter by sub-agent assignment
- `src/app/api/marketplace/purchased/route.ts` - Filter by sub-agent assignment
- `src/context/CognitoAuthContext.tsx` - Handle sub-agent permissions

---

### Phase 4: PDF Generation System

**Priority: High | Dependencies: Phase 1 | Risk: Medium**

**Goal**: Generate PDFs for itineraries, invoices, and vouchers with professional formatting.

**Technology Choice**: Use `@react-pdf/renderer` or `puppeteer` for PDF generation.

**UI/UX Requirements**:

1. **PDF Action Buttons**:

   - Design: Icon buttons with labels, gradient backgrounds
   - Placement: Header section of itinerary page, action bar
   - Icons: FiDownload, FiMail, FiFileText
   - States: Loading spinner during generation, success toast
   - Grouping: Button group with consistent spacing

2. **PDF Preview Modal** (Optional):

   - Design: Full-screen or large modal with PDF viewer
   - Controls: Zoom, download, print, close
   - Loading: Skeleton loader while generating
   - Error: Friendly error message with retry button

3. **Send to Customer Flow**:

   - Modal: Clean modal with email form
   - Fields: To (pre-filled), Subject, Message (with template)
   - Preview: PDF preview thumbnail
   - Actions: Send, Cancel, Preview PDF
   - Success: Toast notification + auto-create communication record

4. **PDF Templates Design**:

   - Itinerary PDF: Professional layout with brand colors, clear sections
   - Invoice PDF: Clean table layout, payment terms, branding
   - Voucher PDF: Booking confirmation style, operator details, QR codes (future)

**Tasks**:

1. **Install Dependencies**: 

   - `@react-pdf/renderer` (React-based) OR
   - `puppeteer` (HTML-to-PDF) OR
   - `pdfkit` (Node.js native)

2. **PDF Templates**:

   - Itinerary PDF template (day-by-day breakdown, operator details, pricing)
   - Invoice PDF template (itemized billing, payment terms)
   - Voucher PDF template (booking confirmations, operator vouchers)

3. **API Routes**:

   - `GET /api/itineraries/[itineraryId]/pdf` - Generate itinerary PDF
   - `GET /api/itineraries/[itineraryId]/invoice/pdf` - Generate invoice PDF
   - `GET /api/itineraries/[itineraryId]/vouchers/pdf` - Generate voucher PDF

4. **UI Integration**:

   - "Download PDF" buttons in itinerary view (sleek icon buttons)
   - "Send to Customer" button (modal with email form)
   - PDF preview modal (optional, with viewer)

5. **Email Integration**:

   - Send PDF as email attachment
   - Track email delivery status
   - Auto-create communication record

**Files to Create**:

- `src/lib/pdf/templates/ItineraryPDF.tsx` - Professional template with brand colors
- `src/lib/pdf/templates/InvoicePDF.tsx` - Clean invoice layout
- `src/lib/pdf/templates/VoucherPDF.tsx` - Booking confirmation style
- `src/app/api/itineraries/[itineraryId]/pdf/route.ts`
- `src/app/api/itineraries/[itineraryId]/invoice/pdf/route.ts`
- `src/app/api/itineraries/[itineraryId]/vouchers/pdf/route.ts`

**Files to Modify**:

- `src/app/agent/leads/[leadId]/itineraries/new/page.tsx` - Add PDF download buttons with sleek design
- `src/app/agent/leads/[leadId]/page.tsx` - Add PDF actions to itinerary cards

---

### Phase 5: Payment Workflow and Itinerary Confirmation

**Priority: High | Dependencies: Phase 4 | Risk: Medium**

**Goal**: Implement payment tracking, itinerary confirmation, and locking mechanism.

**Database Schema Updates**:

```sql
-- Add payment and confirmation fields to itineraries
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES users(id);
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES users(id);

-- Payment tracking
CREATE TABLE itinerary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit', 'partial', 'full', 'refund')),
  payment_method TEXT, -- 'bank_transfer', 'credit_card', 'cash', etc.
  payment_reference TEXT, -- Transaction ID, check number, etc.
  received_at TIMESTAMP WITH TIME ZONE,
  received_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_itinerary_payments_itinerary_id ON itinerary_payments(itinerary_id);

-- Invoice tracking
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL, -- Format: INV-YYYY-NNNNNN
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  due_date DATE,
  pdf_url TEXT, -- S3 or storage URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoices_itinerary_id ON invoices(itinerary_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
```

**Status Flow**:

```
draft → sent (PDF sent) → invoice_sent → payment_received → confirmed → locked
```

**UI/UX Requirements**:

1. **Payment Tracking Panel**:

   - Design: Clean card with payment history table
   - Layout: Organized rows with date, amount, type, method, status
   - Colors: Status-based (paid: green, pending: yellow, overdue: red)
   - Actions: Add payment button with gradient, edit/delete for entries
   - Summary: Total paid, remaining balance, progress bar

2. **Invoice List & Details**:

   - Design: Card grid or table with invoice cards
   - Cards: Invoice number, amount, status badge, due date
   - Actions: View, download PDF, send, mark as paid
   - Status: Color-coded badges (draft: gray, sent: blue, paid: green, overdue: red)
   - Empty State: Friendly message when no invoices

3. **Confirmation Workflow UI**:

   - Design: Step-by-step wizard or modal flow
   - Steps: Review → Confirm → Lock (with clear progress indicator)
   - Confirmation: Checkbox confirmation, customer details linking
   - Lock Indicator: Visual lock icon/badge when locked
   - Warning: Clear message when trying to edit locked itinerary

4. **Lock Status Indicator**:

   - Design: Badge or icon in itinerary header
   - Visual: Lock icon with "Locked" text, gray/blue color
   - Tooltip: Shows who locked and when
   - Disabled State: Gray out edit buttons, show tooltip on hover

5. **Payment Form**:

   - Modal: Clean modal with organized form fields
   - Fields: Amount, type, method, reference, date, notes
   - Validation: Real-time validation, clear error messages
   - Submit: Gradient button with loading state

**Tasks**:

1. **Database Migration**: Add confirmation and payment tables
2. **Status Management**:

   - Update `Itinerary` interface with new statuses
   - Add `confirmed`, `invoice_sent`, `payment_received`, `locked` statuses
   - Implement locking logic (prevent edits when locked)

3. **API Routes**:

   - `POST /api/itineraries/[itineraryId]/confirm` - Confirm itinerary
   - `POST /api/itineraries/[itineraryId]/lock` - Lock itinerary
   - `POST /api/itineraries/[itineraryId]/unlock` - Unlock (admin only)
   - `POST /api/itineraries/[itineraryId]/payments` - Record payment
   - `GET /api/itineraries/[itineraryId]/payments` - Get payment history
   - `POST /api/invoices` - Create invoice
   - `GET /api/invoices/[invoiceId]` - Get invoice

4. **UI Components**:

   - Payment tracking panel (sleek card with table)
   - Invoice list and details (card grid with status badges)
   - Confirmation workflow UI (step-by-step modal)
   - Lock status indicator (badge with tooltip)
   - Prevent edits when locked (disabled buttons, clear messaging)

5. **Business Logic**:

   - Auto-lock when confirmed
   - Prevent status changes when locked
   - Link customer details on confirmation

**Files to Create**:

- `src/app/api/itineraries/[itineraryId]/confirm/route.ts`
- `src/app/api/itineraries/[itineraryId]/lock/route.ts`
- `src/app/api/itineraries/[itineraryId]/payments/route.ts`
- `src/app/api/invoices/route.ts`
- `src/components/agent/PaymentTrackingPanel.tsx` - Sleek payment history component
- `src/components/agent/InvoiceList.tsx` - Card grid with status indicators
- `supabase/migrations/XXX_add_payment_workflow.sql`

**Files to Modify**:

- `src/lib/services/itineraryService.ts` - Add confirmation/locking methods
- `src/app/agent/leads/[leadId]/itineraries/new/page.tsx` - Add lock checks and status indicators
- `src/app/agent/leads/[leadId]/page.tsx` - Show confirmation status with sleek badges

---

### Phase 6: Additional Roles (Operations, Sales)

**Priority: Medium | Dependencies: Phase 3 | Risk: Low**

**Goal**: Add Operations and Sales roles with appropriate permissions.

**Database Schema**:

```sql
-- Update user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'OPERATIONS';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SALES';
```

**Role Permissions**:

- **OPERATIONS**: 
  - View all confirmed itineraries
  - Manage vouchers
  - Track payments
  - Update communication history
  - Cannot create/edit itineraries
- **SALES**:
  - View all leads
  - Create/edit itineraries
  - Send PDFs to customers
  - Manage communication history
  - Cannot confirm/lock itineraries (agent only)

**UI/UX Requirements**:

1. **Operations Dashboard**:

   - Layout: Clean dashboard with stat cards
   - Cards: Confirmed itineraries count, pending payments, vouchers to send
   - Tables: Confirmed itineraries list, payment tracking, voucher management
   - Colors: Use theme colors, status-based color coding
   - Actions: Quick actions (generate voucher, update payment, send communication)

2. **Sales Dashboard**:

   - Layout: Similar to agent dashboard but with sales-focused metrics
   - Cards: Active leads, proposals sent, conversion rate
   - Tables: Leads list, itineraries in progress, communication history
   - Actions: Create itinerary, send proposal, track follow-ups

3. **Role-Based Navigation**:

   - Sidebar: Role-specific menu items
   - Badges: Role indicator in header/navigation
   - Redirects: Smooth redirects based on role after login

4. **Access Control UI**:

   - Disabled States: Gray out unavailable actions
   - Tooltips: Explain why action is unavailable
   - Messages: Clear messages when access is denied

**Tasks**:

1. **Database Migration**: Add new roles to enum
2. **Permission System**: Update RBAC with new role permissions
3. **UI Routing**: Add role-based redirects
4. **Dashboard Pages**:

   - `/operations/dashboard` - Confirmed itineraries, vouchers, payments (sleek dashboard design)
   - `/sales/dashboard` - Leads, itineraries, communications (theme-aligned design)

5. **Access Control**: Update all API routes to check role permissions

**Files to Create**:

- `src/app/operations/dashboard/page.tsx` - Sleek dashboard with stat cards and tables
- `src/app/sales/dashboard/page.tsx` - Sales-focused dashboard with theme alignment
- `supabase/migrations/XXX_add_operations_sales_roles.sql`

**Files to Modify**:

- `src/lib/types.ts` - Add new roles
- `src/context/CognitoAuthContext.tsx` - Add role permissions
- All API routes - Add role checks

---

## Implementation Order (Recommended)

1. **Phase 1: Operator Details** (Week 1)

   - Low risk, high value
   - Foundation for PDF generation
   - No breaking changes
   - **UI Focus**: Sleek operator contact cards, smooth modal animations

2. **Phase 2: Communication History** (Week 1-2)

   - Independent feature
   - Manual entry for now
   - Foundation for automated tracking
   - **UI Focus**: Timeline design, clean form modal, intuitive filters

3. **Phase 4: PDF Generation** (Week 2-3)

   - Depends on Phase 1 (operator details)
   - Can work independently
   - High customer value
   - **UI Focus**: Professional PDF templates, sleek action buttons, smooth send flow

4. **Phase 5: Payment Workflow** (Week 3-4)

   - Depends on Phase 4 (PDFs)
   - Critical business logic
   - Requires careful testing
   - **UI Focus**: Payment tracking panel, invoice cards, confirmation wizard, lock indicators

5. **Phase 3: Sub-Agent System** (Week 4-5)

   - Can run parallel with Phase 5
   - Requires communication history for assignment tracking
   - Medium complexity
   - **UI Focus**: Sub-agent dashboard, sleek forms, assignment interface

6. **Phase 6: Additional Roles** (Week 5-6)

   - Depends on Phase 3 (role system)
   - Lower priority
   - Can be added incrementally
   - **UI Focus**: Role-specific dashboards, theme-aligned design

## UI/UX Consistency Checklist

For every new component/page:

- [ ] Uses theme colors from `BRAND` constants or Tailwind theme variables
- [ ] Follows existing card/button/badge patterns
- [ ] Includes smooth transitions and hover states
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Proper spacing and typography hierarchy
- [ ] Loading states with spinners/skeletons
- [ ] Error states with friendly messages
- [ ] Empty states with illustrations/messages
- [ ] Consistent icon usage (Feather Icons)
- [ ] Accessibility considerations (contrast, keyboard nav)

## Risk Mitigation

### Backward Compatibility:

- All new fields are nullable or have defaults
- Existing status values remain valid
- New roles don't affect existing users
- API routes use versioning or optional parameters

### Testing Strategy:

- Unit tests for status transitions
- Integration tests for PDF generation
- E2E tests for sub-agent assignment flow
- Manual testing for communication history
- **UI Testing**: Visual regression tests, responsive design checks

### Rollback Plan:

- Database migrations are reversible
- Feature flags for new functionality
- Gradual rollout per phase

## Success Criteria

- [ ] Operator details visible in itinerary view with sleek design
- [ ] PDFs generate correctly with professional formatting
- [ ] Communication history tracks all interactions with intuitive timeline UI
- [ ] Sub-agents can be created and assigned leads with sleek management interface
- [ ] Itineraries can be confirmed and locked with clear visual indicators
- [ ] Payments are tracked accurately with organized payment panel
- [ ] Operations and Sales roles have appropriate access with theme-aligned dashboards
- [ ] No existing functionality broken
- [ ] All features work in production environment
- [ ] **UI/UX is sleek, clean, intuitive, and aligned with existing theme**