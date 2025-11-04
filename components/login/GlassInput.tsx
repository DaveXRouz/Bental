import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Eye, EyeOff } from 'lucide-react-native';
import { spacing, typography, radius, colors } from '@/constants/theme';

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
  const focusAnimation = useSharedValue(0);
  const errorShake = useSharedValue(0);
  const borderGlow = useSharedValue(0);

  const handleFocus = () => {
    setIsFocused(true);
    focusAnimation.value = withSpring(1, {
      damping: 15,
      stiffness: 120,
    });
    borderGlow.value = withTiming(1, { duration: 300 });
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusAnimation.value = withSpring(0, {
      damping: 15,
      stiffness: 120,
    });
    borderGlow.value = withTiming(0, { duration: 300 });
    onBlur?.(e);
  };

  React.useEffect(() => {
    if (error) {
      errorShake.value = withSequence(
        withTiming(-8, { duration: 50, easing: Easing.linear }),
        withTiming(8, { duration: 50, easing: Easing.linear }),
        withTiming(-8, { duration: 50, easing: Easing.linear }),
        withTiming(8, { duration: 50, easing: Easing.linear }),
        withTiming(0, { duration: 50, easing: Easing.linear })
      );
    }
  }, [error]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: errorShake.value },
      { scale: withSpring(isFocused ? 1.01 : 1, { damping: 15 }) },
    ],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    opacity: withTiming(error ? 1 : borderGlow.value, { duration: 200 }),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withSpring(
          isFocused || value ? -8 : 0,
          { damping: 15, stiffness: 150 }
        ),
      },
      {
        scale: withSpring(
          isFocused || value ? 0.85 : 1,
          { damping: 15, stiffness: 150 }
        ),
      },
    ],
    color: error
      ? '#EF4444'
      : isFocused
      ? 'rgba(200, 200, 200, 0.95)'
      : 'rgba(255, 255, 255, 0.5)',
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.container, containerStyle]}>
        <BlurView intensity={50} tint="dark" style={styles.blur}>
          <LinearGradient
            colors={[
              error
                ? 'rgba(239, 68, 68, 0.08)'
                : 'rgba(25, 25, 35, 0.75)',
              error
                ? 'rgba(239, 68, 68, 0.05)'
                : 'rgba(18, 18, 28, 0.85)',
            ]}
            style={styles.backgroundGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          <Animated.View style={[styles.borderGlow, borderStyle]}>
            <LinearGradient
              colors={
                error
                  ? ['rgba(239, 68, 68, 0.6)', 'rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.6)']
                  : [
                      'rgba(255, 255, 255, 0.45)',
                      'rgba(220, 220, 220, 0.4)',
                      'rgba(200, 200, 200, 0.35)',
                      'rgba(255, 255, 255, 0.45)',
                    ]
              }
              style={styles.borderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>

          <View style={styles.content}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}

            <View style={styles.inputWrapper}>
              <Animated.Text style={[styles.label, labelStyle]}>
                {label}
              </Animated.Text>

              <TextInput
                value={value}
                onChangeText={onChangeText}
                onFocus={handleFocus}
                onBlur={handleBlur}
                secureTextEntry={isPassword && !showPassword}
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
                  <EyeOff size={20} color="rgba(255, 255, 255, 0.5)" />
                ) : (
                  <Eye size={20} color="rgba(255, 255, 255, 0.5)" />
                )}
              </TouchableOpacity>
            )}
          </View>

          {isFocused && (
            <View style={styles.shimmer}>
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(255, 255, 255, 0.1)',
                  'transparent',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmerGradient}
              />
            </View>
          )}
        </BlurView>
      </Animated.View>

      {error && (
        <Animated.View
          entering={withSpring}
          style={styles.errorContainer}
        >
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.08)']}
            style={styles.errorBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: spacing.md,
  },
  container: {
    width: '100%',
    borderRadius: radius.md,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  blur: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  borderGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  borderGradient: {
    flex: 1,
    borderRadius: radius.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    minHeight: 60,
  },
  iconContainer: {
    marginRight: spacing.sm,
    opacity: 0.7,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    paddingTop: spacing.md,
  },
  label: {
    position: 'absolute',
    left: 0,
    top: spacing.md + 4,
    fontSize: typography.size.sm,
    fontWeight: '600',
    letterSpacing: 0.3,
    transformOrigin: 'left center',
  },
  input: {
    fontSize: typography.size.md,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    paddingHorizontal: 0,
    letterSpacing: 0.3,
    marginTop: spacing.xs,
  },
  eyeIcon: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: radius.md,
  },
  shimmerGradient: {
    flex: 1,
  },
  errorContainer: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  errorBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  errorText: {
    fontSize: typography.size.xs,
    color: '#EF4444',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
