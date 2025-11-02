import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useThemeStore } from '@/stores/useThemeStore';
import { Typography, Spacing } from '@/constants/theme';

interface DonutChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  centerLabel?: string;
  centerValue?: string;
  size?: number;
  testID?: string;
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 200,
  testID,
}: DonutChartProps) {
  const { colors } = useThemeStore();

  const defaultColors = [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.success,
    colors.info,
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2 - 10;
  const innerRadius = radius * 0.6;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = -90;
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const segment = {
      percentage,
      startAngle: currentAngle,
      angle,
      color: item.color || defaultColors[index % defaultColors.length],
    };
    currentAngle += angle;
    return segment;
  });

  return (
    <View style={styles.container} testID={testID}>
      <View style={[styles.chartContainer, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <G rotation={0} origin={`${size / 2}, ${size / 2}`}>
            {segments.map((segment, index) => {
              const strokeDasharray = `${(segment.angle / 360) * circumference} ${circumference}`;
              const strokeDashoffset = -((segment.startAngle + 90) / 360) * circumference;

              return (
                <Circle
                  key={index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={segment.color}
                  strokeWidth={radius - innerRadius}
                  fill="none"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              );
            })}
          </G>
        </Svg>
        {(centerLabel || centerValue) && (
          <View style={styles.centerLabel}>
            {centerLabel && (
              <Text
                style={[
                  styles.centerLabelText,
                  {
                    color: colors.textSecondary,
                    fontFamily: 'Inter-Medium',
                  },
                ]}
              >
                {centerLabel}
              </Text>
            )}
            {centerValue && (
              <Text
                style={[
                  styles.centerValueText,
                  {
                    color: colors.text,
                    fontFamily: 'Inter-Bold',
                  },
                ]}
              >
                {centerValue}
              </Text>
            )}
          </View>
        )}
      </View>
      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={item.label} style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                {
                  backgroundColor: item.color || defaultColors[index % defaultColors.length],
                },
              ]}
            />
            <Text
              style={[
                styles.legendLabel,
                {
                  color: colors.text,
                  fontFamily: 'Inter-Regular',
                },
              ]}
            >
              {item.label}
            </Text>
            <Text
              style={[
                styles.legendValue,
                {
                  color: colors.textSecondary,
                  fontFamily: 'Inter-Medium',
                },
              ]}
            >
              {item.value.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabelText: {
    fontSize: Typography.size.xs,
    marginBottom: Spacing.xs,
  },
  centerValueText: {
    fontSize: Typography.size.lg,
  },
  legend: {
    marginTop: Spacing.md,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: Spacing.sm,
  },
  legendLabel: {
    flex: 1,
    fontSize: Typography.size.sm,
  },
  legendValue: {
    fontSize: Typography.size.sm,
  },
});
