import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { GLASS } from '@/constants/glass';
import { useThemeStore } from '@/stores/useThemeStore';

interface GlassSkeletonProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  borderRadius?: number;
}

export function GlassSkeleton({
  width = '100%',
  height = 20,
  style,
  borderRadius = 8,
}: GlassSkeletonProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.ease }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + shimmer.value * 0.4,
  }));

  const containerStyle: ViewStyle = {
    width: width as any,
    height,
    borderRadius,
  };

  return (
    <View style={[containerStyle, style]}>
      <BlurView
        intensity={10}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.blur, { borderRadius }]}
      >
        <Animated.View
          style={[
            styles.shimmer,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              borderRadius,
            },
            animatedStyle,
          ]}
        />
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  blur: {
    flex: 1,
    overflow: 'hidden',
  },
  shimmer: {
    flex: 1,
  },
});
