import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowUp, ArrowDown } from 'lucide-react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { Typography, Spacing } from '@/constants/theme';
import { Sparkline } from './Sparkline';

interface StatProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  sparklineData?: number[];
  testID?: string;
}

export function Stat({ label, value, delta, deltaLabel, sparklineData, testID }: StatProps) {
  const { colors } = useThemeStore();

  const isPositive = delta !== undefined && delta >= 0;
  const deltaColor = isPositive ? colors.success : colors.error;

  return (
    <View testID={testID} style={styles.container}>
      <Text
        style={[
          styles.label,
          {
            color: colors.textSecondary,
            fontFamily: Typography.family.medium,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          {
            color: colors.text,
            fontFamily: Typography.family.bold,
          },
        ]}
      >
        {value}
      </Text>
      {delta !== undefined && (
        <View style={styles.deltaContainer}>
          {isPositive ? (
            <ArrowUp size={14} color={deltaColor} strokeWidth={2.5} />
          ) : (
            <ArrowDown size={14} color={deltaColor} strokeWidth={2.5} />
          )}
          <Text
            style={[
              styles.delta,
              {
                color: deltaColor,
                fontFamily: Typography.family.semibold,
              },
            ]}
          >
            {Math.abs(delta).toFixed(2)}%
          </Text>
          {deltaLabel && (
            <Text
              style={[
                styles.deltaLabel,
                {
                  color: colors.textTertiary,
                  fontFamily: Typography.family.regular,
                },
              ]}
            >
              {deltaLabel}
            </Text>
          )}
        </View>
      )}
      {sparklineData && sparklineData.length > 0 && (
        <View style={styles.sparklineContainer}>
          <Sparkline data={sparklineData} color={isPositive ? colors.success : colors.error} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: Typography.size.sm,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: Typography.size.xxl,
    lineHeight: Typography.size.xxl * Typography.lineHeight.tight,
    marginBottom: Spacing.xs,
  },
  deltaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  delta: {
    fontSize: Typography.size.sm,
  },
  deltaLabel: {
    fontSize: Typography.size.xs,
  },
  sparklineContainer: {
    marginTop: Spacing.sm,
    height: 40,
  },
});
