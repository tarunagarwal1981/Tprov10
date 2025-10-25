# Activity Package Pricing Options - UI Preview

## 🎨 What the UI Looks Like

This document provides a visual representation of the UI components you'll see.

---

## Main Tab View

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 Tabs Navigation                                              │
├─────────────────────────────────────────────────────────────────┤
│  ℹ️ Basic Info  │  🎯 Activity  │  💰 Pricing  │  🎫 Pricing   │
│                 │     Details    │              │    Options    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pricing Options Tab Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🎫  Activity Pricing Options                                   │
│                                                                  │
│  Create multiple pricing options for your activity. You can     │
│  offer ticket-only pricing or include transfer services with    │
│  different vehicle options.                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🎫  Ticket Only Pricing                    [+ Add Ticket Option]│
│                                                                  │
│  Simple ticket pricing with adult and child rates. No transfer  │
│  included.                                                      │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  🎫 Standard Admission        ⭐ Featured    [✏️] [🗑️]    │ │
│  │  General admission to the activity                        │ │
│  │                                                           │ │
│  │  ┌─────────────┬─────────────┬─────────────┐             │ │
│  │  │ Adult       │ Child (3-12)│ Infant (0-2)│             │ │
│  │  │ $50.00      │ $25.00      │ Free        │             │ │
│  │  └─────────────┴─────────────┴─────────────┘             │ │
│  │                                                           │ │
│  │  ▼ Show Included Items (4)                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  🎫 VIP Admission                          [✏️] [🗑️]     │ │
│  │  Premium experience with additional perks                 │ │
│  │  ...                                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🚌  Ticket with Transfer Pricing       [+ Add Transfer Option] │
│                                                                  │
│  Ticket pricing that includes transfer service. Specify vehicle │
│  type, capacity, and features.                                  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  🚌 Premium with Hotel Transfer  ⭐ Featured  [✏️] [🗑️]  │ │
│  │  Activity ticket with round-trip hotel transfer           │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────┐          │ │
│  │  │ 🚗  Mercedes E-Class                        │          │ │
│  │  │     SEDAN · Max 4 passengers                │          │ │
│  │  └─────────────────────────────────────────────┘          │ │
│  │                                                           │ │
│  │  ┌─────────────┬─────────────┬─────────────┐             │ │
│  │  │ Adult       │ Child (3-12)│ Infant (0-2)│             │ │
│  │  │ $75.00      │ $40.00      │ $10.00      │             │ │
│  │  └─────────────┴─────────────┴─────────────┘             │ │
│  │                                                           │ │
│  │  ▼ Show Details                                          │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Edit Mode - Ticket Only

