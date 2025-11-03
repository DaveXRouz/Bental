# Accessibility Quick Reference

## At-a-Glance Component Usage

### Replace Problematic Patterns

| ❌ Avoid | ✅ Use Instead | Why |
|---------|---------------|-----|
| Auto-play carousel | `AccessibleCarousel` with manual controls | User control, keyboard accessible |
| Infinite scroll only | `AccessibleInfiniteScroll` with pagination | Keyboard users can reach footer |
| Custom `<select>` | `AccessibleSelect` | Full keyboard & screen reader support |
| `<View onPress>` | `<TouchableOpacity>` with accessibility props | Semantic meaning, proper roles |
| Color-only indicators | Icon + text + color | Not everyone perceives color |
| Hover-only content | Always visible or tap/focus | Touch & keyboard users |

## Essential Accessibility Props

```typescript
// Button
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Descriptive label"
  accessibilityHint="What happens when pressed"
  accessibilityState={{ disabled: false }}
  onPress={handlePress}
>
  <Text>Click Me</Text>
</TouchableOpacity>

// Form Input
<TextInput
  accessible={true}
  accessibilityLabel="Email address"
  accessibilityHint="Enter your email"
  accessibilityRequired={true}
  accessibilityInvalid={!!error}
  autoComplete="email"
  keyboardType="email-address"
/>

// Heading
<Text
  accessible={true}
  accessibilityRole="header"
  accessibilityLevel={1}
>
  Page Title
</Text>

// Image
<Image
  source={image}
  accessible={true}
  accessibilityLabel="Person smiling outdoors"
  accessibilityRole="image"
/>

// Link
<TouchableOpacity
  accessible={true}
  accessibilityRole="link"
  accessibilityLabel="Learn more about accessibility"
  accessibilityHint="Opens in new screen"
>
  <Text>Learn More</Text>
</TouchableOpacity>
```

## Minimum Requirements Checklist

### Visual
- [ ] Contrast ratio ≥ 4.5:1 (AA) or 7:1 (AAA)
- [ ] Touch targets ≥ 44×44 pixels
- [ ] No content only conveyed by color
- [ ] Text scalable to 200%

### Keyboard
- [ ] All actions available via keyboard
- [ ] Visible focus indicators
- [ ] Logical tab order
- [ ] Escape closes modals

### Screen Reader
- [ ] All images have alt text
- [ ] Buttons have descriptive labels
- [ ] Forms have associated labels
- [ ] Errors are announced
- [ ] Dynamic updates use live regions

## Quick Imports

```typescript
// Accessible Components
import { AccessibleCarousel } from '@/components/accessible/AccessibleCarousel';
import { AccessibleInfiniteScroll } from '@/components/accessible/AccessibleInfiniteScroll';
import { AccessibleSelect } from '@/components/accessible/AccessibleSelect';
import { InclusiveButton } from '@/components/accessible/InclusiveButton';
import { SkipLink } from '@/components/accessible/SkipLink';
import { ResponsiveGrid } from '@/components/accessible/ResponsiveGrid';

// Live Regions
import {
  LiveRegion,
  StatusMessage,
  LoadingAnnouncer,
} from '@/components/accessible/LiveRegion';

// Utilities
import {
  useAccessibilityPreferences,
  meetsWCAGStandard,
  announceForAccessibility,
  getTouchTargetSize,
} from '@/utils/progressive-enhancement';
```

## Common Patterns

### Announcing Changes
```typescript
import { announceForAccessibility } from '@/utils/progressive-enhancement';

// Polite (non-interrupting)
announceForAccessibility('Item added to cart', 'polite');

// Assertive (interrupts)
announceForAccessibility('Error occurred', 'assertive');
```

### Respecting User Preferences
```typescript
const { reduceMotion, screenReaderEnabled, boldText } = useAccessibilityPreferences();

// Disable animations
const duration = reduceMotion ? 0 : 300;

// Enhanced content for screen readers
{screenReaderEnabled && <DetailedDescription />}

// Bolder text
<Text style={[styles.text, boldText && styles.boldText]} />
```

