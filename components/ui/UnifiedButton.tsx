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
import { DesignSystem } from '@/constants/design-system';

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
      case 'sm': return DesignSystem.typography.fontSize.sm;
      case 'md': return DesignSystem.typography.fontSize.base;
      case 'lg': return DesignSystem.typography.fontSize.md;
      default: return DesignSystem.typography.fontSize.base;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return DesignSystem.spacing[3];
      case 'md': return DesignSystem.spacing[4];
      case 'lg': return DesignSystem.spacing[6];
      default: return DesignSystem.spacing[4];
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
            DesignSystem.colors.brand.primary,
            DesignSystem.colors.brand.tertiary,
            DesignSystem.colors.brand.secondary,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { borderRadius: DesignSystem.borderRadius.lg }]}
        >
          <View style={[styles.content, { paddingHorizontal: getPadding() }]}>
            {loading ? (
              <ActivityIndicator color={DesignSystem.colors.text.inverse} size="small" />
            ) : (
              <>
                {icon && iconPosition === 'left' && (
                  <View style={styles.iconLeft}>{icon}</View>
                )}
                <Text
                  style={[
                    styles.text,
                    {
                      color: DesignSystem.colors.text.inverse,
                      fontSize: getFontSize(),
                      fontFamily: DesignSystem.typography.fontFamily.semibold,
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
              borderRadius: DesignSystem.borderRadius.lg,
              height: getHeight(),
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.gradient, { borderRadius: DesignSystem.borderRadius.lg }]}
          >
            <View style={[styles.content, { paddingHorizontal: getPadding() }]}>
              {loading ? (
                <ActivityIndicator color={DesignSystem.colors.text.primary} size="small" />
              ) : (
                <>
                  {icon && iconPosition === 'left' && (
                    <View style={styles.iconLeft}>{icon}</View>
                  )}
                  <Text
                    style={[
                      styles.text,
                      {
                        color: DesignSystem.colors.text.primary,
                        fontSize: getFontSize(),
                        fontFamily: DesignSystem.typography.fontFamily.semibold,
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
            backgroundColor: DesignSystem.colors.semantic.error,
            opacity: isDisabled ? 0.5 : 1,
            borderRadius: DesignSystem.borderRadius.lg,
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
            <ActivityIndicator color={DesignSystem.colors.text.primary} size="small" />
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <View style={styles.iconLeft}>{icon}</View>
              )}
              <Text
                style={[
                  styles.text,
                  {
                    color: DesignSystem.colors.text.primary,
                    fontSize: getFontSize(),
                    fontFamily: DesignSystem.typography.fontFamily.semibold,
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
          borderRadius: DesignSystem.borderRadius.lg,
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
          <ActivityIndicator color={DesignSystem.colors.text.secondary} size="small" />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <View style={styles.iconLeft}>{icon}</View>
            )}
            <Text
              style={[
                styles.text,
                {
                  color: DesignSystem.colors.text.secondary,
                  fontSize: getFontSize(),
                  fontFamily: DesignSystem.typography.fontFamily.medium,
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
    ...DesignSystem.shadows.lg,
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
    gap: DesignSystem.spacing[2],
  },
  text: {
    textAlign: 'center',
    letterSpacing: DesignSystem.typography.letterSpacing.wide,
  },
  secondaryButton: {
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: DesignSystem.colors.border.default,
    ...DesignSystem.shadows.sm,
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.subtle,
  },
  iconLeft: {
    marginRight: DesignSystem.spacing[1],
  },
  iconRight: {
    marginLeft: DesignSystem.spacing[1],
  },
});
