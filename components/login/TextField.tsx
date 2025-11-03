import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Animated,
} from 'react-native';
import { theme } from '@/constants/theme';

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
      error ? theme.colors.error : theme.colors.stroke,
      error ? theme.colors.error : theme.colors.strokeFocus,
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
          placeholderTextColor={theme.colors.placeholder}
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
    marginBottom: theme.spacing(2),
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.text,
    marginBottom: theme.spacing(1),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    paddingHorizontal: theme.spacing(2),
  },
  inputContainerFocused: {
    ...theme.shadows.glow,
  },
  iconContainer: {
    marginRight: theme.spacing(1.5),
  },
  rightIconContainer: {
    marginLeft: theme.spacing(1),
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    height: '100%',
  },
  error: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginTop: theme.spacing(0.5),
  },
});
