# 🎨 Micro-Interactions Guide

This guide explains how to use the enhanced interactive components throughout the TravelSelbuy marketing site.

---

## 📦 Available Components

### 1. **InteractiveButton**

Enhanced button with ripple effect, loading state, and success animation.

```tsx
import InteractiveButton from '@/components/shared/InteractiveButton';

// Basic usage
<InteractiveButton onClick={() => console.log('Clicked!')}>
  Click Me
</InteractiveButton>

// With loading state (async action)
<InteractiveButton 
  onClick={async () => {
    await someAsyncAction();
  }}
  showSuccessState={true}
>
  Submit Form
</InteractiveButton>

// Variants
<InteractiveButton variant="primary">Primary</InteractiveButton>
<InteractiveButton variant="secondary">Secondary</InteractiveButton>
<InteractiveButton variant="outline">Outline</InteractiveButton>

// Sizes
<InteractiveButton size="sm">Small</InteractiveButton>
<InteractiveButton size="md">Medium</InteractiveButton>
<InteractiveButton size="lg">Large</InteractiveButton>
```

**Features:**
- ✅ Ripple effect on click
- ✅ Automatic loading spinner for async actions
- ✅ Success checkmark animation
- ✅ Hover and active states
- ✅ Disabled state support

---

### 2. **Toast Notifications**

Slide-in notifications with auto-dismiss and progress bar.

```tsx
import { ToastContainer } from '@/components/shared/Toast';
import { useToast } from '@/hooks/useToast';

function MyComponent() {
  const { toasts, removeToast, success, error, warning, info } = useToast();

  const handleAction = () => {
    success('Action completed successfully!');
    error('Something went wrong!');
    warning('Please review your input');
    info('Here is some information');
  };

  return (
    <>
      <button onClick={handleAction}>Show Toast</button>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
```

**Features:**
- ✅ Slide-in animation from top-right
- ✅ Auto-dismiss with customizable duration
- ✅ Progress bar showing time remaining
- ✅ 4 types: success, error, warning, info
- ✅ Close button with animation
- ✅ Responsive (full-width on mobile)

---

### 3. **InteractiveCard**

Card component with hover lift effect and optional glow border.

```tsx
import InteractiveCard from '@/components/shared/InteractiveCard';

// Basic card
<InteractiveCard>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</InteractiveCard>

// With glow effect
<InteractiveCard variant="glow">
  <h3>Premium Feature</h3>
  <p>This card has a rotating gradient border</p>
</InteractiveCard>

// Clickable card
<InteractiveCard 
  onClick={() => console.log('Card clicked')}
  variant="lift"
>
  <h3>Click Me</h3>
</InteractiveCard>

// With link
<InteractiveCard href="/destination">
  <h3>Navigate to page</h3>
</InteractiveCard>
```

**Variants:**
- `default` - Standard card with subtle shadow
- `lift` - Enhanced lift on hover
- `glow` - Rotating gradient border on hover

**Features:**
- ✅ Hover lift effect (translateY: -4px)
- ✅ Shadow increases on hover
- ✅ Click feedback animation
- ✅ Optional rotating gradient border
- ✅ Can be clickable or a link

---

### 4. **AnimatedLink**

Link component with animated underline and smooth transitions.

```tsx
import AnimatedLink from '@/components/shared/AnimatedLink';

// Underline animation
<AnimatedLink href="/about" variant="underline">
  About Us
</AnimatedLink>

// Arrow animation
<AnimatedLink href="/contact" variant="arrow">
  Get in Touch
</AnimatedLink>

// External link
<AnimatedLink href="https://example.com" external>
  Visit Website
</AnimatedLink>
```

**Variants:**
- `underline` - Underline animates from left to right
- `simple` - Color transition only
- `arrow` - Arrow slides right on hover

**Features:**
- ✅ Smooth color transitions (0.2s)
- ✅ Animated underline on hover
- ✅ Different styles for visited links
- ✅ External link support with proper rel attributes

---

### 5. **AnimatedInput**

Form input with floating label and validation states.

```tsx
import AnimatedInput from '@/components/shared/AnimatedInput';
import { FiMail } from 'react-icons/fi';

function MyForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  return (
    <AnimatedInput
      label="Email Address"
      type="email"
      value={email}
      onChange={setEmail}
      placeholder="you@example.com"
      icon={<FiMail />}
      error={error}
      success={!error && email.length > 0}
      required
    />
  );
}
```

**Features:**
- ✅ Floating label animation on focus
- ✅ Smooth border color transitions
- ✅ Icon color matches input state
- ✅ Shake animation on error
- ✅ Success checkmark when valid
- ✅ Error message with slide animation
- ✅ Required field indicator

