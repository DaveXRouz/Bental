import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { TextField } from './TextField';
import { theme } from '@/theme';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  onBlur?: () => void;
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
            <Eye size={20} color={theme.colors.textSecondary} />
          ) : (
            <EyeOff size={20} color={theme.colors.textSecondary} />
          )}
        </TouchableOpacity>
      }
    />
  );
}

const styles = StyleSheet.create({
  eyeButton: {
    padding: theme.spacing(1),
    marginLeft: theme.spacing(1),
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
