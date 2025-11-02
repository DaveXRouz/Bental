import React from 'react';
import { Text, StyleSheet, Pressable, ViewStyle, TextStyle, Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GLASS } from '@/constants/glass';
import { useThemeStore } from '@/stores/useThemeStore';
import { theme as designTheme, colors } from '@/constants/theme';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  icon,
}: GlassButtonProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handlePressIn = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scale.value = withTiming(0.98, { duration: 150 });
    translateY.value = withTiming(2, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });
  };

  const getColors = (): { background: string; border: string; text: string; shadow: boolean } => {
    if (disabled) {
      return {
        background: 'rgba(255,255,255,0.05)',
        border: 'rgba(255,255,255,0.08)',
        text: 'rgba(255,255,255,0.4)',
        shadow: false,
      };
    }

    switch (variant) {
      case 'primary':
        return {
          background: isDark ? '#FFFFFF' : '#000000',
          border: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          text: isDark ? '#000000' : '#FFFFFF',
          shadow: true,
        };
      case 'destructive':
        return {
          background: '#EF4444',
          border: 'rgba(239,68,68,0.4)',
          text: '#FFFFFF',
          shadow: true,
        };
      case 'secondary':
      default:
        return {
          background: 'rgba(255,255,255,0.08)',
          border: 'rgba(255,255,255,0.12)',
          text: '#FFFFFF',
          shadow: false,
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatedPressable
      onPress={() => {
        if (!disabled) {
          onPress();
        }
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, fullWidth && styles.fullWidth]}
    >
      <BlurView
        intensity={18}
        tint="dark"
        style={[
          styles.blur,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            ...(colors.shadow ? designTheme.shadows.sm : {}),
          },
          style,
        ]}
      >
        <View style={styles.gradient}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, { color: colors.text }, textStyle]}>
            {title}
          </Text>
        </View>
      </BlurView>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  blur: {
    borderRadius: designTheme.radius.md,
    overflow: 'hidden',
    minHeight: 48,
    borderWidth: 1,
  },
  gradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48,
    gap: 8,
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.3,
  },
});
