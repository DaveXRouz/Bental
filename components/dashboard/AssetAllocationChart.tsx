import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, Spacing, Typography } from '@/constants/theme';
import { formatSmartCurrency } from '@/utils/formatting';
import AllocationDonutChart from '@/components/charts/AllocationDonutChart';

interface AssetAllocation {
  type: string;
  value: number;
  percentage: number;
  color: string;
}

interface Props {
  allocations: AssetAllocation[];
  onSegmentPress?: (type: string) => void;
}

const ALLOCATION_COLORS = {
  Cash: '#9CA3AF',
  Equities: '#60A5FA',
  Bonds: '#34D399',
  Crypto: '#F59E0B',
  Alternatives: '#A78BFA',
};

const DEFAULT_ALLOCATIONS: AssetAllocation[] = [
  { type: 'Cash', value: 50000, percentage: 25, color: ALLOCATION_COLORS.Cash },
  { type: 'Equities', value: 100000, percentage: 50, color: ALLOCATION_COLORS.Equities },
  { type: 'Bonds', value: 35000, percentage: 17.5, color: ALLOCATION_COLORS.Bonds },
  { type: 'Crypto', value: 15000, percentage: 7.5, color: ALLOCATION_COLORS.Crypto },
];

export function AssetAllocationChart({ allocations, onSegmentPress }: Props) {
  const displayAllocations = allocations.length === 0 ? DEFAULT_ALLOCATIONS : allocations;

  const displayAllocationsWithColors = displayAllocations.map(a => ({
    ...a,
    color: ALLOCATION_COLORS[a.type as keyof typeof ALLOCATION_COLORS] || a.color,
  }));

  const totalValue = displayAllocations.reduce((sum, a) => sum + a.value, 0);

  const chartData = displayAllocationsWithColors.map(a => ({
    label: a.type,
    value: a.value,
    color: a.color,
  }));

  return (
    <BlurView intensity={15} tint="dark" style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Asset Allocation</Text>

        <AllocationDonutChart
          data={chartData}
          totalValue={totalValue}
          size={240}
        />
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginBottom: 16,
  },
});
