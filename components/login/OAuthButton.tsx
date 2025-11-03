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
      style={styles.button}
      activeOpacity={0.7}
      accessibilityLabel={`Sign in with ${label}`}
      accessibilityRole="button"
    >
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  label: {
    fontSize: typography.size.md, fontWeight: "500",
    color: colors.text,
  },
});
