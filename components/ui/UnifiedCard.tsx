import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, typography, radius } from '@/constants/theme';

interface UnifiedCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof colors.spacing;
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

  const paddingValue = colors.spacing[padding];

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
    borderRadius: colors.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.colors.border.default,
    overflow: 'hidden',
    backgroundColor: colors.colors.surface.card,
    ...colors.shadows.sm,
  },
  elevatedCard: {
    borderRadius: colors.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.colors.border.default,
    overflow: 'hidden',
    backgroundColor: colors.colors.surface.cardElevated,
    ...colors.shadows.md,
  },
  outlinedCard: {
    borderRadius: colors.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.colors.border.default,
    backgroundColor: 'transparent',
  },
  filledCard: {
    borderRadius: colors.borderRadius.lg,
    backgroundColor: colors.colors.surface.cardElevated,
    ...colors.shadows.sm,
  },
  gradient: {
    borderRadius: colors.borderRadius.lg,
  },
});
