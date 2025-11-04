import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radius } from '@/constants/theme';

interface ThreeButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  loading?: boolean;
}

export function ThreeDButton({
  onPress,
  title,
  disabled = false,
  loading = false,
}: ThreeButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={styles.container}
    >
      <LinearGradient
        colors={disabled || loading ? ['#1a1a1a', '#1a1a1a'] : ['#3B82F6', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, (disabled || loading) && styles.gradientDisabled]}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={[styles.text, (disabled || loading) && styles.textDisabled]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 48,
    minHeight: 44,
    borderRadius: radius.md,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  gradientDisabled: {
    shadowOpacity: 0,
  },
  text: {
    fontSize: typography.size.md,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textDisabled: {
    color: '#666666',
  },
});
