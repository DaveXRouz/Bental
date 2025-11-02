import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  mobileStyle?: ViewStyle;
  tabletStyle?: ViewStyle;
  desktopStyle?: ViewStyle;
  maxWidth?: number | 'mobile' | 'tablet' | 'desktop';
  centered?: boolean;
}

export function ResponsiveContainer({
  children,
  style,
  mobileStyle,
  tabletStyle,
  desktopStyle,
  maxWidth,
  centered = false,
}: ResponsiveContainerProps) {
  const { isMobile, isTablet, isDesktop, width } = useResponsive();

  const responsiveStyle = isMobile
    ? mobileStyle
    : isTablet
    ? tabletStyle
    : desktopStyle;

  const maxWidthValue =
    typeof maxWidth === 'number'
      ? maxWidth
      : maxWidth === 'mobile'
      ? 480
      : maxWidth === 'tablet'
      ? 768
      : maxWidth === 'desktop'
      ? 1200
      : undefined;

  const containerStyle: ViewStyle = {
    width: '100%',
    maxWidth: maxWidthValue,
    ...(centered && {
      marginHorizontal: 'auto',
      alignSelf: 'center',
    }),
  };

  return (
    <View style={[styles.container, containerStyle, style, responsiveStyle]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
});
