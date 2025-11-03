import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { DesignSystem } from '@/constants/design-system';

interface UnifiedCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof DesignSystem.spacing;
  onPress?: () => void;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function UnifiedCard({
  children,
  variant = 'default',
  padding = 4,
  onPress,
  style,
}: UnifiedCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const paddingValue = DesignSystem.spacing[padding];

  if (variant === 'elevated') {
    const CardContent = onPress ? AnimatedPressable : View;
    return (
      <CardContent
        onPress={onPress}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        style={[animatedStyle, style]}
      >
        <BlurView
          intensity={18}
          tint="dark"
          style={[styles.elevatedCard, { padding: paddingValue }]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.gradient, { padding: paddingValue }]}
          >
            {children}
          </LinearGradient>
        </BlurView>
      </CardContent>
    );
  }

  if (variant === 'outlined') {
    const CardContent = onPress ? AnimatedPressable : View;
    return (
      <CardContent
        onPress={onPress}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        style={[
          animatedStyle,
          styles.outlinedCard,
          { padding: paddingValue },
          style,
        ]}
      >
        {children}
      </CardContent>
    );
  }

  if (variant === 'filled') {
    const CardContent = onPress ? AnimatedPressable : View;
    return (
      <CardContent
        onPress={onPress}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        style={[
          animatedStyle,
          styles.filledCard,
          { padding: paddingValue },
          style,
        ]}
      >
        {children}
      </CardContent>
    );
  }

  const CardContent = onPress ? AnimatedPressable : View;
  return (
    <CardContent
      onPress={onPress}
      onPressIn={onPress ? handlePressIn : undefined}
      onPressOut={onPress ? handlePressOut : undefined}
      style={[animatedStyle, style]}
    >
      <BlurView
        intensity={18}
        tint="dark"
        style={[styles.defaultCard, { padding: paddingValue }]}
      >
        {children}
      </BlurView>
    </CardContent>
  );
}

const styles = StyleSheet.create({
  defaultCard: {
    borderRadius: DesignSystem.borderRadius.lg,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.default,
    overflow: 'hidden',
    backgroundColor: DesignSystem.colors.surface.card,
    ...DesignSystem.shadows.sm,
  },
  elevatedCard: {
    borderRadius: DesignSystem.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: DesignSystem.colors.border.default,
    overflow: 'hidden',
    backgroundColor: DesignSystem.colors.surface.cardElevated,
    ...DesignSystem.shadows.md,
  },
  outlinedCard: {
    borderRadius: DesignSystem.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: DesignSystem.colors.border.default,
    backgroundColor: 'transparent',
  },
  filledCard: {
    borderRadius: DesignSystem.borderRadius.lg,
    backgroundColor: DesignSystem.colors.surface.cardElevated,
    ...DesignSystem.shadows.sm,
  },
  gradient: {
    borderRadius: DesignSystem.borderRadius.lg,
  },
});
