# Transfer Package Form - Visual Guide

## New Form Structure

### Before vs After

#### BEFORE:
```
┌─────────────────────────────────────┐
│ 📋 Package Title                     │
│ ├─ Package Title *                  │
│ └─ [Input field]                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📝 Package Description               │
│ ├─ Short Description *               │
│ └─ [Textarea field]                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🖼️  Package Images                   │
│ ├─ Featured Image                    │
│ │  └─ [Image Upload]                 │
│ └─ Image Gallery                     │
│    └─ [Multiple Image Upload]        │
└─────────────────────────────────────┘
```

#### AFTER:
```
┌─────────────────────────────────────┐
│ ℹ️  Title                            │
│ ├─ Title *                          │
│ └─ [Input field]                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📝 Description                       │
│ ├─ Description (Optional)            │
│ └─ [Textarea field]                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🚗 Vehicle Details                   │
│                                      │
│ ┌──────────────────────────────────┐│
│ │ 🚗 Vehicle 1              [🗑️]   ││
│ │                                  ││
│ │ Vehicle Name *    | Vehicle Type ││
│ │ [Input ______]    | [Dropdown ▼] ││
│ │                   |              ││
│ │ Vehicle Max Capacity *           ││
│ │ [-] [  5  ] [+]                  ││
│ │                                  ││
│ │ Vehicle Image (Optional)         ││
│ │ [📤 Upload image]                ││
│ │ Upload an image specific to this ││
│ │ vehicle                          ││
│ └──────────────────────────────────┘│
│                                      │
│ ┌──────────────────────────────────┐│
│ │      [+ Add Vehicle]             ││
│ └──────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Vehicle Details Section - Detailed View

### Single Vehicle Row (Expanded)

```
╔═══════════════════════════════════════════════════════╗
║  🚗 Vehicle 1                                [🗑️ Delete]║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  ┌─────────────────────────┬─────────────────────────┐║
║  │ Vehicle Name *          │ Vehicle Type            │║
║  │ ┌───────────────────┐   │ ┌───────────────────┐  │║
║  │ │ Mercedes S-Class  │   │ │ 🏎️ Luxury        ▼│  │║
║  │ └───────────────────┘   │ └───────────────────┘  │║
║  └─────────────────────────┴─────────────────────────┘║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ Vehicle Max Capacity *                           │ ║
║  │ ┌────┬──────────┬────┐                          │ ║
║  │ │ [-]│    5     │[+] │                          │ ║
║  │ └────┴──────────┴────┘                          │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ Vehicle Image (Optional)                         │ ║
║  │ ┌────────────────────────────────────────────┐  │ ║
║  │ │  📷                                        │  │ ║
║  │ │  Drag and drop or click to upload         │  │ ║
║  │ │  Supports: JPG, PNG, WEBP                 │  │ ║
║  │ └────────────────────────────────────────────┘  │ ║
║  │ Upload an image specific to this vehicle        │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
╚═══════════════════════════════════════════════════════╝
```

### Vehicle Type Dropdown Options

```
┌─────────────────────────────────┐
│ 🚗 Sedan                        │ ← Comfortable 4-seater car
├─────────────────────────────────┤
│ 🚙 SUV                          │ ← Spacious 6-8 seater vehicle
├─────────────────────────────────┤
│ 🚐 Van                          │ ← Large capacity vehicle
├─────────────────────────────────┤
│ 🚌 Bus                          │ ← High capacity transport
├─────────────────────────────────┤
│ 🏎️ Luxury                        │ ← Premium luxury vehicle
├─────────────────────────────────┤
│ 🚐 Minibus                      │ ← Medium capacity bus
└─────────────────────────────────┘

