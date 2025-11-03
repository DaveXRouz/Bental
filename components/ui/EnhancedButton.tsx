import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

interface EnhancedButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'social';
  icon?: React.ReactNode;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function EnhancedButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  icon,
}: EnhancedButtonProps) {
  const scale = useSharedValue(1);
  const shimmer = useSharedValue(0);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getGradientColors = () => {
    switch (variant) {
      case 'primary':
        return ['#00F5D4', '#60FFDA', '#78DCFF'];
      case 'secondary':
        return ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)'];
      case 'social':
        return ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)'];
      default:
        return ['#60FFDA', '#78DCFF'];
    }
  };

  const getTextColor = () => {
    return variant === 'primary' ? '#0B1621' : '#FFFFFF';
  };

  if (variant === 'social') {
    return (
      <AnimatedTouchable
        style={[styles.socialButton, animatedStyle, disabled && styles.disabled]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.85}
      >
        <BlurView intensity={20} tint="dark" style={styles.socialBlur}>
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.socialGradient}
          >
            <View style={styles.socialContent}>
              {icon}
              <Text style={[styles.socialText, { color: getTextColor() }]}>{title}</Text>
            </View>
          </LinearGradient>
        </BlurView>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      style={[styles.button, animatedStyle, disabled && styles.disabled]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.contentWrapper}>
          {loading ? (
            <ActivityIndicator color={getTextColor()} size="small" />
          ) : (
            <>
              {icon && <View style={styles.iconWrapper}>{icon}</View>}
              <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
            </>
          )}
        </View>

        {variant === 'primary' && (
          <View style={styles.shimmerContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmer}
            />
          </View>
        )}
      </LinearGradient>

      {variant === 'primary' && (
        <View style={styles.glowContainer}>
          <LinearGradient
            colors={['rgba(96, 255, 218, 0.4)', 'rgba(120, 220, 255, 0.3)']}
            style={styles.glow}
          />
        </View>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'visible',
    marginVertical: 8,
    shadowColor: 'rgba(96, 255, 218, 0.45)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  gradient: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconWrapper: {
    marginRight: 4,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 16,
  },
  shimmer: {
    position: 'absolute',
    width: '30%',
    height: '100%',
    left: '-30%',
  },
  glowContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    top: 0,
    left: 0,
    zIndex: -1,
  },
  glow: {
    flex: 1,
    borderRadius: 16,
    transform: [{ scale: 1.02 }],
  },
  disabled: {
    opacity: 0.5,
  },
  socialButton: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: 'rgba(255, 255, 255, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  socialBlur: {
    flex: 1,
  },
  socialGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
