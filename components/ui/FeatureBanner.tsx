import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, Lock, Info } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { spacing, typography } from '@/constants/theme';

interface FeatureBannerProps {
  type: 'disabled' | 'maintenance' | 'info';
  message: string;
  visible?: boolean;
}

export function FeatureBanner({ type, message, visible = true }: FeatureBannerProps) {
  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'disabled':
        return <Lock size={18} color="#ef4444" />;
      case 'maintenance':
        return <AlertTriangle size={18} color="#f59e0b" />;
      case 'info':
        return <Info size={18} color="#3b82f6" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'disabled':
        return 'rgba(239, 68, 68, 0.1)';
      case 'maintenance':
        return 'rgba(245, 158, 11, 0.1)';
      case 'info':
        return 'rgba(59, 130, 246, 0.1)';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'disabled':
        return 'rgba(239, 68, 68, 0.3)';
      case 'maintenance':
        return 'rgba(245, 158, 11, 0.3)';
      case 'info':
        return 'rgba(59, 130, 246, 0.3)';
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
      ]}
    >
      {getIcon()}
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: typography.size.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: typography.weight.medium,
    lineHeight: 20,
  },
});
