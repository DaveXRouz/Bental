# Design System Documentation

## Overview

This document describes the unified design system implemented across the application to ensure visual consistency and product-grade quality.

## Design Tokens

### Colors

**Brand Colors:**
- Primary: `#00F5D4` (Cyan)
- Secondary: `#00D1FF` (Blue)
- Tertiary: `#60FFDA` (Light Cyan)

**Neutral Scale:**
- 950: `#0A0A0A` (Darkest)
- 900: `#171717`
- 800: `#262626`
- 700: `#404040`
- 600: `#525252`
- 500: `#737373`
- 400: `#A3A3A3`
- 300: `#D4D4D4`
- 200: `#E5E5E5`
- 100: `#F5F5F5`
- 50: `#FAFAFA` (Lightest)

**Semantic Colors:**
- Success: `#19C37D`
- Warning: `#FFB020`
- Error: `#FF4D4D`
- Info: `#00D1FF`

**Surface Colors:**
- Background: `#0B0F14`
- Card: `rgba(255, 255, 255, 0.06)`
- Card Elevated: `rgba(255, 255, 255, 0.08)`
- Overlay: `rgba(0, 0, 0, 0.85)`

**Text Colors:**
- Primary: `rgba(255, 255, 255, 0.95)`
- Secondary: `rgba(255, 255, 255, 0.64)`
- Tertiary: `rgba(255, 255, 255, 0.44)`
- Disabled: `rgba(255, 255, 255, 0.32)`
- Inverse: `#0B1621`

**Border Colors:**
- Default: `rgba(255, 255, 255, 0.12)`
- Subtle: `rgba(255, 255, 255, 0.08)`
- Focus: `rgba(0, 245, 212, 0.4)`

### Spacing Scale (8px base)

```typescript
0: 0px
1: 4px
2: 8px
3: 12px
4: 16px
5: 20px
6: 24px
7: 28px
8: 32px
10: 40px
12: 48px
14: 56px
16: 64px
20: 80px
```

### Typography

**Font Families:**
- Regular: `Inter-Regular`
- Medium: `Inter-Medium`
- Semibold: `Inter-SemiBold`
- Bold: `Inter-Bold`
- Display: `Playfair-Display`

**Font Sizes:**
- xs: 11px
- sm: 13px
- base: 15px
- md: 16px
- lg: 18px
- xl: 20px
- 2xl: 24px
- 3xl: 28px
- 4xl: 32px
- 5xl: 40px

**Line Heights:**
- Tight: 1.2
- Normal: 1.5
- Relaxed: 1.75

**Letter Spacing:**
- Tight: -0.5px
- Normal: 0px
- Wide: 0.5px
- Wider: 1.2px

### Border Radius

```typescript
none: 0px
sm: 8px
md: 12px
lg: 16px
xl: 20px
2xl: 24px
full: 9999px
```

### Shadows

**Small:**
- Offset: { width: 0, height: 2 }
- Opacity: 0.15
- Radius: 4px
- Elevation: 2

**Medium:**
- Offset: { width: 0, height: 4 }
- Opacity: 0.2
- Radius: 8px
- Elevation: 4

**Large:**
- Offset: { width: 0, height: 8 }
- Opacity: 0.25
- Radius: 16px
- Elevation: 8

**Extra Large:**
- Offset: { width: 0, height: 12 }
- Opacity: 0.3
- Radius: 24px
- Elevation: 12

**Glow:**
- Color: `rgba(0, 245, 212, 0.5)`
- Offset: { width: 0, height: 0 }
- Radius: 12px

### Animation

**Duration:**
- Instant: 100ms
- Fast: 150ms
- Normal: 200ms
- Slow: 300ms
- Slower: 400ms

**Easing:**
- Linear: [0.0, 0.0, 1.0, 1.0]
- Ease In: [0.42, 0.0, 1.0, 1.0]
- Ease Out: [0.0, 0.0, 0.58, 1.0]
- Ease In Out: [0.42, 0.0, 0.58, 1.0]
- Spring: [0.2, 0.8, 0.2, 1]

## Components

### UnifiedButton

**Variants:**
- `primary`: Gradient button with brand colors
- `secondary`: Glass morphism button
- `ghost`: Transparent with border
- `destructive`: Error color button

**Sizes:**
- `sm`: 40px height
- `md`: 48px height (default)
- `lg`: 56px height

**Usage:**
```typescript
import { UnifiedButton } from '@/components/ui';

<UnifiedButton
  title="Click Me"
  onPress={() => {}}
  variant="primary"
  size="md"
  fullWidth
/>
```

### UnifiedInput

**Features:**
- Auto-focus animations
- Error/success states
- Icon support (left/right)
- Label and helper text
- Accessible

