import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useThemeStore } from '@/stores/useThemeStore';
import { BorderRadius, Spacing } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonProps) {
  const { colors } = useThemeStore();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(opacity.value, [0.3, 1], [0.3, 1]),
    };
  });

  const containerStyle: ViewStyle = {
    width: width as any,
    height,
    borderRadius,
    backgroundColor: colors.surfaceHighlight,
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        containerStyle,
        animatedStyle,
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.skeletonRow1}>
        <Skeleton height={16} width="40%" />
      </View>
      <View style={styles.skeletonRow2}>
        <Skeleton height={32} width="60%" />
      </View>
      <Skeleton height={40} />
    </View>
  );
}

export function ListItemSkeleton() {
  return (
    <View style={styles.listItemSkeleton}>
      <View style={styles.skeletonAvatar}>
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonRow1}>
          <Skeleton height={16} width="70%" />
        </View>
        <Skeleton height={12} width="40%" />
      </View>
      <Skeleton width={60} height={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {},
  cardSkeleton: {
    padding: Spacing.md,
  },
  skeletonRow1: {
    marginBottom: Spacing.sm,
  },
  skeletonRow2: {
    marginBottom: Spacing.md,
  },
  listItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  skeletonAvatar: {
    marginRight: Spacing.md,
  },
  skeletonContent: {
    flex: 1,
  },
});
