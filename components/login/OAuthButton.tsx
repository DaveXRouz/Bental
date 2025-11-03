import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { theme } from '@/theme';

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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    paddingHorizontal: theme.spacing(2),
    minHeight: 44,
  },
  iconContainer: {
    marginRight: theme.spacing(1.5),
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.text,
  },
});
