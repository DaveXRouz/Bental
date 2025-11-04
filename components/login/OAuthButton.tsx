import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';

interface OAuthButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
}

export function OAuthButton({ onPress, icon, label }: OAuthButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.85}
      accessibilityLabel={`Sign in with ${label}`}
      accessibilityRole="button"
    >
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 44,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 40, 40, 0.6)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.25)',
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: '#b0b0b0',
  },
});
