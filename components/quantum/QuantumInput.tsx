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
}

export function QuantumInput({
  icon,
  rightIcon,
  onRightIconPress,
  ...textInputProps
}: QuantumInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusWidth = useSharedValue(0);
  const focusOpacity = useSharedValue(0);

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
    <View style={styles.container}>
      <BlurView intensity={18} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
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
              placeholderTextColor={QuantumColors.mistWhite}
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
          colors={[QuantumGlow.focus.colors[0], QuantumGlow.focus.colors[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.focusGradient}
        />
      </Animated.View>

      {isFocused && (
        <View style={styles.innerRing} pointerEvents="none">
          <View style={styles.innerRingBorder} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 58,
    marginBottom: 16,
  },
  blurContainer: {
    flex: 1,
    borderRadius: QuantumRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  gradient: {
    flex: 1,
    borderRadius: QuantumRadius.md,
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: QuantumRadius.md,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginRight: 12,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: QuantumTypography.size.body,
    color: '#FFFFFF',
    fontFamily: QuantumTypography.family.body,
    fontWeight: '500',
  },
  rightIconContainer: {
    padding: 8,
    marginLeft: 4,
  },
  focusRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: QuantumRadius.md,
    overflow: 'hidden',
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
    borderColor: 'rgba(255,255,255,0.4)',
  },
});
