import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAccessibilityPreferences, getTouchTargetSize, FocusIndicator } from '@/utils/progressive-enhancement';

interface InclusiveButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export function InclusiveButton({
  onPress,
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  accessibilityLabel,
  accessibilityHint,
  testID,
}: InclusiveButtonProps) {
  const preferences = useAccessibilityPreferences();
  const [isFocused, setIsFocused] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const handlePress = () => {
    if (disabled || loading) return;

    if (Platform.OS !== 'web' && !preferences.reduceMotion) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }

    onPress();
  };

  const minTouchSize = getTouchTargetSize();
  const isDisabled = disabled || loading;

  const buttonStyles = [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    isFocused && (Platform.OS === 'web' ? styles.focusedWeb : styles.focusedNative),
    isPressed && !preferences.reduceMotion && styles.pressed,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    preferences.boldText && styles.boldText,
    isDisabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      disabled={isDisabled}
      style={[buttonStyles, { minHeight: minTouchSize.height }]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      testID={testID}
      activeOpacity={preferences.reduceMotion ? 0.7 : 0.85}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? '#FFFFFF' : '#3B82F6'}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <View style={styles.iconLeft}>{icon}</View>
            )}
            <Text style={textStyles}>{children}</Text>
            {icon && iconPosition === 'right' && (
              <View style={styles.iconRight}>{icon}</View>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#3B82F6',
  },
  tertiaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#3B82F6',
  },
  tertiaryText: {
    color: '#FFFFFF',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  boldText: {
    fontWeight: '700',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
  iconLeft: {
    marginRight: 4,
  },
  iconRight: {
    marginLeft: 4,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  focusedWeb: {
    outline: FocusIndicator.web.outline,
    outlineOffset: FocusIndicator.web.outlineOffset,
  } as any,
  focusedNative: {
    borderColor: FocusIndicator.native.borderColor,
    borderWidth: FocusIndicator.native.borderWidth,
    shadowColor: FocusIndicator.native.shadowColor,
    shadowOffset: FocusIndicator.native.shadowOffset,
    shadowOpacity: FocusIndicator.native.shadowOpacity,
    shadowRadius: FocusIndicator.native.shadowRadius,
    elevation: FocusIndicator.native.elevation,
  },
});
