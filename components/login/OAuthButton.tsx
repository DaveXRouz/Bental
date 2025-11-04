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
      activeOpacity={0.8}
      accessibilityLabel={`Sign in with ${label}`}
      accessibilityRole="button"
    >
      <View style={styles.redLayer} />
      <View style={styles.blueLayer} />
      <View style={styles.button}>
        <View style={styles.iconContainer}>{icon}</View>
        <Text style={styles.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 48,
    position: 'relative',
    minHeight: 44,
  },
  redLayer: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: 1,
    bottom: 1,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 50, 50, 0.3)',
    zIndex: 1,
  },
  blueLayer: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: -1,
    bottom: -1,
    borderRadius: radius.md,
    backgroundColor: 'rgba(50, 150, 255, 0.3)',
    zIndex: 2,
  },
  button: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.4)',
    paddingHorizontal: spacing.md,
    zIndex: 3,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  label: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: '#c0c0c0',
  },
});
