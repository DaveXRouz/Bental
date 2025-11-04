import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  animated?: boolean;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = radius.sm,
  style,
  animated = true,
}: SkeletonProps) {
  const translateX = useSharedValue(-1);

  React.useEffect(() => {
    if (animated) {
      translateX.value = withRepeat(
        withTiming(1, {
          duration: 1500,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 200 }],
  }));

  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
      ]}
    >
      {animated && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.0)',
              'rgba(255, 255, 255, 0.08)',
              'rgba(255, 255, 255, 0.0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

export function CardSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <Skeleton width="60%" height={24} borderRadius={radius.md} />
      <Skeleton width="100%" height={16} borderRadius={radius.sm} style={{ marginTop: spacing.sm }} />
      <Skeleton width="80%" height={16} borderRadius={radius.sm} style={{ marginTop: spacing.xs }} />
      <View style={styles.row}>
        <Skeleton width={60} height={32} borderRadius={radius.md} />
        <Skeleton width={60} height={32} borderRadius={radius.md} />
      </View>
    </View>
  );
}

export function ListItemSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.listItem, style]}>
      <Skeleton width={48} height={48} borderRadius={radius.lg} />
      <View style={styles.listItemContent}>
        <Skeleton width="70%" height={18} borderRadius={radius.sm} />
        <Skeleton width="40%" height={14} borderRadius={radius.sm} style={{ marginTop: spacing.xs }} />
      </View>
      <Skeleton width={60} height={24} borderRadius={radius.md} />
    </View>
  );
}

export function ChartSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.chart, style]}>
      <Skeleton width="100%" height={200} borderRadius={radius.lg} />
      <View style={styles.chartLegend}>
        <Skeleton width={80} height={16} borderRadius={radius.sm} />
        <Skeleton width={80} height={16} borderRadius={radius.sm} />
        <Skeleton width={80} height={16} borderRadius={radius.sm} />
      </View>
    </View>
  );
}

export function PortfolioSkeleton() {
  return (
    <View style={styles.portfolio}>
      {/* Balance Hero Skeleton */}
      <View style={styles.hero}>
        <Skeleton width={100} height={14} borderRadius={radius.sm} />
        <Skeleton width={200} height={40} borderRadius={radius.md} style={{ marginTop: spacing.sm }} />
        <Skeleton width={120} height={20} borderRadius={radius.sm} style={{ marginTop: spacing.xs }} />
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.statCard}>
            <Skeleton width="100%" height={12} borderRadius={radius.sm} />
            <Skeleton width="80%" height={24} borderRadius={radius.md} style={{ marginTop: spacing.sm }} />
          </View>
        ))}
      </View>

      {/* Chart */}
      <ChartSkeleton style={{ marginTop: spacing.lg }} />

      {/* Holdings List */}
      <View style={{ marginTop: spacing.lg }}>
        {[1, 2, 3].map((i) => (
          <ListItemSkeleton key={i} style={{ marginBottom: spacing.md }} />
        ))}
      </View>
    </View>
  );
}

export function BotMarketplaceSkeleton() {
  return (
    <View style={styles.marketplace}>
      {/* Header */}
      <Skeleton width="60%" height={28} borderRadius={radius.md} />
      <Skeleton width="100%" height={16} borderRadius={radius.sm} style={{ marginTop: spacing.sm }} />

      {/* Featured Bot */}
      <View style={[styles.card, { marginTop: spacing.lg }]}>
        <View style={styles.row}>
          <Skeleton width={56} height={56} borderRadius={radius.xl} />
          <View style={{ flex: 1 }}>
            <Skeleton width="70%" height={20} borderRadius={radius.md} />
            <Skeleton width="50%" height={14} borderRadius={radius.sm} style={{ marginTop: spacing.xs }} />
          </View>
        </View>
        <Skeleton width="100%" height={80} borderRadius={radius.lg} style={{ marginTop: spacing.md }} />
        <Skeleton width="100%" height={44} borderRadius={radius.lg} style={{ marginTop: spacing.md }} />
      </View>

      {/* Bot Grid */}
      <View style={styles.grid}>
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} style={{ flex: 1 }} />
        ))}
      </View>
    </View>
  );
}

export function NewsSkeleton() {
  return (
    <View>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.newsItem, { marginBottom: spacing.md }]}>
          <Skeleton width="100%" height={160} borderRadius={radius.lg} />
          <View style={{ padding: spacing.md }}>
            <Skeleton width="100%" height={20} borderRadius={radius.md} />
            <Skeleton width="100%" height={16} borderRadius={radius.sm} style={{ marginTop: spacing.sm }} />
            <Skeleton width="70%" height={16} borderRadius={radius.sm} style={{ marginTop: spacing.xs }} />
            <View style={[styles.row, { marginTop: spacing.md }]}>
              <Skeleton width={80} height={14} borderRadius={radius.sm} />
              <Skeleton width={80} height={14} borderRadius={radius.sm} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  card: {
    padding: spacing.lg,
    backgroundColor: 'rgba(20, 20, 22, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: 'rgba(20, 20, 22, 0.6)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  listItemContent: {
    flex: 1,
  },
  chart: {
    padding: spacing.lg,
    backgroundColor: 'rgba(20, 20, 22, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  portfolio: {
    padding: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(20, 20, 22, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    backgroundColor: 'rgba(20, 20, 22, 0.6)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  marketplace: {
    padding: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  newsItem: {
    backgroundColor: 'rgba(20, 20, 22, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
});