### Loading States
```typescript
<LoadingAnnouncer
  loading={isLoading}
  loadingMessage="Loading data"
  completedMessage="Data loaded"
/>
```

### Form Validation
```typescript
{error && (
  <Text
    style={styles.error}
    accessible={true}
    accessibilityRole="alert"
    accessibilityLiveRegion="polite"
  >
    {error}
  </Text>
)}
```

## Accessibility Roles

| Role | Use For | Example |
|------|---------|---------|
| `button` | Clickable actions | Submit, Cancel, Delete |
| `header` | Section headings | Page titles, section titles |
| `link` | Navigation | External links, navigation |
| `search` | Search inputs | Search bars |
| `alert` | Important messages | Errors, warnings |
| `text` | Static text | Paragraphs, labels |
| `image` | Images | Photos, icons |
| `imagebutton` | Clickable images | Icon buttons |
| `adjustable` | Sliders | Volume, brightness |
| `checkbox` | Toggle options | Form checkboxes |
| `radio` | Single choice | Radio button groups |
| `list` | Lists | Menus, item lists |

## Testing Commands

```bash
# Check for missing accessibility props
npx eslint --rule 'react-native-a11y/has-accessibility-props: error'

# Automated accessibility testing
npm test -- --testNamePattern="accessibility"

# Manual testing
# 1. Enable VoiceOver (iOS) / TalkBack (Android)
# 2. Test with keyboard only (Tab, Enter, Escape, Arrows)
# 3. Increase text size to 200%
# 4. Enable reduced motion
# 5. Use color blindness simulators
```

## WCAG Levels

| Level | Description | Minimum Requirements |
|-------|-------------|---------------------|
| A | Basic | Essential accessibility |
| AA | Standard | Recommended for most sites |
| AAA | Enhanced | Optimal accessibility |

**Target: WCAG 2.1 Level AA minimum**

## Common Issues & Fixes

### Issue: Unclear button purpose
```typescript
// ❌ Bad
<TouchableOpacity onPress={handleDelete}>
  <TrashIcon />
</TouchableOpacity>

// ✅ Good
<TouchableOpacity
  onPress={handleDelete}
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Delete item"
  accessibilityHint="Permanently removes this item"
>
  <TrashIcon />
  <Text style={styles.srOnly}>Delete</Text>
</TouchableOpacity>
```

### Issue: Missing form labels
```typescript
// ❌ Bad
<TextInput placeholder="Email" />

// ✅ Good
<View>
  <Text style={styles.label} nativeID="emailLabel">
    Email Address
  </Text>
  <TextInput
    accessibilityLabel="Email address"
    accessibilityLabelledBy="emailLabel"
    placeholder="you@example.com"
  />
</View>
```

### Issue: Poor contrast
```typescript
import { meetsWCAGStandard } from '@/utils/progressive-enhancement';

// Check before using
const { passes, ratio } = meetsWCAGStandard('#777', '#FFF', 'AA');
console.log(`Contrast ${ratio}:1 - ${passes ? 'PASS' : 'FAIL'}`);
```

### Issue: Small touch targets
```typescript
import { getTouchTargetSize } from '@/utils/progressive-enhancement';

const minSize = getTouchTargetSize(44);

<TouchableOpacity
  style={{
    minWidth: minSize.width,
    minHeight: minSize.height,
  }}
/>
```

## Resources

- **Full Guide**: `/docs/INCLUSIVE-DESIGN-GUIDE.md`
- **Examples**: `/docs/ACCESSIBILITY-EXAMPLES.md`
- **WCAG**: https://www.w3.org/WAI/WCAG21/quickref/
- **React Native**: https://reactnative.dev/docs/accessibility

## Support

Questions? Check the component documentation or refer to WCAG guidelines.
