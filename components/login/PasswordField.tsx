import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { TextField } from './TextField';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  onBlur?: () => void;
  showStrength?: boolean;
  editable?: boolean;
}

export function PasswordField({
  icon,
  ...props
}: PasswordFieldProps) {
  const [isSecure, setIsSecure] = useState(true);

  return (
    <TextField
      {...props}
      secureTextEntry={isSecure}
      textContentType="password"
      autoCapitalize="none"
      autoCorrect={false}
      icon={icon}
      rightIcon={
        <TouchableOpacity
          onPress={() => setIsSecure(!isSecure)}
          style={styles.eyeButton}
          accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
          accessibilityRole="button"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isSecure ? (
            <Eye size={20} color="rgba(255, 255, 255, 0.7)" />
          ) : (
            <EyeOff size={20} color="rgba(255, 255, 255, 0.7)" />
          )}
        </TouchableOpacity>
      }
    />
  );
}

const styles = StyleSheet.create({
  eyeButton: {
    padding: spacing.md,
    marginLeft: spacing.md,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