---

### 6. **SkeletonLoader**

Animated placeholder for loading states with shimmer effect.

```tsx
import SkeletonLoader, { SkeletonCard, SkeletonList } from '@/components/shared/SkeletonLoader';

// Basic usage
<SkeletonLoader variant="text" />
<SkeletonLoader variant="title" />
<SkeletonLoader variant="circular" />
<SkeletonLoader variant="rectangular" height={200} />

// Multiple skeletons
<SkeletonLoader variant="text" count={3} />

// Preset components
<SkeletonCard />
<SkeletonList items={5} />

// Custom dimensions
<SkeletonLoader width="75%" height={100} />
```

**Variants:**
- `text` - Single line of text
- `title` - Larger, bold text
- `circular` - Circle (for avatars)
- `rectangular` - Rectangle (for images)
- `card` - Full card layout

**Features:**
- ✅ Shimmer animation
- ✅ Customizable width and height
- ✅ Multiple skeletons with count prop
- ✅ Preset layouts (card, list)
- ✅ Respects reduced motion preferences

---

## 🎭 Animation Utilities

### Framer Motion Presets

```tsx
import { 
  fadeIn, 
  fadeInUp, 
  scaleIn, 
  hoverLift, 
  cardHover,
  iconRotate,
  pageTransition 
} from '@/lib/animations';

// Use in motion components
<motion.div {...fadeInUp}>
  Content fades in from bottom
</motion.div>

<motion.div {...cardHover}>
  Card lifts on hover
</motion.div>

<motion.div {...iconRotate}>
  Icon rotates on hover
</motion.div>
```

### CSS Animation Classes

```tsx
// Add to className
<div className="shimmer">Loading...</div>
<div className="pulse">Pulsing element</div>
<div className="bounce">Bouncing element</div>
<div className="shake">Shaking on error</div>
<div className="fade-in">Fading in</div>
<div className="interactive-button">Button with micro-interactions</div>
<div className="animated-link">Link with underline</div>
<div className="interactive-card">Card with hover</div>
```

---

## 🎯 Best Practices

### 1. **Performance**
- Use CSS animations for simple transitions
- Reserve Framer Motion for complex animations
- Enable hardware acceleration for transforms
- Respect `prefers-reduced-motion`

### 2. **Consistency**
- Use the same animation duration across similar elements
- Maintain consistent easing functions
- Keep hover states uniform across components

### 3. **Accessibility**
- All components respect `prefers-reduced-motion`
- Proper focus states on all interactive elements
- ARIA labels where appropriate
- Keyboard navigation support

### 4. **Loading States**
- Always show loading feedback for async actions
- Use skeleton loaders for content loading
- Provide visual feedback for all user actions

### 5. **Error Handling**
- Shake animation for form errors
- Clear error messages with icons
- Success states to confirm actions
- Toast notifications for system messages

---

## 📝 Migration Guide

### Updating Existing Buttons

**Before:**
```tsx
<button onClick={handleClick}>Submit</button>
```

**After:**
```tsx
<InteractiveButton onClick={handleClick} showSuccessState>
  Submit
</InteractiveButton>
```

### Updating Existing Links

**Before:**
```tsx
<Link href="/about">About Us</Link>
```

**After:**
```tsx
<AnimatedLink href="/about" variant="underline">
  About Us
</AnimatedLink>
```

### Updating Existing Cards

**Before:**
```tsx
<div className="card">Content</div>
```

**After:**
```tsx
<InteractiveCard variant="lift">
  Content
</InteractiveCard>
```

### Updating Form Inputs

**Before:**
```tsx
<input 
  type="email" 
  value={email} 
  onChange={(e) => setEmail(e.target.value)} 
/>
```

**After:**
```tsx
<AnimatedInput
  label="Email"
  type="email"
  value={email}
  onChange={setEmail}
  icon={<FiMail />}
/>
```

---

## 🚀 Quick Start

1. Import the component you need
2. Add it to your JSX
3. Customize with props
4. Test across different states (hover, focus, error, success)
5. Verify accessibility (keyboard navigation, reduced motion)

---

## 📚 Resources

- **Framer Motion Docs**: https://www.framer.com/motion/
- **Accessibility**: https://www.w3.org/WAI/WCAG21/quickref/
- **Animation Best Practices**: https://web.dev/animations/

---

## 💡 Tips

- Start with simple animations and add complexity as needed
- Test on multiple devices and browsers
- Use browser DevTools to inspect performance
- Consider network conditions for loading states
- Always provide fallbacks for failed states

---

**Happy Animating! 🎉**

