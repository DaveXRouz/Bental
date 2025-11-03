import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, radius } from '@/constants/theme';

interface UnifiedButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function UnifiedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: UnifiedButtonProps) {
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getHeight = () => {
    switch (size) {
      case 'sm': return 40;
      case 'md': return 48;
      case 'lg': return 56;
      default: return 48;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm': return typography.size.sm;
      case 'md': return typography.size.md;
      case 'lg': return typography.size.lg;
      default: return typography.size.md;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return spacing.md;
      case 'md': return spacing.lg;
      case 'lg': return spacing.xl;
      default: return spacing.lg;
    }
  };

  if (variant === 'primary') {
    return (
      <AnimatedTouchable
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          animatedStyle,
          styles.button,
          {
            height: getHeight(),
            width: fullWidth ? '100%' : undefined,
            opacity: isDisabled ? 0.5 : 1,
          },
          style,
        ]}
        accessible={true}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[
            colors.accent,
            '#2563EB',
            colors.accentDark,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { borderRadius: radius.lg }]}
        >
          <View style={[styles.content, { paddingHorizontal: getPadding() }]}>
            {loading ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <>
                {icon && iconPosition === 'left' && (
                  <View style={styles.iconLeft}>{icon}</View>
                )}
                <Text
                  style={[
                    styles.text,
                    {
                      color: colors.textInverse,
                      fontSize: getFontSize(),
                      fontFamily: typography.family.semibold,
                    },
                    textStyle,
                  ]}
                >
                  {title}
                </Text>
                {icon && iconPosition === 'right' && (
                  <View style={styles.iconRight}>{icon}</View>
                )}
              </>
            )}
          </View>
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  if (variant === 'secondary') {
    return (
      <AnimatedTouchable
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          animatedStyle,
          {
            height: getHeight(),
            width: fullWidth ? '100%' : undefined,
            opacity: isDisabled ? 0.5 : 1,
          },
          style,
        ]}
        accessible={true}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        activeOpacity={0.85}
      >
        <BlurView
          intensity={18}
          tint="dark"
          style={[
            styles.secondaryButton,
            {
              borderRadius: radius.lg,
              height: getHeight(),
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.gradient, { borderRadius: radius.lg }]}
          >
            <View style={[styles.content, { paddingHorizontal: getPadding() }]}>
              {loading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  {icon && iconPosition === 'left' && (
                    <View style={styles.iconLeft}>{icon}</View>
                  )}
                  <Text
                    style={[
                      styles.text,
                      {
                        color: colors.text,
                        fontSize: getFontSize(),
                        fontFamily: typography.family.semibold,
                      },
                      textStyle,
                    ]}
                  >
                    {title}
                  </Text>
                  {icon && iconPosition === 'right' && (
                    <View style={styles.iconRight}>{icon}</View>
                  )}
                </>
              )}
            </View>
          </LinearGradient>
        </BlurView>
      </AnimatedTouchable>
    );
  }

  if (variant === 'destructive') {
    return (
      <AnimatedTouchable
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          animatedStyle,
          styles.button,
          {
            height: getHeight(),
            width: fullWidth ? '100%' : undefined,
            backgroundColor: colors.danger,
            opacity: isDisabled ? 0.5 : 1,
            borderRadius: radius.lg,
          },
          style,
        ]}
        accessible={true}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        activeOpacity={0.85}
      >
        <View style={[styles.content, { paddingHorizontal: getPadding() }]}>
          {loading ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <View style={styles.iconLeft}>{icon}</View>
              )}
              <Text
                style={[
                  styles.text,
                  {
                    color: colors.text,
                    fontSize: getFontSize(),
                    fontFamily: typography.family.semibold,
                  },
                  textStyle,
                ]}
              >
                {title}
              </Text>
              {icon && iconPosition === 'right' && (
                <View style={styles.iconRight}>{icon}</View>
              )}
            </>
          )}
        </View>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      testID={testID}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        animatedStyle,
        styles.ghostButton,
        {
          height: getHeight(),
          width: fullWidth ? '100%' : undefined,
          borderRadius: radius.lg,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
      accessible={true}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      activeOpacity={0.7}
    >
      <View style={[styles.content, { paddingHorizontal: getPadding() }]}>
        {loading ? (
          <ActivityIndicator color={colors.textSecondary} size="small" />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <View style={styles.iconLeft}>{icon}</View>
            )}
            <Text
              style={[
                styles.text,
                {
                  color: colors.textSecondary,
                  fontSize: getFontSize(),
                  fontFamily: typography.family.medium,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === 'right' && (
              <View style={styles.iconRight}>{icon}</View>
            )}
          </>
        )}
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  text: {
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
});
