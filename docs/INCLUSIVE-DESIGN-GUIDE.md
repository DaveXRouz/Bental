# Inclusive Design Guide

## Overview

This guide provides patterns and best practices for creating accessible, inclusive user experiences that work well across diverse users with varying abilities, preferences, and devices.

## Core Principles

### 1. Progressive Enhancement

Build experiences that work for everyone, then enhance for those with modern capabilities:

```typescript
import { useAccessibilityPreferences } from '@/utils/progressive-enhancement';

function AnimatedComponent() {
  const { reduceMotion } = useAccessibilityPreferences();

  return (
    <Animated.View
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 300 }}
    />
  );
}
```

### 2. Touch Target Sizes

Minimum touch target size: **44x44 pixels** (WCAG 2.1 AA)
Comfortable touch target size: **48x48 pixels**

```typescript
import { getTouchTargetSize } from '@/utils/progressive-enhancement';

const minSize = getTouchTargetSize(44); // { width: 44, height: 44 }
```

### 3. Color Contrast

- **WCAG AA**: Minimum 4.5:1 for normal text, 3:1 for large text
- **WCAG AAA**: Minimum 7:1 for normal text, 4.5:1 for large text

```typescript
import { meetsWCAGStandard } from '@/utils/progressive-enhancement';

const result = meetsWCAGStandard('#FFFFFF', '#3B82F6', 'AA');
// { passes: true, ratio: 8.59 }
```

### 4. Keyboard Navigation

All interactive elements must be keyboard accessible:

```typescript
<TouchableOpacity
  onPress={handlePress}
  onFocus={handleFocus}
  onBlur={handleBlur}
  accessible={true}
  accessibilityRole="button"
/>
```

## Accessible Component Patterns

### Carousel Alternative

**Problem**: Traditional carousels are difficult to navigate with keyboard/screen readers and often auto-play without user control.

**Solution**: Use `AccessibleCarousel` with:
- Manual navigation buttons
- Clear pagination indicators
- Keyboard support
- Screen reader announcements
- Optional auto-play with user control

```typescript
import { AccessibleCarousel } from '@/components/accessible/AccessibleCarousel';

<AccessibleCarousel
  data={items}
  renderItem={(item) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
  showPagination={true}
  showNavButtons={true}
  autoplay={false} // User controlled
  accessibilityLabel="Featured items carousel"
/>
```

**Key Features**:
- ✓ Keyboard navigation (arrow keys)
- ✓ Screen reader support with live regions
- ✓ Manual navigation always available
- ✓ Clear visual indicators
- ✓ Respects reduced motion preferences

### Infinite Scroll with Pagination Fallback

**Problem**: Infinite scroll makes it difficult to reach footer content and is challenging for keyboard users.

**Solution**: Use `AccessibleInfiniteScroll` with pagination mode:

```typescript
import { AccessibleInfiniteScroll } from '@/components/accessible/AccessibleInfiniteScroll';

<AccessibleInfiniteScroll
  data={items}
  renderItem={(item) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
  onLoadMore={loadMore}
  hasMore={hasMore}
  loading={loading}
  usePagination={true} // Enable pagination fallback
  itemsPerPage={20}
/>
```

**Key Features**:
- ✓ Manual "Load More" button
- ✓ Pagination controls for keyboard users
- ✓ Screen reader announcements
- ✓ Pull-to-refresh support
- ✓ Clear loading states

### Complex Dropdown Alternative

**Problem**: Custom dropdowns often lack keyboard support and screen reader compatibility.

**Solution**: Use `AccessibleSelect` with search:

```typescript
import { AccessibleSelect } from '@/components/accessible/AccessibleSelect';

<AccessibleSelect
  options={[
    { label: 'Option 1', value: '1', description: 'Description' },
    { label: 'Option 2', value: '2' },
  ]}
  value={selectedValue}
  onChange={setValue}
  searchable={true}
  label="Select an option"
  required={true}
  accessibilityLabel="Choose your preference"
/>
```

**Key Features**:
- ✓ Full keyboard navigation
- ✓ Type-ahead search
- ✓ Screen reader support
- ✓ Clear focus indicators
- ✓ Error states
- ✓ Multi-select support

## Progressive Enhancement Utilities

### Accessibility Preferences Hook

```typescript
import { useAccessibilityPreferences } from '@/utils/progressive-enhancement';

function MyComponent() {
  const {
    reduceMotion,
    screenReaderEnabled,
    boldText,
    grayscale,
    invertColors,
  } = useAccessibilityPreferences();

  return (
    <View>
      {/* Adapt UI based on preferences */}
    </View>
  );
}
```

### Announcements

```typescript
import { announceForAccessibility } from '@/utils/progressive-enhancement';

// Polite announcement (doesn't interrupt)
announceForAccessibility('Item added to cart', 'polite');

// Assertive announcement (interrupts current speech)
announceForAccessibility('Error occurred', 'assertive');
```

### Focus Management

```typescript
import { FocusIndicator } from '@/utils/progressive-enhancement';

const styles = StyleSheet.create({
  button: {
    // Base styles
  },
  buttonFocused: Platform.select({
    web: FocusIndicator.web,
    default: FocusIndicator.native,
  }),
});
```

