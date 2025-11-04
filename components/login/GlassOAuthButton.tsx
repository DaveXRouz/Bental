import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { spacing, typography, radius } from '@/constants/theme';

interface GlassOAuthButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
}

export function GlassOAuthButton({ onPress, icon, label }: GlassOAuthButtonProps) {
  const scale = useSharedValue(1);
  const elevation = useSharedValue(0);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
    elevation.value = withTiming(0, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    elevation.value = withTiming(1, { duration: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { perspective: 1000 },
    ],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: withTiming(elevation.value * 0.4, { duration: 200 }),
    elevation: elevation.value * 8,
  }));

  return (
    <Animated.View style={[styles.container, shadowStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityLabel={`Sign in with ${label}`}
        accessibilityRole="button"
        style={styles.touchable}
      >
        <Animated.View style={animatedStyle}>
          <BlurView intensity={40} tint="dark" style={styles.blur}>
            <LinearGradient
              colors={[
                'rgba(30, 30, 40, 0.75)',
                'rgba(22, 22, 32, 0.85)',
                'rgba(18, 18, 28, 0.90)',
              ]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />

            <View style={styles.topGloss}>
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.15)',
                  'rgba(255, 255, 255, 0.05)',
                  'transparent',
                ]}
                style={styles.glossGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            </View>

            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <View style={styles.iconGlow}>
                  <LinearGradient
                    colors={[
                      'rgba(220, 220, 225, 0.1)',
                      'rgba(200, 200, 205, 0.08)',
                      'transparent',
                    ]}
                    style={styles.iconGlowGradient}
                  />
                </View>
                {icon}
              </View>
              <Text style={styles.label}>{label}</Text>
            </View>

            <View style={styles.border}>
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.2)',
                  'rgba(220, 220, 220, 0.18)',
                  'rgba(200, 200, 200, 0.15)',
                  'rgba(255, 255, 255, 0.2)',
                ]}
                style={styles.borderGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </BlurView>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.md,
    shadowColor: 'rgba(255, 255, 255, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  touchable: {
    flex: 1,
  },
  blur: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    borderRadius: radius.md,
  },
  topGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    overflow: 'hidden',
  },
  glossGradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm + 2,
  },
  iconContainer: {
    position: 'relative',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  iconGlowGradient: {
    flex: 1,
  },
  label: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  borderGradient: {
    flex: 1,
    borderRadius: radius.md,
  },
});
