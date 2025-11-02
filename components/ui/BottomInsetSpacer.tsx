import React from 'react';
import { View, StyleSheet } from 'react-native';

const TAB_BAR_HEIGHT = 84;
const BOTTOM_PADDING = 24;

interface BottomInsetSpacerProps {
  additionalPadding?: number;
}

export const BottomInsetSpacer = React.memo(({ additionalPadding = 0 }: BottomInsetSpacerProps) => {
  return <View style={[styles.spacer, { height: TAB_BAR_HEIGHT + BOTTOM_PADDING + additionalPadding }]} />;
});

BottomInsetSpacer.displayName = 'BottomInsetSpacer';

const styles = StyleSheet.create({
  spacer: {
    width: '100%',
  },
});

export const TAB_BAR_HEIGHT_CONSTANT = TAB_BAR_HEIGHT;
