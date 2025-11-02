import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  AccessibilityState,
  Platform,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useThemeStore } from '@/stores/useThemeStore';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { A11yHelpers, ProgressiveEnhancement } from '@/utils/accessibility';

interface ImprovedButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  loadingText?: string;
}

export function ImprovedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
  fullWidth = false,
  hapticFeedback = true,
  loadingText = 'Loading',
}: ImprovedButtonProps) {
  const { colors } = useThemeStore();
  const [pressed, setPressed] = useState(false);
  const scale = useSharedValue(1);

  const isDisabled = disabled || loading;

  const handlePress = async () => {
    if (isDisabled) return;

    if (hapticFeedback && Platform.OS !== 'web' && ProgressiveEnhancement.shouldUseHaptics()) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }

    if (ProgressiveEnhancement.shouldUseAnimation()) {
      scale.value = withSequence(
        withSpring(0.95, { damping: 10 }),
        withSpring(1, { damping: 10 })
      );
    }

    const result = onPress();
    if (result instanceof Promise) {
      await result;
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getBackgroundColor = () => {
    if (isDisabled) return colors.surfaceHighlight;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'destructive':
        return colors.error;
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (isDisabled) return colors.textTertiary;
    if (variant === 'ghost') return colors.primary;
    return colors.textInverse;
  };

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 36;
      case 'md':
        return 48;
      case 'lg':
        return 56;
      default:
        return 48;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return Typography.size.sm;
      case 'md':
        return Typography.size.md;
      case 'lg':
        return Typography.size.lg;
      default:
        return Typography.size.md;
    }
  };

  const accessibilityState: AccessibilityState = {
    disabled: isDisabled,
    busy: loading,
  };

  const effectiveAccessibilityLabel =
    accessibilityLabel ||
    (loading ? `${loadingText}, ${title}` : title);

  const effectiveAccessibilityHint =
    accessibilityHint ||
    (loading ? 'Please wait while the action completes' : undefined);

  return (
    <Animated.View style={[animatedStyle, fullWidth && { width: '100%' }]}>
      <TouchableOpacity
        testID={testID}
        onPress={handlePress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        disabled={isDisabled}
        style={[
          styles.button,
          {
            backgroundColor: getBackgroundColor(),
            height: getHeight(),
            borderColor: variant === 'ghost' ? colors.border : 'transparent',
            borderWidth: variant === 'ghost' ? 1 : 0,
            opacity: pressed && !isDisabled ? 0.8 : 1,
            width: fullWidth ? '100%' : undefined,
          },
          style,
        ]}
        activeOpacity={0.9}
        accessible={true}
        accessibilityLabel={effectiveAccessibilityLabel}
        accessibilityHint={effectiveAccessibilityHint}
        accessibilityRole="button"
        accessibilityState={accessibilityState}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={getTextColor()} size="small" />
            <Text
              style={[
                styles.text,
                {
                  color: getTextColor(),
                  fontSize: getFontSize(),
                  marginLeft: Spacing.sm,
                },
              ]}
            >
              {loadingText}
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === 'left' && (
              <View style={styles.iconLeft}>{icon}</View>
            )}
            <Text
              style={[
                styles.text,
                {
                  color: getTextColor(),
                  fontSize: getFontSize(),
                  fontFamily: Typography.family.semibold,
                },
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === 'right' && (
              <View style={styles.iconRight}>{icon}</View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});
