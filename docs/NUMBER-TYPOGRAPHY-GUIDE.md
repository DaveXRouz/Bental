# Number Typography Guide

## Overview

This guide explains the standardized number typography system implemented across the trading platform. The system ensures professional, aligned number displays using tabular number features for a polished, premium appearance.

## Why Tabular Numbers?

Tabular numbers (also called monospaced or fixed-width numbers) ensure that:
- Numbers align properly in tables and lists
- Financial data is easier to read and compare
- The UI looks more professional and polished
- Numbers don't shift horizontally when values change

## Components

### CurrencyDisplay

Use for all monetary values.

```tsx
import { CurrencyDisplay } from '@/components/ui';

// Hero display (large values)
<CurrencyDisplay value={154723} size="hero" compact />
// Output: $154.7k

// Large values
<CurrencyDisplay value={1234.56} size="large" />
// Output: $1,234.56

// Medium (default)
<CurrencyDisplay value={500.00} size="medium" />
// Output: $500.00

// Small values
<CurrencyDisplay value={42.50} size="small" />
// Output: $42.50

// With sign
<CurrencyDisplay value={-123.45} showSign color="#EF4444" />
// Output: -$123.45
```

**Props:**
- `value: number` - The monetary value to display
- `size?: 'small' | 'medium' | 'large' | 'hero'` - Display size (default: 'medium')
- `compact?: boolean` - Use K/M/B abbreviations (default: false)
- `currency?: string` - Currency symbol (default: '$')
- `showSign?: boolean` - Show + for positive values (default: false)
- `color?: string` - Text color
- `style?: TextStyle` - Additional styles

### PercentageDisplay

Use for all percentage values.

```tsx
import { PercentageDisplay } from '@/components/ui';

// Colorized percentage (green for positive, red for negative)
<PercentageDisplay value={5.67} colorize />
// Output: +5.67% (in green)

<PercentageDisplay value={-2.34} colorize />
// Output: -2.34% (in red)

// With suffix
<PercentageDisplay value={12.5} suffix=" Today" />
// Output: +12.5% Today

// Custom decimals
<PercentageDisplay value={0.123} decimals={3} />
// Output: +0.123%
```

**Props:**
- `value: number` - The percentage value to display
- `size?: 'small' | 'medium'` - Display size (default: 'medium')
- `decimals?: number` - Decimal places (default: 2)
- `showSign?: boolean` - Show + for positive values (default: true)
- `colorize?: boolean` - Color code positive/negative (default: false)
- `suffix?: string` - Text to append after percentage
- `style?: TextStyle` - Additional styles

### NumberText

Use for generic numeric displays (shares, quantities, decimals).

```tsx
import { NumberText } from '@/components/ui';

// Quantity display
<NumberText value={123.45} variant="quantity" suffix=" shares" />
// Output: 123.45 shares

// Compact numbers
<NumberText value={1500000} variant="compact" />
// Output: 1.5M

// Decimal values
<NumberText value={42.123456} variant="decimal" />
// Output: 42.123456
```

**Props:**
- `value: number | string` - The value to display
- `variant?: NumberVariant` - Display variant ('currency' | 'percentage' | 'quantity' | 'decimal' | 'compact' | 'hero')
- `prefix?: string` - Text to prepend
- `suffix?: string` - Text to append
- `color?: string` - Text color
- `style?: TextStyle` - Additional styles

## Theme Integration

The typography theme has been extended with number-specific configurations:

```typescript
import { typography } from '@/constants/theme';

// Access numeric typography settings
typography.numeric.letterSpacing.tight  // -0.5
typography.numeric.letterSpacing.normal // 0
typography.numeric.letterSpacing.relaxed // 0.5
```

## Utility Functions

### Number Typography Utilities

```typescript
import {
  getNumberStyle,
  numberStyles,
  makeTabular
} from '@/utils/number-typography';

// Get a specific number style
const style = getNumberStyle({
  variant: 'currency',
  size: 'lg',
  weight: 'bold'
});

// Use predefined styles
const heroStyle = numberStyles.hero;
const currencyStyle = numberStyles.currency;

// Make any text style tabular
const tabularStyle = makeTabular(yourExistingStyle);
```

### Formatting Utilities (Legacy)

For backward compatibility, the existing formatting utilities still work:

```typescript
import {
  formatCurrency,
  formatPercent,
  formatNumber
} from '@/utils/formatting';

// However, prefer using the component-based approach for better consistency
```

## Web Platform Support

For web platforms, tabular number features are automatically enabled via CSS:

```css
/* Applied globally in app/_layout.tsx */
body {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "zero" 1;
}
```

This ensures that all numbers rendered on web have proper alignment even when not using the specialized components.

## Migration Guide

### Before (Inconsistent)

```tsx
<Text style={styles.price}>
  ${totalValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}
</Text>
```

### After (Standardized)

```tsx
<CurrencyDisplay
  value={totalValue}
  size="large"
  style={styles.price}
/>
```

## Best Practices

1. **Always use components for number displays** - They automatically apply tabular styling
2. **Choose the right variant** - Use CurrencyDisplay for money, PercentageDisplay for percentages
3. **Enable colorize for performance metrics** - Makes positive/negative values instantly recognizable
4. **Use compact mode for large hero numbers** - Improves readability
5. **Apply consistent sizing** - Use size props instead of custom font sizes

## Common Patterns

### Dashboard Balance Display

```tsx
<CurrencyDisplay
  value={portfolioValue}
  size="hero"
  compact={portfolioValue >= 100000}
  style={styles.balanceValue}
/>
```

### Performance Metrics

```tsx
<View style={styles.metricRow}>
  <PercentageDisplay
    value={changePercent}
    colorize
    size="small"
  />
  <CurrencyDisplay
    value={changeAmount}
    showSign
    size="small"
    color={changeAmount >= 0 ? colors.success : colors.danger}
  />
</View>
```

### Holdings Table

```tsx
<View style={styles.holdingRow}>
  <NumberText
    value={quantity}
    variant="quantity"
    suffix=" shares"
  />
  <CurrencyDisplay
    value={marketValue}
    size="medium"
  />
  <PercentageDisplay
    value={gainLossPercent}
    colorize
    size="small"
  />
</View>
```

## Accessibility

All number components include proper accessibility support:
- Automatic `accessibilityLabel` generation
- Support for screen readers
- Proper semantic roles
- High contrast color support

## Performance

The number typography system is optimized for performance:
- Memoized style calculations
- Minimal re-renders
- Efficient component structure
- Web font-feature-settings applied at document level

## Browser Support

Tabular number features are supported in:
- Chrome/Edge 48+
- Firefox 34+
- Safari 9.1+
- All modern mobile browsers

For older browsers, numbers will display correctly but may not have perfect alignment.
