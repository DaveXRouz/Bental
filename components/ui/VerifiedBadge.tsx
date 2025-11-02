import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { colors, VerifiedBadgeSize } from '@/constants/theme';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
}

export function VerifiedBadge({ size = 'md' }: VerifiedBadgeProps) {
  const iconSize = VerifiedBadgeSize[size];

  return (
    <View style={styles.container}>
      <CheckCircle size={iconSize} color={colors.accent} fill={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
