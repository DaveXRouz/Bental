import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { spacing, typography } from '@/constants/theme';

interface GlassInputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  icon?: React.ReactNode;
  isPassword?: boolean;
}

export function GlassInput({
  label,
  value,
  onChangeText,
  error,
  icon,
  isPassword = false,
  onBlur,
  ...props
}: GlassInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = () => setIsFocused(true);

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={styles.wrapper}>
      <View style={[
        styles.container,
        isFocused && styles.containerFocused,
        error && styles.containerError
      ]}>
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}

          <View style={styles.inputWrapper}>
            {(isFocused || value) && (
              <Text style={[styles.label, error && styles.labelError]}>
                {label}
              </Text>
            )}

            <TextInput
              value={value}
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              secureTextEntry={isPassword && !showPassword}
              placeholder={!isFocused && !value ? label : props.placeholder}
              style={styles.input}
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              selectionColor="rgba(200, 200, 200, 0.5)"
              {...props}
            />
          </View>

          {isPassword && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? (
                <EyeOff size={19} color="rgba(255, 255, 255, 0.5)" />
              ) : (
                <Eye size={19} color="rgba(255, 255, 255, 0.5)" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 12,
  },
  container: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: 'rgba(26, 26, 28, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 52,
    transition: 'all 0.2s ease',
  },
  containerFocused: {
    borderColor: 'rgba(200, 200, 200, 0.3)',
    backgroundColor: 'rgba(26, 26, 28, 0.7)',
  },
  containerError: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    minHeight: 52,
  },
  iconContainer: {
    marginRight: spacing.sm,
    opacity: 0.7,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(200, 200, 200, 0.7)',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  labelError: {
    color: 'rgba(239, 68, 68, 0.9)',
  },
  input: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 0,
    minHeight: 22,
  },
  eyeIcon: {
    paddingHorizontal: spacing.xs,
    justifyContent: 'center',
  },
  errorText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: '#EF4444',
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
