import { Platform, TextStyle } from 'react-native';
import { typography } from '@/constants/theme';

/**
 * Number Typography Utilities
 *
 * Provides consistent, professional styling for numeric displays across the app.
 * Implements tabular number features for proper alignment in tables, dashboards, and financial data.
 */

export type NumberVariant = 'currency' | 'percentage' | 'quantity' | 'decimal' | 'compact' | 'hero';

export interface NumberStyleOptions {
  variant?: NumberVariant;
  size?: keyof typeof typography.size;
  weight?: keyof typeof typography.weight;
  letterSpacing?: number;
}

/**
 * Get tabular number styles for web platform
 * Uses CSS font-feature-settings for OpenType features
 */
const getWebTabularStyles = (): Partial<TextStyle> => {
  if (Platform.OS !== 'web') return {};

  return {
    // @ts-ignore - Web-specific CSS properties
    fontVariantNumeric: 'tabular-nums',
    fontFeatureSettings: '"tnum" 1, "zero" 1',
  };
};

/**
 * Base tabular number style
 * Optimized for financial data and numeric displays
 */
export const tabularNumberStyle: TextStyle = {
  fontFamily: typography.family.medium,
  letterSpacing: typography.numeric.letterSpacing.tight,
  ...getWebTabularStyles(),
};

/**
 * Get number style based on variant and options
 */
export const getNumberStyle = (options: NumberStyleOptions = {}): TextStyle => {
  const {
    variant = 'decimal',
    size = 'md',
    weight = 'medium',
    letterSpacing,
  } = options;

  const baseStyle: TextStyle = {
    fontFamily: typography.family[weight],
    fontSize: typography.size[size],
    letterSpacing: letterSpacing ?? typography.numeric.letterSpacing.tight,
    ...getWebTabularStyles(),
  };

  // Variant-specific adjustments
  switch (variant) {
    case 'hero':
      return {
        ...baseStyle,
        fontFamily: typography.family.bold,
        letterSpacing: -1,
      };

    case 'currency':
      return {
        ...baseStyle,
        fontFamily: typography.family.semibold,
      };

    case 'percentage':
      return {
        ...baseStyle,
        fontFamily: typography.family.semibold,
      };

    case 'quantity':
      return {
        ...baseStyle,
        fontFamily: typography.family.medium,
      };

    case 'compact':
      return {
        ...baseStyle,
        fontFamily: typography.family.semibold,
        letterSpacing: typography.numeric.letterSpacing.normal,
      };

    case 'decimal':
    default:
      return baseStyle;
  }
};

/**
 * Predefined number styles for common use cases
 */
export const numberStyles = {
  // Hero display numbers (large dashboard values)
  hero: getNumberStyle({
    variant: 'hero',
    size: 'xxxxl',
    weight: 'bold',
  }),

  // Large currency values
  currencyLarge: getNumberStyle({
    variant: 'currency',
    size: 'xxxl',
    weight: 'bold',
  }),

  // Medium currency values (most common)
  currency: getNumberStyle({
    variant: 'currency',
    size: 'lg',
    weight: 'semibold',
  }),

  // Small currency values
  currencySmall: getNumberStyle({
    variant: 'currency',
    size: 'sm',
    weight: 'medium',
  }),

  // Percentage displays
  percentage: getNumberStyle({
    variant: 'percentage',
    size: 'md',
    weight: 'semibold',
  }),

  percentageSmall: getNumberStyle({
    variant: 'percentage',
    size: 'sm',
    weight: 'medium',
  }),

  // Quantity/shares
  quantity: getNumberStyle({
    variant: 'quantity',
    size: 'md',
    weight: 'medium',
  }),

  // Compact numbers (with K, M, B suffixes)
  compact: getNumberStyle({
    variant: 'compact',
    size: 'lg',
    weight: 'semibold',
  }),

  compactSmall: getNumberStyle({
    variant: 'compact',
    size: 'sm',
    weight: 'medium',
  }),

  // Table/list numbers
  tableNumber: getNumberStyle({
    variant: 'decimal',
    size: 'md',
    weight: 'medium',
  }),

  // Chart labels
  chartLabel: getNumberStyle({
    variant: 'decimal',
    size: 'xs',
    weight: 'medium',
  }),
};

/**
 * Helper to combine number style with additional styles
 */
export const withNumberStyle = (
  numberStyle: TextStyle,
  additionalStyle?: TextStyle | TextStyle[]
): TextStyle => {
  if (!additionalStyle) return numberStyle;

  const additional = Array.isArray(additionalStyle)
    ? Object.assign({}, ...additionalStyle)
    : additionalStyle;

  return {
    ...numberStyle,
    ...additional,
  };
};

/**
 * Apply tabular number styling to existing text style
 */
export const makeTabular = (style: TextStyle): TextStyle => {
  return {
    ...style,
    letterSpacing: style.letterSpacing ?? typography.numeric.letterSpacing.tight,
    ...getWebTabularStyles(),
  };
};
