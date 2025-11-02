import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar, Clock, Shield, TrendingUp } from 'lucide-react-native';

const THEME = {
  bg: '#000000',
  textPrimary: '#FFFFFF',
  textSecondary: '#BDBDBD',
  accentBlue: '#1DA1F2',
  cardBg: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.08)',
};

interface PlanRowProps {
  startDate: string | null;
  endDate: string | null;
  dailyHours: string | null;
  stopLossPct: number;
  expectedDailyReturnPct: number;
}

export default function PlanRow({
  startDate,
  endDate,
  dailyHours,
  stopLossPct,
  expectedDailyReturnPct,
}: PlanRowProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <BlurView intensity={22} tint="dark" style={styles.container}>
      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.item}>
            <Calendar size={14} color={THEME.textSecondary} />
            <Text style={styles.label}>Start - End</Text>
          </View>
          <Text style={styles.value}>
            {formatDate(startDate)} – {formatDate(endDate)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.item}>
            <Clock size={14} color={THEME.textSecondary} />
            <Text style={styles.label}>Trading Hours</Text>
          </View>
          <Text style={styles.value}>{dailyHours || '9:30-16:00 ET'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.item}>
            <Shield size={14} color={THEME.textSecondary} />
            <Text style={styles.label}>Stop Loss</Text>
          </View>
          <Text style={styles.value}>{stopLossPct.toFixed(1)}%</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.item}>
            <TrendingUp size={14} color={THEME.textSecondary} />
            <Text style={styles.label}>Expected Daily</Text>
          </View>
          <Text style={styles.value}>+{expectedDailyReturnPct.toFixed(2)}%</Text>
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    overflow: 'hidden',
    marginBottom: 12,
  },
  content: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    color: THEME.textPrimary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: THEME.cardBorder,
    marginVertical: 10,
  },
});
