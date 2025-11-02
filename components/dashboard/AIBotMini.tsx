import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { BlurView } from 'expo-blur';
import { Bot, TrendingUp } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { GLASS } from '@/constants/glass';

interface AIBotMiniProps {
  status: 'active' | 'paused' | 'inactive';
  todayPnL: number;
  winRate: number;
  onToggle?: (active: boolean) => void;
}

const S = 8;

export const AIBotMini = React.memo(({ status, todayPnL, winRate, onToggle }: AIBotMiniProps) => {
  const [isActive, setIsActive] = useState(status === 'active');

  const handleToggle = useCallback((value: boolean) => {
    setIsActive(value);
    onToggle?.(value);
  }, [onToggle]);

  const statusColor = status === 'active' ? '#10B981' : status === 'paused' ? '#F59E0B' : '#6B7280';
  const statusLabel = status === 'active' ? 'Active' : status === 'paused' ? 'Paused' : 'Inactive';
  const pnlPositive = todayPnL >= 0;

  return (
    <BlurView intensity={15} tint="dark" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${statusColor}20` }]}>
            <Bot size={20} color={statusColor} />
          </View>
          <View>
            <Text style={styles.title}>AI Trading Bot</Text>
            <View style={[styles.statusChip, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
        </View>
        <Switch
          value={isActive}
          onValueChange={handleToggle}
          trackColor={{ false: colors.grey[700], true: '#10B981' }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.grey[700]}
          accessibilityLabel={`Toggle AI bot ${isActive ? 'off' : 'on'}`}
          accessibilityRole="switch"
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Today P/L</Text>
          <View style={styles.statValueRow}>
            {pnlPositive && <TrendingUp size={14} color="#10B981" />}
            <Text style={[styles.statValue, pnlPositive ? styles.statValuePositive : styles.statValueNegative]}>
              {pnlPositive ? '+' : ''}${Math.abs(todayPnL).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Win Rate</Text>
          <Text style={styles.statValue}>{winRate.toFixed(1)}%</Text>
        </View>
      </View>
    </BlurView>
  );
});

AIBotMini.displayName = 'AIBotMini';

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    marginBottom: S * 2.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S * 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S * 1.5,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.white,
    marginBottom: S * 0.5,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S * 0.75,
    paddingHorizontal: S * 1.25,
    paddingVertical: S * 0.5,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: S,
    height: S,
    borderRadius: S * 0.5,
  },
  statusText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginBottom: S * 0.5,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S * 0.5,
  },
  statValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
  statValuePositive: {
    color: '#10B981',
  },
  statValueNegative: {
    color: '#EF4444',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.glass.borderLight,
    marginHorizontal: S * 2,
  },
});
