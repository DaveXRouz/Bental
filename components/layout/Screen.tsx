import React from 'react';
import { View, ScrollView, StyleSheet, Platform, ViewStyle, ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TAB_BAR_HEIGHT = 72;
export const FAB_HEIGHT = 80;

interface ScreenProps extends ScrollViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  includeTabPadding?: boolean;
  includeFabPadding?: boolean;
  containerStyle?: ViewStyle;
}

export function Screen({
  children,
  scrollable = true,
  includeTabPadding = true,
  includeFabPadding = false,
  containerStyle,
  contentContainerStyle,
  ...scrollViewProps
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const bottomPadding = includeTabPadding
    ? TAB_BAR_HEIGHT + (Platform.OS === 'ios' ? insets.bottom : 16) + (includeFabPadding ? FAB_HEIGHT : 0)
    : includeFabPadding
    ? FAB_HEIGHT
    : 0;

  if (!scrollable) {
    return (
      <View
        style={[
          styles.container,
          containerStyle,
          { paddingBottom: bottomPadding },
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scrollView, containerStyle]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: bottomPadding },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  scrollView: {
    flex: 1,
    minWidth: 0,
  },
  scrollContent: {
    flexGrow: 1,
    minWidth: 0,
  },
});
