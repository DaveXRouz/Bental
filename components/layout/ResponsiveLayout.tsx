import React from 'react';
import { View, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import { breakpoints } from '@/constants/theme';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  maxWidth?: keyof typeof colors.layout.breakpoints | 'full';
  padding?: keyof typeof colors.spacing;
  style?: ViewStyle;
}

export function ResponsiveLayout({
  children,
  maxWidth = 'xl',
  padding = 4,
  style,
}: ResponsiveLayoutProps) {
  const { width } = useWindowDimensions();

  const getMaxWidth = () => {
    if (maxWidth === 'full') return '100%';
    return colors.layout.breakpoints[maxWidth];
  };

  const getPadding = () => {
    return colors.spacing[padding];
  };

  return (
    <View
      style={[
        styles.container,
        {
          maxWidth: getMaxWidth(),
          paddingHorizontal: getPadding(),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: keyof typeof colors.spacing;
  style?: ViewStyle;
}

export function ResponsiveGrid({
  children,
  columns = { xs: 1, sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
  style,
}: ResponsiveGridProps) {
  const { width } = useWindowDimensions();

  const getColumns = () => {
    if (width >= colors.layout.breakpoints.xl) return columns.xl || 4;
    if (width >= colors.layout.breakpoints.lg) return columns.lg || 3;
    if (width >= colors.layout.breakpoints.md) return columns.md || 2;
    if (width >= colors.layout.breakpoints.sm) return columns.sm || 1;
    return columns.xs || 1;
  };

  const columnCount = getColumns();
  const gapSize = colors.spacing[gap];

  return (
    <View
      style={[
        styles.grid,
        {
          gap: gapSize,
        },
        style,
      ]}
    >
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          style={{
            width: columnCount === 1
              ? '100%'
              : `${(100 / columnCount) - ((gapSize * (columnCount - 1)) / columnCount)}%`,
            minWidth: columnCount === 1 ? undefined : 280,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  gap?: keyof typeof colors.spacing;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  style?: ViewStyle;
}

export function ResponsiveStack({
  children,
  direction = 'vertical',
  gap = 4,
  align = 'stretch',
  justify = 'start',
  wrap = false,
  style,
}: ResponsiveStackProps) {
  const getAlignItems = () => {
    switch (align) {
      case 'start': return 'flex-start';
      case 'center': return 'center';
      case 'end': return 'flex-end';
      case 'stretch': return 'stretch';
      default: return 'stretch';
    }
  };

  const getJustifyContent = () => {
    switch (justify) {
      case 'start': return 'flex-start';
      case 'center': return 'center';
      case 'end': return 'flex-end';
      case 'between': return 'space-between';
      case 'around': return 'space-around';
      default: return 'flex-start';
    }
  };

  return (
    <View
      style={[
        styles.stack,
        {
          flexDirection: direction === 'horizontal' ? 'row' : 'column',
          gap: colors.spacing[gap],
          alignItems: getAlignItems(),
          justifyContent: getJustifyContent(),
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  stack: {
    width: '100%',
  },
});
