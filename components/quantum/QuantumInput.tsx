import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  QuantumColors,
  QuantumGlass,
  QuantumRadius,
  QuantumAnimation,
  QuantumTypography,
  QuantumGlow,
} from '@/constants/quantum-glass';

interface QuantumInputProps extends TextInputProps {
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  error?: string;
  success?: boolean;
}

export function QuantumInput({
  icon,
  rightIcon,
  onRightIconPress,
  error,
  success,
  ...textInputProps
}: QuantumInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusWidth = useSharedValue(0);
  const focusOpacity = useSharedValue(0);

  const getBorderColor = () => {
    if (error) return 'rgba(255, 77, 77, 0.5)';
    if (success) return 'rgba(25, 195, 125, 0.5)';
    if (isFocused) return 'rgba(0, 245, 212, 0.4)';
    return 'rgba(255,255,255,0.12)';
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    focusWidth.value = withTiming(2, {
      duration: QuantumAnimation.timing.focus,
      easing: Easing.bezier(...QuantumAnimation.curve),
    });
    focusOpacity.value = withTiming(1, {
      duration: QuantumAnimation.timing.focus,
      easing: Easing.bezier(...QuantumAnimation.curve),
    });
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusWidth.value = withTiming(0, {
      duration: QuantumAnimation.timing.focus,
      easing: Easing.bezier(...QuantumAnimation.curve),
    });
    focusOpacity.value = withTiming(0, {
      duration: QuantumAnimation.timing.focus,
      easing: Easing.bezier(...QuantumAnimation.curve),
    });
  };

  const focusRingStyle = useAnimatedStyle(() => ({
    borderWidth: focusWidth.value,
    opacity: focusOpacity.value,
  }));

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <BlurView intensity={18} tint="dark" style={[styles.blurContainer, { borderColor: getBorderColor() }]}>
          <LinearGradient
            colors={isFocused
              ? ['rgba(0, 245, 212, 0.12)', 'rgba(120, 220, 255, 0.08)']
              : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.92)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.innerShadow} />

            <View style={styles.content}>
              {icon && <View style={styles.iconContainer}>{icon}</View>}

              <TextInput
                {...textInputProps}
                style={[styles.input, textInputProps.style]}
                placeholderTextColor="rgba(11, 22, 33, 0.45)"
                onFocus={(e) => {
                  handleFocus();
                  textInputProps.onFocus?.(e);
                }}
                onBlur={(e) => {
                  handleBlur();
                  textInputProps.onBlur?.(e);
                }}
              />

              {rightIcon && (
                <TouchableOpacity
                  onPress={onRightIconPress}
                  style={styles.rightIconContainer}
                  activeOpacity={0.7}
                >
                  {rightIcon}
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </BlurView>

        <Animated.View style={[styles.focusRing, focusRingStyle]} pointerEvents="none">
          <LinearGradient
            colors={error ? ['rgba(255, 77, 77, 0.4)', 'rgba(255, 77, 77, 0.2)'] : [QuantumGlow.focus.colors[0], QuantumGlow.focus.colors[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.focusGradient}
          />
        </Animated.View>

        {isFocused && !error && (
          <View style={styles.innerRing} pointerEvents="none">
            <View style={styles.innerRingBorder} />
          </View>
        )}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  container: {
    position: 'relative',
    height: 52,
  },
  blurContainer: {
    flex: 1,
    borderRadius: QuantumRadius.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: 'rgba(0, 245, 212, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  gradient: {
    flex: 1,
    borderRadius: QuantumRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderRadius: QuantumRadius.md,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 2,
    zIndex: 1,
  },
  iconContainer: {
    marginRight: 12,
    opacity: 0.65,
    zIndex: 2,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0B1621',
    fontFamily: QuantumTypography.family.medium,
    fontWeight: '500',
    zIndex: 2,
    height: 48,
    paddingVertical: 0,
    letterSpacing: 0.2,
  },
  rightIconContainer: {
    padding: 8,
    marginLeft: 4,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: QuantumRadius.md,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 245, 212, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  focusGradient: {
    flex: 1,
    borderRadius: QuantumRadius.md,
  },
  innerRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: QuantumRadius.md,
    padding: 2,
    pointerEvents: 'none',
  },
  innerRingBorder: {
    flex: 1,
    borderRadius: QuantumRadius.md - 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontFamily: QuantumTypography.family.medium,
    marginTop: 6,
    marginLeft: 4,
    letterSpacing: 0.1,
  },
});
