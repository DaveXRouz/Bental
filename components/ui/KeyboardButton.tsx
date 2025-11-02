import React, { useState } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  Platform,
  View,
} from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { KeyboardNavigation } from '@/utils/accessibility';

interface KeyboardButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  fullWidth?: boolean;
  autoFocus?: boolean;
}

export function KeyboardButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
  fullWidth = false,
  autoFocus = false,
}: KeyboardButtonProps) {
  const { colors } = useThemeStore();
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const isDisabled = disabled || loading;

  const handlePress = async () => {
    if (isDisabled) return;
    const result = onPress();
    if (result instanceof Promise) {
      await result;
    }
  };

  const handleKeyDown = Platform.OS === 'web'
    ? (e: any) => {
        if (isDisabled) return;

        if (KeyboardNavigation.isEnterOrSpace(e)) {
          e.preventDefault();
          handlePress();
        }
      }
    : undefined;

  const getBackgroundColor = () => {
    if (isDisabled) return colors.surfaceHighlight;
    if (isPressed) {
      switch (variant) {
        case 'primary':
          return colors.primaryDark || colors.primary;
        case 'secondary':
          return colors.secondaryDark || colors.secondary;
        case 'destructive':
          return '#DC2626';
        case 'ghost':
          return 'rgba(59, 130, 246, 0.1)';
        default:
          return colors.primary;
      }
    }
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'destructive':
        return colors.error;
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (isDisabled) return colors.textTertiary;
    if (variant === 'ghost') return colors.primary;
    return colors.textInverse;
  };

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 36;
      case 'md':
        return 48;
      case 'lg':
        return 56;
      default:
        return 48;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return Typography.size.sm;
      case 'md':
        return Typography.size.md;
      case 'lg':
        return Typography.size.lg;
      default:
        return Typography.size.md;
    }
  };

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={isDisabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (loading ? `Loading, ${title}` : title)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      {...(Platform.OS === 'web' && {
        tabIndex: isDisabled ? -1 : 0,
        onKeyDown: handleKeyDown,
        onFocus: () => setIsFocused(true),
        onBlur: () => setIsFocused(false),
        autoFocus,
      })}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          height: getHeight(),
          borderColor: variant === 'ghost' ? colors.border : 'transparent',
          borderWidth: variant === 'ghost' ? 1 : 0,
          width: fullWidth ? '100%' : undefined,
        },
        isFocused && styles.focused,
        style,
      ]}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={getTextColor()} size="small" />
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: getFontSize(),
                marginLeft: Spacing.sm,
              },
            ]}
          >
            Loading
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: getFontSize(),
                fontFamily: Typography.family.semibold,
              },
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  focused: Platform.select({
    web: {
      outlineWidth: 2,
      outlineStyle: 'solid',
      outlineColor: '#3B82F6',
      outlineOffset: 2,
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    default: {},
  }),
});