```
┌─────────────────────────────────────────────────────────────────┐
│  EDITING: Ticket Only Option                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option Name *                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Standard Admission                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Description                                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ General admission to the activity                          │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────┬─────────────────────────┐          │
│  │ Adult Price (USD) *     │ Child Price (USD) *     │          │
│  │ ┌─────────────────────┐ │ ┌─────────────────────┐ │          │
│  │ │ 50.00               │ │ │ 25.00               │ │          │
│  │ └─────────────────────┘ │ └─────────────────────┘ │          │
│  └─────────────────────────┴─────────────────────────┘          │
│                                                                  │
│  ┌─────────────────────────┬─────────────────────────┐          │
│  │ Child Age Range *       │ Infant Price (USD)      │          │
│  │ ┌─────┐    ┌─────┐     │ ┌─────────────────────┐ │          │
│  │ │ 3   │ to │ 12  │     │ │ 0.00                │ │          │
│  │ └─────┘    └─────┘     │ └─────────────────────┘ │          │
│  │                         │ Leave at 0 if free      │          │
│  └─────────────────────────┴─────────────────────────┘          │
│                                                                  │
│  What's Included                          [+ Add Item]          │
│  ┌────────────────────────────────────────────────────┬───┐     │
│  │ Activity entrance                                  │[X]│     │
│  ├────────────────────────────────────────────────────┼───┤     │
│  │ Safety equipment                                   │[X]│     │
│  ├────────────────────────────────────────────────────┼───┤     │
│  │ Professional guide                                 │[X]│     │
│  ├────────────────────────────────────────────────────┼───┤     │
│  │ Water bottle                                       │[X]│     │
│  └────────────────────────────────────────────────────┴───┘     │
│                                                                  │
│  ☑ Active     ☑ Featured                                        │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ ✓ Save Option    │  │ ✗ Cancel         │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Edit Mode - Ticket with Transfer

```
┌─────────────────────────────────────────────────────────────────┐
│  EDITING: Ticket with Transfer Option                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option Name *                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Premium Package with Hotel Transfer                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Description                                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Activity ticket with round-trip hotel transfer in luxury   │ │
│  │ vehicle                                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  🚌  Vehicle Information                                    ││
│  │                                                             ││
│  │  ┌──────────────┬──────────────────┬────────────────────┐  ││
│  │  │ Vehicle Type*│ Vehicle Name *   │ Max Capacity *     │  ││
│  │  │ ┌──────────┐ │ ┌──────────────┐ │ ┌────────────────┐ │  ││
│  │  │ │🚗 Sedan ▼│ │ │Mercedes E-Cls│ │ │ 4              │ │  ││
│  │  │ └──────────┘ │ └──────────────┘ │ └────────────────┘ │  ││
│  │  └──────────────┴──────────────────┴────────────────────┘  ││
│  │                                                             ││
│  │  Vehicle Features                       [+ Add Feature]    ││
│  │  ┌─────────────────────────────────────────────────┬───┐   ││
│  │  │ Air conditioning                                │[X]│   ││
│  │  ├─────────────────────────────────────────────────┼───┤   ││
│  │  │ WiFi                                            │[X]│   ││
│  │  ├─────────────────────────────────────────────────┼───┤   ││
│  │  │ Leather seats                                   │[X]│   ││
│  │  └─────────────────────────────────────────────────┴───┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────┬─────────────────────────┐          │
│  │ Adult Price (USD) *     │ Child Price (USD) *     │          │
│  │ ┌─────────────────────┐ │ ┌─────────────────────┐ │          │
│  │ │ 75.00               │ │ │ 40.00               │ │          │
│  │ └─────────────────────┘ │ └─────────────────────┘ │          │
│  │ Includes ticket+transfer│ Includes ticket+transfer│          │
│  └─────────────────────────┴─────────────────────────┘          │
│                                                                  │
│  ┌─────────────────────────┬─────────────────────────┐          │
│  │ Child Age Range *       │ Infant Price (USD)      │          │
│  │ ┌─────┐    ┌─────┐     │ ┌─────────────────────┐ │          │
│  │ │ 3   │ to │ 12  │     │ │ 10.00               │ │          │
│  │ └─────┘    └─────┘     │ └─────────────────────┘ │          │
│  └─────────────────────────┴─────────────────────────┘          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  🚗  Transfer Details (Optional)                            ││
│  │                                                             ││
│  │  ┌─────────────────────────┬─────────────────────────┐     ││
│  │  │ Pickup Location         │ Dropoff Location        │     ││
│  │  │ ┌─────────────────────┐ │ ┌─────────────────────┐ │     ││
│  │  │ │ Hotel lobby         │ │ │ Activity venue      │ │     ││
│  │  │ └─────────────────────┘ │ └─────────────────────┘ │     ││
│  │  └─────────────────────────┴─────────────────────────┘     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  What's Included                          [+ Add Item]          │
│  ┌────────────────────────────────────────────────────┬───┐     │
│  │ Activity entrance                                  │[X]│     │
│  │ Safety equipment                                   │[X]│     │
│  │ Professional guide                                 │[X]│     │
│  │ Round-trip hotel transfer                          │[X]│     │
│  │ Bottled water                                      │[X]│     │
│  │ Snacks                                            │[X]│     │
│  └────────────────────────────────────────────────────┴───┘     │
│                                                                  │
│  ☑ Active     ☑ Featured                                        │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ ✓ Save Option    │  │ ✗ Cancel         │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Expanded Details View

