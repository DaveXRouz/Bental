import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { colors, Typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatting';

interface AllocationData {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: AllocationData[];
  totalValue: number;
  size?: number;
}

const ALLOCATION_COLORS = {
  cash: '#9CA3AF',
  equities: '#60A5FA',
  bonds: '#34D399',
  crypto: '#F59E0B',
  alternatives: '#A78BFA',
};

export default function AllocationDonutChart({ data, totalValue, size = 200 }: Props) {
  const radius = size / 2 - 20;
  const circumference = 2 * Math.PI * radius;
  const centerX = size / 2;
  const centerY = size / 2;

  let currentOffset = 0;

  const arcs = data.map((item) => {
    const percentage = (item.value / totalValue) * 100;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const rotation = (currentOffset / 100) * 360 - 90;

    currentOffset += percentage;

    return {
      ...item,
      percentage,
      strokeDasharray,
      rotation,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${centerX}, ${centerY}`}>
            {arcs.map((arc, index) => (
              <Circle
                key={index}
                cx={centerX}
                cy={centerY}
                r={radius}
                stroke={arc.color}
                strokeWidth={28}
                fill="none"
                strokeDasharray={arc.strokeDasharray}
                strokeDashoffset={0}
                rotation={arc.rotation}
                origin={`${centerX}, ${centerY}`}
                strokeLinecap="round"
              />
            ))}
          </G>

          <SvgText
            x={centerX}
            y={centerY - 10}
            textAnchor="middle"
            fontSize={20}
            fontWeight="700"
            fill={colors.white}
          >
            {formatCurrency(totalValue)}
          </SvgText>
          <SvgText
            x={centerX}
            y={centerY + 15}
            textAnchor="middle"
            fontSize={12}
            fill={colors.textMuted}
          >
            Total Value
          </SvgText>
        </Svg>
      </View>

      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <View style={styles.legendText}>
              <Text style={styles.legendLabel}>{item.label}</Text>
              <Text style={styles.legendValue}>
                {formatCurrency(item.value)} ({((item.value / totalValue) * 100).toFixed(1)}%)
              </Text>
            </View>
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
    marginBottom: 24,
  },
  legend: {
    width: '100%',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: colors.white,
  },
  legendValue: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
  },
});
