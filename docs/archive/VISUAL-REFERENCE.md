# Quick Visual Reference Guide

## 🎨 Design System at a Glance

### Color Palette

```
BRAND COLORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Primary     #00F5D4  █████  Cyan
Secondary   #00D1FF  █████  Blue
Tertiary    #60FFDA  █████  Light Cyan

SEMANTIC COLORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Success     #19C37D  █████  Green
Warning     #FFB020  █████  Orange
Error       #FF4D4D  █████  Red
Info        #00D1FF  █████  Blue

NEUTRAL SCALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
950  #0A0A0A  █████  Darkest
900  #171717  █████
800  #262626  █████
700  #404040  █████
600  #525252  █████
500  #737373  █████
400  #A3A3A3  █████
300  #D4D4D4  █████
200  #E5E5E5  █████
100  #F5F5F5  █████
50   #FAFAFA  █████  Lightest
```

### Spacing Scale (8px base)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0   0px   ━
1   4px   ━━━
2   8px   ━━━━━━━
3   12px  ━━━━━━━━━━━
4   16px  ━━━━━━━━━━━━━━━
5   20px  ━━━━━━━━━━━━━━━━━━━
6   24px  ━━━━━━━━━━━━━━━━━━━━━━━
8   32px  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10  40px  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12  48px  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Typography Scale

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIZE    PX    USAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5xl     40px  ████████  Hero headings
4xl     32px  ███████   Page titles
3xl     28px  ██████    Section headers
2xl     24px  █████     Large headings
xl      20px  ████      Subheadings
lg      18px  ███       Large body
md      16px  ███       Body text (default)
base    15px  ██        Standard text
sm      13px  ██        Small text
xs      11px  █         Captions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Border Radius

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
none    0px   ▢  No rounding
sm      8px   ▢  Subtle
md      12px  ▢  Standard
lg      16px  ▢  Cards/Buttons
xl      20px  ▢  Large elements
2xl     24px  ▢  Hero elements
full    ∞     ●  Pills/Avatars
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Shadow Elevation

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEVEL   OFFSET      BLUR    USAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
sm      0, 2px      4px     Subtle depth
md      0, 4px      8px     Cards
lg      0, 8px      16px    Buttons
xl      0, 12px     24px    Modals
glow    0, 0        12px    Focus states
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🔘 Button Variants

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIMARY (Gradient + Strong Shadow)
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     Submit Order  →        ┃  Gradient: Cyan → Blue
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  Text: Dark (#0B1621)
       ▼ Large shadow             Height: 48px (md)

SECONDARY (Glass Morphism)
┏┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┓
┃      Cancel               ┃  Background: Glass blur
┗┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┛  Text: White
      ▼ Subtle shadow            Border: Subtle

GHOST (Transparent)
┌────────────────────────────┐
│       Skip                 │  Background: Transparent
└────────────────────────────┘  Text: Secondary color
                                Border: Subtle

DESTRUCTIVE (Error Color)
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃      Delete Account        ┃  Background: Red (#FF4D4D)
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  Text: White
       ▼ Medium shadow

SIZES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
sm   ┃ Text ┃  40px height
md   ┃ Text ┃  48px height (default)
lg   ┃ Text ┃  56px height
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 📝 Input Fields

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEFAULT STATE
┌────────────────────────────────────┐
│ 📧  email@example.com             │  Height: 52px
└────────────────────────────────────┘  Border: Subtle
     ▲ Icon (left)

FOCUSED STATE (Cyan Glow)
╔════════════════════════════════════╗
║ 📧  |                             ║  Border: Cyan
╚════════════════════════════════════╝  Glow: 12px cyan
     ▼ Animated glow effect

ERROR STATE
┌────────────────────────────────────┐
│ 📧  invalid@                      │  Border: Red
└────────────────────────────────────┘  Text: Error message
⚠️ Invalid email format

WITH LABEL & HELPER
Email *
┌────────────────────────────────────┐
│ 📧  email@example.com             │
└────────────────────────────────────┘
We'll never share your email
```

## 🃏 Card Variants

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEFAULT (Glass Blur)
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                           ┃  Background: Glass
┃   Card Content            ┃  Border: Subtle
┃                           ┃  Shadow: Small
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

ELEVATED (Stronger Shadow)
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                           ┃  Background: Elevated glass
┃   Important Card          ┃  Border: Default
┃                           ┃  Shadow: Medium
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
       ▼▼ Stronger shadow

OUTLINED (Border Only)
┌───────────────────────────┐
│                           │  Background: Transparent
│   Subtle Grouping         │  Border: Default
│                           │  Shadow: None
└───────────────────────────┘

FILLED (Solid Background)
███████████████████████████
█                         █  Background: Solid
█   High Contrast         █  Border: None
█                         █  Shadow: Small
███████████████████████████
```

## 📱 Responsive Breakpoints

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

XS (0-359px)
│  Mobile Portrait
│  Single Column
│  Touch-optimized
│
├─ SM (360-767px)
│  │  Standard Mobile
│  │  1-2 columns
│  │  Stack vertically
│  │
│  ├─ MD (768-1023px)
│  │  │  Tablet
│  │  │  2-3 columns
│  │  │  Grid layouts
│  │  │
│  │  ├─ LG (1024-1439px)
│  │  │  │  Desktop
│  │  │  │  3-4 columns
│  │  │  │  Sidebar layouts
│  │  │  │
│  │  │  ├─ XL (1440px+)
│  │  │  │  │  Large Desktop
│  │  │  │  │  4+ columns
│  │  │  │  │  Max width: 1440px
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🎬 Animation Timings

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DURATION    MS      USAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
instant     100ms   ▌ Icon changes
fast        150ms   ▌▌ Button press
normal      200ms   ▌▌▌ Standard transitions
slow        300ms   ▌▌▌▌ Modal open/close
slower      400ms   ▌▌▌▌▌ Complex animations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EASING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Linear      ─────────────  Constant speed
Ease In     ╱────────────  Slow start
Ease Out    ────────────╲  Slow end
Ease In Out ╱──────────╲  Slow both ends
Spring      ╱─╲──────────  Bounce effect
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## ♿ Accessibility Standards

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOUCH TARGETS
┌────────────────┐
│                │  Minimum: 44x44px
│   ┏━━━━━━━┓   │  Recommended: 48x48px
│   ┃ Button┃   │  Large: 56x56px
│   ┗━━━━━━━┛   │
└────────────────┘

CONTRAST RATIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Level AA     4.5:1   ████  Normal text
Level AAA    7:1     ████  All text (our target)
Large Text   3:1     ████  18px+ or 14px bold
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FOCUS INDICATORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Default   ┏━━━━━━━┓  2px solid border
Keyboard  ┏━━━━━━━┓  + 12px glow
          ┃ Focus ┃  Cyan color
          ┗━━━━━━━┛  High contrast
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 📦 Component Usage

```typescript
// ✅ CORRECT USAGE

import { UnifiedButton, UnifiedInput, UnifiedCard } from '@/components/ui';
import { ResponsiveLayout, ResponsiveGrid } from '@/components/layout';
import { DesignSystem } from '@/constants/design-system';

// Button
<UnifiedButton
  title="Submit"
  variant="primary"
  size="md"
  onPress={handleSubmit}
  loading={isLoading}
  fullWidth
/>

// Input
<UnifiedInput
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
  icon={<Mail size={20} />}
  error={errors.email}
  required
/>

// Card
<UnifiedCard variant="elevated" padding={4} onPress={handlePress}>
  <Text>Card content</Text>
</UnifiedCard>

// Responsive Layout
<ResponsiveLayout maxWidth="lg" padding={4}>
  <ResponsiveGrid columns={{ xs: 1, md: 2, lg: 3 }} gap={4}>
    <Card />
    <Card />
    <Card />
  </ResponsiveGrid>
</ResponsiveLayout>

// Using Design Tokens
<View style={{
  padding: DesignSystem.spacing[4],
  borderRadius: DesignSystem.borderRadius.lg,
  backgroundColor: DesignSystem.colors.surface.card,
  ...DesignSystem.shadows.md,
}}>
  <Text style={{
    fontSize: DesignSystem.typography.fontSize.lg,
    fontFamily: DesignSystem.typography.fontFamily.semibold,
    color: DesignSystem.colors.text.primary,
  }}>
    Heading
  </Text>
</View>
```

## 🎯 Quick Checklist

```
BEFORE SHIPPING A COMPONENT:

Visual Consistency
□ Uses design system spacing (4px/8px grid)
□ Uses design system colors
□ Uses design system typography
□ Uses design system shadows
□ Uses design system border radius

Responsive Design
□ Works on 360px mobile
□ Works on 768px tablet
□ Works on 1440px desktop
□ Touch targets are 44px minimum
□ Text is readable at all sizes

Accessibility
□ Has accessible labels
□ Supports keyboard navigation
□ Has visible focus indicators
□ Meets WCAG AAA contrast (7:1)
□ Tested with screen reader

Performance
□ Smooth animations (150-300ms)
□ No layout shifts
□ Optimized re-renders
□ Proper memo/callback usage

Code Quality
□ Uses unified components
□ Imports from design system
□ No hardcoded values
□ TypeScript types defined
□ Component documented
```

---

**For complete documentation, see:**
- `DESIGN-SYSTEM.md` - Full design system reference
- `DESIGN-IMPROVEMENTS-SUMMARY.md` - Implementation details
- `constants/design-system.ts` - Design tokens source
