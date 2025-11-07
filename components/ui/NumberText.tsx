import React from 'react';
import { Text, TextStyle, TextProps } from 'react-native';
import { numberStyles, withNumberStyle, NumberVariant } from '@/utils/number-typography';
import { colors } from '@/constants/theme';

interface NumberTextProps extends Omit<TextProps, 'children'> {
  value: number | string;
  variant?: NumberVariant;
  style?: TextStyle | TextStyle[];
  color?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * NumberText Component
 *
 * Universal component for rendering numbers with professional tabular styling.
 * Automatically applies appropriate font features for proper alignment.
 *
 * @example
 * <NumberText value={1234.56} variant="currency" prefix="$" />
 * <NumberText value={-5.67} variant="percentage" suffix="%" />
 */
export const NumberText: React.FC<NumberTextProps> = ({
  value,
  variant = 'decimal',
  style,
  color = colors.white,
  prefix = '',
  suffix = '',
  ...textProps
}) => {
  // Select appropriate base style for variant
  const getBaseStyle = (): TextStyle => {
    switch (variant) {
      case 'hero':
        return numberStyles.hero;
      case 'currency':
        return numberStyles.currency;
      case 'percentage':
        return numberStyles.percentage;
      case 'quantity':
        return numberStyles.quantity;
      case 'compact':
        return numberStyles.compact;
      case 'decimal':
      default:
        return numberStyles.tableNumber;
    }
  };

  const baseStyle = getBaseStyle();
  const combinedStyle = withNumberStyle(baseStyle, [{ color }, ...(Array.isArray(style) ? style : [style])]);

  return (
    <Text style={combinedStyle} {...textProps}>
      {prefix}{value}{suffix}
    </Text>
  );
};

NumberText.displayName = 'NumberText';