Dropdown Styling:
- Background: White (light mode) / Gray-800 (dark mode)
- Border: Gray-200 (light mode) / Gray-700 (dark mode)
- Hover: Gray-100 (light mode) / Gray-700 (dark mode)
- Focus: Blue-50 (light mode) / Blue-900/30 (dark mode)
```

## Multiple Vehicles Example

```
╔══════════════════════════════════════════════════════╗
║  🚗 Vehicle Details                                   ║
╠══════════════════════════════════════════════════════╣
║                                                       ║
║  ┌─────────────────────────────────────────────────┐ ║
║  │ 🚗 Vehicle 1                         [🗑️]       │ ║
║  │ Mercedes S-Class | Luxury | 4 passengers        │ ║
║  │ [📷 Vehicle image uploaded]                     │ ║
║  └─────────────────────────────────────────────────┘ ║
║                                                       ║
║  ┌─────────────────────────────────────────────────┐ ║
║  │ 🚗 Vehicle 2                         [🗑️]       │ ║
║  │ Toyota Hiace | Van | 8 passengers               │ ║
║  │ [📤 Upload vehicle image]                       │ ║
║  └─────────────────────────────────────────────────┘ ║
║                                                       ║
║  ┌─────────────────────────────────────────────────┐ ║
║  │ 🚗 Vehicle 3                         [🗑️]       │ ║
║  │ BMW 7 Series | Sedan | 4 passengers             │ ║
║  │ [📷 Vehicle image uploaded]                     │ ║
║  └─────────────────────────────────────────────────┘ ║
║                                                       ║
║  ┌─────────────────────────────────────────────────┐ ║
║  │              [➕ Add Vehicle]                    │ ║
║  └─────────────────────────────────────────────────┘ ║
║                                                       ║
╚══════════════════════════════════════════════════════╝
```

## Empty State

```
╔══════════════════════════════════════════════════════╗
║  🚗 Vehicle Details                                   ║
╠══════════════════════════════════════════════════════╣
║                                                       ║
║         ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐           ║
║                                                       ║
║         │         🚗                      │           ║
║                 (large icon)                          ║
║         │                                 │           ║
║              No vehicles added yet.                   ║
║         │   Click "Add Vehicle" to get   │           ║
║                   started.                            ║
║         │                                 │           ║
║         └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘           ║
║                                                       ║
║  ┌─────────────────────────────────────────────────┐ ║
║  │              [➕ Add Vehicle]                    │ ║
║  └─────────────────────────────────────────────────┘ ║
║                                                       ║
╚══════════════════════════════════════════════════════╝
```

## Responsive Layout

### Desktop (≥768px)
```
┌────────────────────────────────────────┐
│  Vehicle Name *   │  Vehicle Type      │
│  [Input ______]   │  [Dropdown ▼]      │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Vehicle Max Capacity *                │
│  [-] [  5  ] [+]                       │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Vehicle Image (Optional)              │
│  [Upload area - full width]            │
└────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌────────────────────┐
│  Vehicle Name *    │
│  [Input ______]    │
└────────────────────┘

┌────────────────────┐
│  Vehicle Type      │
│  [Dropdown ▼]      │
└────────────────────┘

┌────────────────────┐
│  Vehicle Max       │
│  Capacity *        │
│  [-] [ 5 ] [+]     │
└────────────────────┘

┌────────────────────┐
│  Vehicle Image     │
│  (Optional)        │
│  [Upload area]     │
└────────────────────┘
```

## Color Scheme & Styling

### Light Mode
```css
Background:       white
Card Border:      gray-200
Text Primary:     gray-900
Text Secondary:   gray-600
Accent:           blue-600
Hover:            gray-50
Delete Button:    red-600
```

### Dark Mode
```css
Background:       gray-900
Card Border:      gray-700
Text Primary:     gray-100
Text Secondary:   gray-400
Accent:           blue-500
Hover:            gray-800
Delete Button:    red-500
```

## Interactive States

### Vehicle Row States

1. **Default State**
   - White/Gray-900 background
   - Subtle border
   - All fields visible

2. **Hover State**
   - Delete button highlights in red
   - Slight elevation/shadow

3. **Focus State**
   - Input fields: Blue ring
   - Dropdown: Blue ring with proper background

4. **Error State**
   - Empty required field: Red border
   - Error message below field

## Animations

### Add Vehicle
```
Timeline:
0ms   → New row appears at opacity: 0, y: 20px
300ms → Animates to opacity: 1, y: 0px
```

### Remove Vehicle
```
Timeline:
0ms   → Row at opacity: 1, y: 0px
300ms → Animates to opacity: 0, y: -20px
300ms → Row removed from DOM
```

### Button Interactions
```
Hover:  Scale: 1.02, Duration: 200ms
Active: Scale: 0.98, Duration: 100ms
```

## Accessibility Features

✅ All inputs have proper labels
✅ Required fields marked with *
✅ Delete buttons have aria-labels
✅ Keyboard navigation support
✅ Focus indicators visible
✅ Screen reader friendly
✅ Color contrast meets WCAG AA standards
✅ Touch targets ≥44x44px on mobile

## Form Validation

### Vehicle Name
- **Required**: Yes
- **Min Length**: 1 character
- **Max Length**: 100 characters
- **Error Message**: "Vehicle name is required"

### Vehicle Type
- **Required**: No
- **Options**: Sedan, SUV, Van, Bus, Luxury, Minibus
- **Default**: None (optional field)

### Vehicle Max Capacity
- **Required**: Yes
- **Min Value**: 1
- **Max Value**: 50
- **Default**: 1
- **Error Message**: "Max capacity must be between 1 and 50"

### Vehicle Image
- **Required**: No
- **File Types**: JPG, PNG, WEBP
- **Max Size**: 5MB
- **Storage**: Supabase Storage (transfer-packages bucket)

## User Flow

```
1. Page Load
   ↓
2. Form initializes with 1 empty vehicle row
   ↓
3. User fills in vehicle details
   │
   ├─→ Vehicle Name (required)
   ├─→ Vehicle Type (optional)
   ├─→ Max Capacity (required)
   └─→ Vehicle Image (optional)
   ↓
4. User can:
   ├─→ Add more vehicles (click "Add Vehicle")
   ├─→ Remove vehicles (click trash icon)
   └─→ Modify existing vehicles
   ↓
5. Form validates on submit
   ↓
6. Data saved to database
   ↓
7. Vehicle images uploaded to storage
   ↓
8. Success!
```

---

**Implementation Complete** ✅
All UI/UX elements are consistent with the existing theme and design system.

