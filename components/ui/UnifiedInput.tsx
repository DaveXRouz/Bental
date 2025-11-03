import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';

interface UnifiedInputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  error?: string;
  success?: boolean;
  helperText?: string;
  required?: boolean;
}

export function UnifiedInput({
  label,
  icon,
  rightIcon,
  onRightIconPress,
  error,
  success,
  helperText,
  required,
  ...textInputProps
}: UnifiedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusWidth = useSharedValue(0);
  const focusOpacity = useSharedValue(0);

  const getBorderColor = () => {
    if (error) return colors.danger;
    if (success) return colors.success;
    if (isFocused) return colors.accent;
    return colors.border;
  };

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {}
    }
    focusWidth.value = withTiming(2, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
    focusOpacity.value = withTiming(1, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
    textInputProps.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusWidth.value = withTiming(0, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
    focusOpacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
    textInputProps.onBlur?.(e);
  };

  const focusRingStyle = useAnimatedStyle(() => ({
    borderWidth: focusWidth.value,
    opacity: focusOpacity.value,
  }));

  return (
    <View style={styles.wrapper}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      <View style={styles.container}>
        <BlurView
          intensity={18}
          tint="dark"
          style={[
            styles.blurContainer,
            {
              borderColor: getBorderColor(),
            },
          ]}
        >
          <LinearGradient
            colors={
              isFocused
                ? ['rgba(0, 245, 212, 0.12)', 'rgba(120, 220, 255, 0.08)']
                : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.92)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.content}>
              {icon && <View style={styles.iconContainer}>{icon}</View>}

              <TextInput
                {...textInputProps}
                style={[styles.input, textInputProps.style]}
                placeholderTextColor={colors.textMuted}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />

              {rightIcon && (
                <TouchableOpacity
                  onPress={onRightIconPress}
                  style={styles.rightIconContainer}
                  activeOpacity={0.7}
                  disabled={!onRightIconPress}
                >
                  {rightIcon}
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </BlurView>

        <Animated.View style={[styles.focusRing, focusRingStyle]} pointerEvents="none">
          <LinearGradient
            colors={
              error
                ? [colors.danger, 'rgba(255, 77, 77, 0.2)']
                : [colors.accent, colors.accentDark]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.focusGradient}
          />
        </Animated.View>
      </View>

      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  labelContainer: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.medium,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  required: {
    color: colors.danger,
  },
  container: {
    position: 'relative',
    height: 52,
  },
  blurContainer: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    ...shadows.sm,
  },
  gradient: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    zIndex: 1,
  },
  iconContainer: {
    marginRight: spacing.md,
    opacity: 0.65,
    zIndex: 2,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.textInverse,
    fontFamily: typography.family.medium,
    fontWeight: '500',
    zIndex: 2,
    height: 48,
    paddingVertical: 0,
    letterSpacing: 0.5,
  },
  rightIconContainer: {
    padding: spacing.sm,
    marginLeft: spacing.md,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.glass,
  },
  focusGradient: {
    flex: 1,
    borderRadius: radius.lg,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    fontFamily: typography.family.medium,
    marginTop: spacing.sm,
    marginLeft: spacing.md,
    letterSpacing: 0.5,
  },
  errorText: {
    color: colors.danger,
  },
});
