import React, { useMemo } from 'react';
import { Text, TextStyle, TextProps } from 'react-native';
import { numberStyles, withNumberStyle } from '@/utils/number-typography';
import { colors } from '@/constants/theme';

interface CurrencyDisplayProps extends Omit<TextProps, 'children'> {
  value: number;
  size?: 'small' | 'medium' | 'large' | 'hero';
  style?: TextStyle | TextStyle[];
  color?: string;
  currency?: string;
  showSign?: boolean;
  compact?: boolean;
}

/**
 * CurrencyDisplay Component
 *
 * Specialized component for displaying monetary values with proper formatting and tabular styling.
 *
 * @example
 * <CurrencyDisplay value={154723} size="hero" compact />  // $154.7k
 * <CurrencyDisplay value={1234.56} size="medium" />  // $1,234.56
 * <CurrencyDisplay value={-500} showSign color="#EF4444" />  // -$500.00
 */
export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  value,
  size = 'medium',
  style,
  color = colors.white,
  currency = '$',
  showSign = false,
  compact = false,
  ...textProps
}) => {
  const formattedValue = useMemo(() => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : showSign && value > 0 ? '+' : '';

    if (compact) {
      if (absValue >= 1_000_000_000) {
        return `${sign}${currency}${(absValue / 1_000_000_000).toFixed(1)}B`;
      }
      if (absValue >= 1_000_000) {
        return `${sign}${currency}${(absValue / 1_000_000).toFixed(1)}M`;
      }
      if (absValue >= 10_000) {
        return `${sign}${currency}${(absValue / 1_000).toFixed(1)}k`;
      }
      if (absValue >= 1_000) {
        return `${sign}${currency}${(absValue / 1_000).toFixed(2)}k`;
      }
    }

    const formatted = absValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `${sign}${currency}${formatted}`;
  }, [value, currency, showSign, compact]);

  const getBaseStyle = (): TextStyle => {
    switch (size) {
      case 'hero':
        return numberStyles.hero;
      case 'large':
        return numberStyles.currencyLarge;
      case 'small':
        return numberStyles.currencySmall;
      case 'medium':
      default:
        return numberStyles.currency;
    }
  };

  const baseStyle = getBaseStyle();
  const combinedStyle = withNumberStyle(baseStyle, [{ color }, ...(Array.isArray(style) ? style : style ? [style] : [])]);

  return (
    <Text style={combinedStyle} {...textProps}>
      {formattedValue}
    </Text>
  );
};

CurrencyDisplay.displayName = 'CurrencyDisplay';
