import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Animated,
} from 'react-native';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
}

export function TextField({
  label,
  icon,
  rightIcon,
  error,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = new Animated.Value(0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 120,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 120,
      useNativeDriver: false,
    }).start();
    onBlur?.(e);
  };

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? colors.danger : colors.border,
      error ? colors.danger : colors.accent,
    ],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor },
          isFocused && !error && styles.inputContainerFocused,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </Animated.View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: '#b0b0b0',
    marginBottom: spacing.xs + 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: 'rgba(40, 40, 40, 0.6)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.25)',
    paddingHorizontal: spacing.md,
  },
  inputContainerFocused: {
    ...shadows.md,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  rightIconContainer: {
    marginLeft: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.size.sm,
    fontFamily: typography.family.regular,
    color: '#d0d0d0',
    height: '100%',
  },
  error: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.regular,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
