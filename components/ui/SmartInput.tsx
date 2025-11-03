import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react-native';
import { colors, radius } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { formatters, validators, placeholders } from '@/utils/input-formatters';

type InputType =
  | 'text'
  | 'email'
  | 'phone'
  | 'card-number'
  | 'card-expiry'
  | 'cvv'
  | 'ssn'
  | 'amount'
  | 'percentage'
  | 'zip'
  | 'routing'
  | 'account'
  | 'password';

interface SmartInputProps extends Omit<TextInputProps, 'onChange'> {
  label: string;
  type?: InputType;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  icon?: React.ComponentType<any>;
  autoValidate?: boolean;
  showValidIcon?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export function SmartInput({
  label,
  type = 'text',
  value,
  onChangeText,
  error,
  hint,
  required = false,
  icon: Icon,
  autoValidate = true,
  showValidIcon = true,
  onValidationChange,
  ...textInputProps
}: SmartInputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (autoValidate && value && touched) {
      const valid = validateInput(value);
      setIsValid(valid);
      onValidationChange?.(valid);
    }
  }, [value, touched, autoValidate]);

  const getKeyboardType = (): TextInputProps['keyboardType'] => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'phone':
      case 'card-number':
      case 'card-expiry':
      case 'cvv':
      case 'ssn':
      case 'amount':
      case 'zip':
      case 'routing':
      case 'account':
        return 'number-pad';
      case 'percentage':
        return 'decimal-pad';
      default:
        return 'default';
    }
  };

  const getPlaceholder = (): string => {
    if (textInputProps.placeholder) return textInputProps.placeholder;

    switch (type) {
      case 'phone':
        return placeholders.phone;
      case 'email':
        return placeholders.email;
      case 'card-number':
        return placeholders.cardNumber;
      case 'card-expiry':
        return placeholders.cardExpiry;
      case 'cvv':
        return placeholders.cvv;
      case 'ssn':
        return placeholders.ssn;
      case 'amount':
        return placeholders.amount;
      case 'zip':
        return placeholders.zipCode;
      case 'routing':
        return placeholders.routingNumber;
      case 'account':
        return placeholders.accountNumber;
      default:
        return `Enter ${label.toLowerCase()}`;
    }
  };

  const formatValue = (text: string): string => {
    switch (type) {
      case 'phone':
        return formatters.phone(text);
      case 'card-number':
        return formatters.cardNumber(text);
      case 'card-expiry':
        return formatters.cardExpiry(text);
      case 'cvv':
        return text.replace(/\D/g, '').slice(0, 4);
      case 'ssn':
        return formatters.ssn(text);
      case 'amount':
        return formatters.currency(text);
      case 'percentage':
        return formatters.percentage(text);
      case 'zip':
        return formatters.zipCode(text);
      case 'routing':
        return formatters.routingNumber(text);
      case 'account':
        return formatters.accountNumber(text);
      default:
        return text;
    }
  };

  const validateInput = (text: string): boolean => {
    if (!text && !required) return true;
    if (!text && required) return false;

    switch (type) {
      case 'phone':
        return validators.phone(text);
      case 'email':
        return validators.email(text);
      case 'card-number':
        return validators.cardNumber(text);
      case 'card-expiry':
        return validators.cardExpiry(text);
      case 'cvv':
        return validators.cvv(text);
      case 'ssn':
        return validators.ssn(text);
      case 'zip':
        return validators.zipCode(text);
      case 'routing':
        return validators.routingNumber(text);
      case 'amount':
        return parseFloat(text) > 0;
      case 'percentage':
        const num = parseFloat(text);
        return num >= 0 && num <= 100;
      default:
        return text.length > 0;
    }
  };

  const handleChange = (text: string) => {
    const formatted = formatValue(text);
    onChangeText(formatted);
  };

  const handleBlur = () => {
    setFocused(false);
    setTouched(true);
    if (textInputProps.onBlur) {
      textInputProps.onBlur({} as any);
    }
  };

  const showError = error && touched;
  const showValid = showValidIcon && isValid && value && touched && !error;
  const isPassword = type === 'password';

  return (
    <View style={styles.container} accessible={false}>
      <View style={styles.labelRow}>
        <Text style={styles.label} accessibilityRole="text">
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {hint && !showError && (
          <Text style={styles.hint}>{hint}</Text>
        )}
      </View>

      <BlurView
        intensity={60}
        tint="dark"
        style={[
          styles.inputWrapper,
          focused && styles.inputWrapperFocused,
          showError && styles.inputWrapperError,
          showValid && styles.inputWrapperValid,
        ]}
        accessible={false}
      >
        {Icon && (
          <Icon
            size={20}
            color={
              showError
                ? '#EF4444'
                : showValid
                ? '#10B981'
                : focused
                ? colors.text
                : colors.textMuted
            }
            style={styles.icon}
          />
        )}

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder={getPlaceholder()}
          placeholderTextColor={colors.textMuted}
          keyboardType={getKeyboardType()}
          autoCapitalize={type === 'email' ? 'none' : textInputProps.autoCapitalize}
          secureTextEntry={isPassword && !showPassword}
          accessible={true}
          accessibilityLabel={label}
          accessibilityHint={hint || `Enter ${label.toLowerCase()}`}
          accessibilityRequired={required}
          accessibilityState={{
            disabled: textInputProps.disabled || false,
          }}
          {...textInputProps}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityHint="Toggles password visibility"
          >
            {showPassword ? (
              <EyeOff size={20} color={colors.textSecondary} />
            ) : (
              <Eye size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}

        {showValid && (
          <Check size={20} color="#10B981" style={styles.validIcon} />
        )}

        {showError && (
          <AlertCircle size={20} color="#EF4444" style={styles.errorIcon} />
        )}
      </BlurView>

      {showError && (
        <View
          style={styles.errorContainer}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  required: {
    color: '#EF4444',
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: GLASS.border,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  inputWrapperError: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  inputWrapperValid: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  validIcon: {
    marginLeft: 8,
  },
  errorIcon: {
    marginLeft: 8,
  },
  errorContainer: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
  },
});
