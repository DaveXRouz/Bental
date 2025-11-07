import React, { useMemo } from 'react';
import { Text, TextStyle, TextProps } from 'react-native';
import { numberStyles, withNumberStyle } from '@/utils/number-typography';
import { colors } from '@/constants/theme';

interface PercentageDisplayProps extends Omit<TextProps, 'children'> {
  value: number;
  size?: 'small' | 'medium';
  style?: TextStyle | TextStyle[];
  decimals?: number;
  showSign?: boolean;
  colorize?: boolean;
  suffix?: string;
}

/**
 * PercentageDisplay Component
 *
 * Specialized component for displaying percentage values with proper formatting and styling.
 * Optionally colorizes positive/negative values.
 *
 * @example
 * <PercentageDisplay value={5.67} colorize />  // +5.67% (green)
 * <PercentageDisplay value={-2.34} colorize />  // -2.34% (red)
 * <PercentageDisplay value={0.12} decimals={3} />  // 0.120%
 * <PercentageDisplay value={5.67} suffix=" Today" />  // +5.67% Today
 */
export const PercentageDisplay: React.FC<PercentageDisplayProps> = ({
  value,
  size = 'medium',
  style,
  decimals = 2,
  showSign = true,
  colorize = false,
  suffix = '',
  ...textProps
}) => {
  const formattedValue = useMemo(() => {
    const sign = showSign && value >= 0 ? '+' : '';
    const formatted = value.toFixed(decimals);
    return `${sign}${formatted}%${suffix}`;
  }, [value, decimals, showSign, suffix]);

  const color = useMemo(() => {
    if (!colorize) return colors.white;
    return value >= 0 ? colors.success : colors.danger;
  }, [value, colorize]);

  const baseStyle = size === 'small' ? numberStyles.percentageSmall : numberStyles.percentage;
  const combinedStyle = withNumberStyle(baseStyle, [{ color }, ...(Array.isArray(style) ? style : [style])]);

  return (
    <Text style={combinedStyle} {...textProps}>
      {formattedValue}
    </Text>
  );
};

PercentageDisplay.displayName = 'PercentageDisplay';