## Screen Reader Support

### Live Regions

Use for dynamic content updates:

```typescript
import { LiveRegion } from '@/components/accessible/LiveRegion';

<LiveRegion
  message="3 new messages"
  politeness="polite"
/>
```

### Status Messages

```typescript
import { StatusMessage } from '@/components/accessible/LiveRegion';

<StatusMessage
  status="success"
  message="Profile updated successfully"
  visible={showSuccess}
  onDismiss={() => setShowSuccess(false)}
/>
```

### Loading States

```typescript
import { LoadingAnnouncer } from '@/components/accessible/LiveRegion';

<LoadingAnnouncer
  loading={isLoading}
  loadingMessage="Loading your data"
  completedMessage="Data loaded successfully"
/>
```

## Skip Navigation

Allow keyboard users to skip repetitive content:

```typescript
import { SkipLink } from '@/components/accessible/SkipLink';

const mainContentRef = useRef<ScrollView>(null);

<SkipLink
  targetRef={mainContentRef}
  label="Skip to main content"
/>

<ScrollView ref={mainContentRef}>
  {/* Main content */}
</ScrollView>
```

## Responsive Grid System

### Standard Grid

```typescript
import { ResponsiveGrid } from '@/components/accessible/ResponsiveGrid';

<ResponsiveGrid
  columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
  gap={16}
  minItemWidth={250}
>
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</ResponsiveGrid>
```

### Masonry Grid

```typescript
import { MasonryGrid } from '@/components/accessible/ResponsiveGrid';

<MasonryGrid columns={2} gap={16}>
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</MasonryGrid>
```

## Inclusive Button

Enhanced button with accessibility features:

```typescript
import { InclusiveButton } from '@/components/accessible/InclusiveButton';

<InclusiveButton
  onPress={handleSubmit}
  variant="primary"
  size="medium"
  loading={isLoading}
  disabled={!isValid}
  icon={<CheckIcon />}
  iconPosition="left"
  accessibilityLabel="Submit form"
  accessibilityHint="Double tap to submit your information"
>
  Submit
</InclusiveButton>
```

## Testing Checklist

### Keyboard Navigation
- [ ] All interactive elements reachable via Tab
- [ ] Logical tab order
- [ ] Visible focus indicators
- [ ] Escape key closes modals/menus
- [ ] Arrow keys navigate lists/menus

### Screen Reader
- [ ] All images have alt text
- [ ] Buttons have descriptive labels
- [ ] Form inputs have associated labels
- [ ] Error messages announced
- [ ] Dynamic content uses live regions
- [ ] Skip navigation links present

### Visual
- [ ] Text contrast meets WCAG AA (4.5:1)
- [ ] Interactive elements meet size requirements (44x44)
- [ ] No information conveyed by color alone
- [ ] Content readable when scaled to 200%
- [ ] Animations respect reduced motion

### Touch/Pointer
- [ ] Touch targets minimum 44x44 pixels
- [ ] Adequate spacing between targets
- [ ] No hover-only functionality
- [ ] Gestures have alternatives
- [ ] Long press alternatives available

### Forms
- [ ] Labels associated with inputs
- [ ] Error messages clear and specific
- [ ] Required fields indicated
- [ ] Autocomplete attributes set
- [ ] Input types appropriate

## Common Anti-Patterns to Avoid

### ❌ Auto-playing content
```typescript
// Bad
<Video autoPlay loop />

// Good
<Video
  autoPlay={!reduceMotion && userConsent}
  controls
/>
```

### ❌ Color-only indicators
```typescript
// Bad
<Text style={{ color: 'red' }}>Error</Text>

// Good
<View>
  <ErrorIcon />
  <Text style={{ color: 'red' }}>Error: Invalid input</Text>
</View>
```

### ❌ Inaccessible custom controls
```typescript
// Bad
<View onTouchEnd={handlePress}>
  <Text>Button</Text>
</View>

// Good
<TouchableOpacity
  onPress={handlePress}
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Submit form"
>
  <Text>Button</Text>
</TouchableOpacity>
```

### ❌ Hidden content without alternatives
```typescript
// Bad
<View style={{ display: 'none' }}>Important info</View>

// Good
<Text style={styles.srOnly}>Important info</Text>
// or
<View accessibilityLabel="Important info" />
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [Expo Accessibility](https://docs.expo.dev/guides/accessibility/)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

## Component Reference

| Component | Use Case | Key Features |
|-----------|----------|--------------|
| AccessibleCarousel | Image galleries, featured content | Keyboard nav, screen reader, pagination |
| AccessibleInfiniteScroll | Long lists, feeds | Pagination fallback, load more button |
| AccessibleSelect | Form dropdowns | Search, keyboard nav, multi-select |
| InclusiveButton | All buttons | Focus management, haptic feedback |
| LiveRegion | Dynamic updates | Screen reader announcements |
| StatusMessage | Alerts, notifications | Auto-dismiss, accessibility |
| SkipLink | Page navigation | Keyboard shortcuts |
| ResponsiveGrid | Content layouts | Semantic HTML, screen reader |

## Support

For questions or issues with accessibility features, please consult:
1. This documentation
2. Component inline documentation
3. WCAG guidelines for specific requirements
