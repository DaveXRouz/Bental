import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';

interface UnifiedCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof spacing;
  onPress?: () => void;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function UnifiedCard({
  children,
  variant = 'default',
  padding = 'lg' as keyof typeof spacing,
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

  const paddingValue = spacing[padding];

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
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  elevatedCard: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    ...shadows.md,
  },
  outlinedCard: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  filledCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    ...shadows.sm,
  },
  gradient: {
    borderRadius: radius.lg,
  },
});
