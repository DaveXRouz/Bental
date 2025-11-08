import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, radius } from '@/constants/theme';

interface KeyboardButtonProps {
  value: string;
  onPress: (value: string) => void;
  variant?: 'default' | 'backspace' | 'submit';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function KeyboardButton({
  value,
  onPress,
  variant = 'default',
  disabled = false,
  style,
  textStyle,
}: KeyboardButtonProps) {
  const handlePress = () => {
    if (!disabled) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress(value);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'backspace' && styles.backspaceButton,
        variant === 'submit' && styles.submitButton,
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={value}
    >
      <Text
        style={[
          styles.text,
          variant === 'submit' && styles.submitText,
          disabled && styles.disabledText,
          textStyle,
        ]}
      >
        {value}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 72,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: spacing.xs,
    marginVertical: spacing.xs,
  },
  backspaceButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  submitButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.semibold,
    color: colors.white,
  },
  submitText: {
    color: colors.info,
  },
  disabledText: {
    color: colors.textMuted,
  },
});