```
┌───────────────────────────────────────────────────────────────┐
│  🚌 Premium with Hotel Transfer  ⭐ Featured    [✏️] [🗑️]    │
│  Activity ticket with round-trip hotel transfer               │
│                                                               │
│  ┌─────────────────────────────────────────────┐              │
│  │ 🚗  Mercedes E-Class                        │              │
│  │     SEDAN · Max 4 passengers                │              │
│  └─────────────────────────────────────────────┘              │
│                                                               │
│  ┌─────────────┬─────────────┬─────────────┐                 │
│  │ Adult       │ Child (3-12)│ Infant (0-2)│                 │
│  │ $75.00      │ $40.00      │ $10.00      │                 │
│  └─────────────┴─────────────┴─────────────┘                 │
│                                                               │
│  ▲ Hide Details                                              │
│                                                               │
│  Vehicle Features:                                           │
│  [AC] [WiFi] [Leather Seats] [Bottled Water] [Phone Charger]│
│                                                               │
│  Included:                                                   │
│  ✓ Activity entrance                                         │
│  ✓ Safety equipment                                          │
│  ✓ Professional guide                                        │
│  ✓ Round-trip hotel transfer                                 │
│  ✓ Bottled water                                            │
│  ✓ Snacks                                                   │
└───────────────────────────────────────────────────────────────┘
```

---

## Empty State

```
┌─────────────────────────────────────────────────────────────────┐
│  🎫  Ticket Only Pricing                    [+ Add Ticket Option]│
│                                                                  │
│  Simple ticket pricing with adult and child rates. No transfer  │
│  included.                                                      │
│                                                                  │
│                                                                  │
│                          🎫                                      │
│                                                                  │
│     No ticket-only pricing options yet.                          │
│     Click "Add Ticket Option" to create one.                     │
│                                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Color Coding

### Status Badges
- ⭐ **Featured** - Blue/Primary color
- **Active** - Green indicator
- **Inactive** - Gray badge

### Pricing Colors
- 💚 **Adult Price** - Green
- 💙 **Child Price** - Blue  
- 💜 **Infant Price** - Purple

### Action Buttons
- ✏️ **Edit** - Blue/Default
- 🗑️ **Delete** - Red
- ✓ **Save** - Green/Primary
- ✗ **Cancel** - Gray/Secondary

---

## Responsive Behavior

### Desktop (> 768px)
```
┌──────────────────────────────────────┐
│  Option Name                         │
│  Description                         │
│  ┌─────────────┬──────────────┐      │
│  │ Adult Price │ Child Price  │      │
│  └─────────────┴──────────────┘      │
└──────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌────────────────────┐
│  Option Name       │
│  Description       │
│  ┌────────────────┐│
│  │ Adult Price    ││
│  ├────────────────┤│
│  │ Child Price    ││
│  └────────────────┘│
└────────────────────┘
```

---

## Animations

### Card Entrance
- Fade in from bottom
- Smooth slide up
- 300ms duration

### Edit Mode Toggle
- Smooth height transition
- Opacity fade
- Border color change to blue (edit) or gray (view)

### Button Hover
- Scale slightly (1.02)
- Color brightness increase
- Smooth transition

### Delete Confirmation
- Shake animation on hover over delete
- Color transition to red

---

## Dark Mode

### Light Mode Colors
- Background: White
- Text: Dark Gray
- Borders: Light Gray
- Cards: White with shadow

### Dark Mode Colors
- Background: Dark Gray
- Text: Light Gray
- Borders: Medium Gray
- Cards: Darker Gray with subtle shadow

---

## Accessibility Features

✅ **Keyboard Navigation**
- Tab through all fields
- Enter to save
- Escape to cancel

✅ **Screen Reader Support**
- Proper ARIA labels
- Descriptive button text
- Form field labels

✅ **Visual Indicators**
- Focus rings on active elements
- Error states with color + icon
- Success confirmation

✅ **Color Contrast**
- WCAG AA compliant
- Text readable in both modes
- Icons with labels

---

## Summary

This UI provides:
- ✨ **Beautiful** visual design
- 🎯 **Intuitive** user experience
- 📱 **Responsive** on all devices
- 🌙 **Dark mode** support
- ♿ **Accessible** for all users
- ⚡ **Fast** animations
- 💪 **Robust** functionality

Ready to create amazing pricing options! 🎉

