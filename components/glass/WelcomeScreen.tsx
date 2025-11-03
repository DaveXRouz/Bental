import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ParallaxBackground } from './ParallaxBackground';
import { Typography, BorderRadius, Spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onContinue?: () => void;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
}

export function WelcomeScreen({
  onContinue,
  autoAdvance = false,
  autoAdvanceDelay = 3000,
}: WelcomeScreenProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  const containerOpacity = useSharedValue(0);
  const containerScale = useSharedValue(0.9);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);

  useEffect(() => {
    const checkReduceMotion = async () => {
      if (Platform.OS !== 'web') {
        const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        setReduceMotion(isReduceMotionEnabled);
      }
    };
    checkReduceMotion();
  }, []);

  useEffect(() => {
    containerOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    containerScale.value = withTiming(1, {
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    titleOpacity.value = withDelay(
      200,
      withTiming(1, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    titleTranslateY.value = withDelay(
      200,
      withTiming(0, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    subtitleOpacity.value = withDelay(
      500,
      withTiming(1, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    subtitleTranslateY.value = withDelay(
      500,
      withTiming(0, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    buttonOpacity.value = withDelay(
      800,
      withTiming(1, {
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    buttonScale.value = withDelay(
      800,
      withSequence(
        withTiming(1.05, {
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        withTiming(1, {
          duration: 200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      )
    );

    if (autoAdvance && onContinue) {
      const timer = setTimeout(() => {
        onContinue();
      }, autoAdvanceDelay);
      return () => clearTimeout(timer);
    }
  }, [autoAdvance, autoAdvanceDelay, onContinue]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const handleContinue = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onContinue) {
      onContinue();
    }
  };

  return (
    <View style={styles.container}>
      <ParallaxBackground reduceMotion={reduceMotion} />

      <View style={styles.content}>
        <Animated.View style={[styles.glassContainer, containerStyle]}>
          <BlurView intensity={20} tint="dark" style={styles.blur}>
            <View style={styles.innerContent}>
              <Animated.View style={titleStyle}>
                <Text
                  style={styles.title}
                  accessibilityRole="header"
                  accessibilityLabel="Welcome back! It's a game."
                >
                  Welcome back!{'\n'}It's a game.
                </Text>
              </Animated.View>

              <Animated.View style={subtitleStyle}>
                <Text
                  style={styles.subtitle}
                  accessibilityLabel="Your journey to mastery begins here"
                >
                  Your journey to mastery begins here
                </Text>
              </Animated.View>

              {!autoAdvance && (
                <Animated.View style={buttonStyle}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Get Started"
                    accessibilityHint="Tap to continue to the app"
                  >
                    <BlurView intensity={10} tint="light" style={styles.buttonBlur}>
                      <Text style={styles.buttonText}>Get Started</Text>
                    </BlurView>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          </BlurView>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  glassContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 24,
  },
  blur: {
    paddingVertical: Spacing.xxxxl + 8,
    paddingHorizontal: Spacing.xxxl,
  },
  innerContent: {
    alignItems: 'center',
    gap: Spacing.xxl,
  },
  title: {
    fontSize: 40,
    fontFamily: Typography.family.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1.2,
    lineHeight: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.family.regular,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  button: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonBlur: {
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  buttonText: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.family.semibold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
});