**Usage:**
```typescript
import { UnifiedInput } from '@/components/ui';

<UnifiedInput
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
  icon={<Mail size={20} />}
  error={errorMessage}
  required
/>
```

### UnifiedCard

**Variants:**
- `default`: Basic glass card
- `elevated`: Elevated with stronger shadow
- `outlined`: Border only
- `filled`: Solid background

**Usage:**
```typescript
import { UnifiedCard } from '@/components/ui';

<UnifiedCard variant="elevated" padding={4} onPress={() => {}}>
  <Text>Card Content</Text>
</UnifiedCard>
```

### Responsive Layout Components

**ResponsiveLayout:**
```typescript
<ResponsiveLayout maxWidth="lg" padding={4}>
  <Text>Centered content with max width</Text>
</ResponsiveLayout>
```

**ResponsiveGrid:**
```typescript
<ResponsiveGrid
  columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
  gap={4}
>
  {items.map(item => <Card key={item.id} />)}
</ResponsiveGrid>
```

**ResponsiveStack:**
```typescript
<ResponsiveStack direction="vertical" gap={4} align="stretch">
  <Button />
  <Button />
</ResponsiveStack>
```

## Breakpoints

```typescript
xs: 0px      // Mobile (360px+)
sm: 360px    // Small mobile
md: 768px    // Tablet
lg: 1024px   // Desktop
xl: 1440px   // Large desktop
```

## Best Practices

### Spacing

- Use the spacing scale consistently (multiples of 4px/8px)
- Maintain consistent padding within similar components
- Use responsive spacing for different breakpoints

### Typography

- Establish clear hierarchy with font sizes
- Use font weights purposefully
- Maintain readable line heights (1.5 for body text)
- Apply letter spacing for uppercase text

### Colors

- Use semantic colors for status indicators
- Maintain WCAG AAA contrast ratios (7:1 minimum)
- Use neutral colors for text hierarchy
- Apply brand colors sparingly for emphasis

### Shadows

- Use shadows to establish elevation hierarchy
- Apply stronger shadows for interactive elements
- Use glow effects for focus states
- Keep shadows consistent across similar components

### Accessibility

- Minimum touch target: 44x44px
- Provide accessible labels for all interactive elements
- Support keyboard navigation
- Use semantic HTML roles
- Test with screen readers

## Visual Checklist

✅ **Spacing:** All components use 4px/8px base grid
✅ **Typography:** Consistent font sizes and weights
✅ **Colors:** Unified color palette across all screens
✅ **Shadows:** Elevation hierarchy established
✅ **Border Radius:** Consistent corner rounding (12-16px)
✅ **Buttons:** Normalized sizes and styles
✅ **Inputs:** Unified input field design
✅ **Cards:** Consistent card layouts
✅ **Responsive:** Works from 360px to 1440px
✅ **Accessibility:** WCAG AAA compliant
✅ **Animations:** Smooth transitions (150-300ms)

## Migration Guide

### From Old Components to New

**Buttons:**
```typescript
// Old
<Button title="Submit" />
<GlassButton title="Cancel" />
<EnhancedButton title="Login" />

// New
<UnifiedButton title="Submit" variant="primary" />
<UnifiedButton title="Cancel" variant="secondary" />
<UnifiedButton title="Login" variant="primary" />
```

**Inputs:**
```typescript
// Old
<QuantumInput placeholder="Email" />
<SmartInput label="Password" />

// New
<UnifiedInput label="Email" placeholder="Enter email" />
<UnifiedInput label="Password" placeholder="Enter password" secureTextEntry />
```

**Cards:**
```typescript
// Old
<GlassCard>Content</GlassCard>
<Card>Content</Card>

// New
<UnifiedCard variant="default">Content</UnifiedCard>
<UnifiedCard variant="elevated">Content</UnifiedCard>
```

## Removed Components

The following redundant components have been removed:

- `ImprovedButton.tsx`
- `InclusiveButton.tsx`
- `KeyboardButton.tsx`

Use `UnifiedButton` instead for all button needs.

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| UnifiedButton | ✅ Ready | Replace all button variants |
| UnifiedInput | ✅ Ready | Replace QuantumInput, SmartInput |
| UnifiedCard | ✅ Ready | Replace GlassCard, Card |
| ResponsiveLayout | ✅ Ready | Use for responsive containers |
| ResponsiveGrid | ✅ Ready | Use for responsive grids |
| ResponsiveStack | ✅ Ready | Use for flex layouts |

## Future Improvements

- [ ] Add UnifiedModal component
- [ ] Add UnifiedToast component
- [ ] Add UnifiedTable component
- [ ] Add UnifiedEmptyState component
- [ ] Add UnifiedSkeleton component
- [ ] Add dark/light theme variants
- [ ] Add animation presets library
- [ ] Add icon library documentation
