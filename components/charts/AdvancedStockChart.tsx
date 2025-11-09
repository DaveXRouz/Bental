import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CartesianChart, Line, Area } from 'victory-native';
import { BlurView } from 'expo-blur';
import { TrendingUp } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface ChartDataPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

interface AdvancedStockChartProps {
  data: ChartDataPoint[];
  symbol: string;
  showIndicators?: boolean;
}

type ChartType = 'line' | 'area';
type Indicator = 'SMA' | 'EMA' | 'BB' | 'RSI' | 'none';

export function AdvancedStockChart({ data, symbol, showIndicators = true }: AdvancedStockChartProps) {
  const [chartType, setChartType] = useState<ChartType>('area');
  const [indicator, setIndicator] = useState<Indicator>('SMA');
  const [smaPeriod] = useState(20);

  // Calculate Simple Moving Average (SMA)
  const calculateSMA = (data: ChartDataPoint[], period: number) => {
    const sma: ChartDataPoint[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const avg = slice.reduce((sum, d) => sum + d.price, 0) / period;
      sma.push({
        timestamp: data[i].timestamp,
        price: avg,
      });
    }
    return sma;
  };

  // Calculate Exponential Moving Average (EMA)
  const calculateEMA = (data: ChartDataPoint[], period: number) => {
    const multiplier = 2 / (period + 1);
    const ema: ChartDataPoint[] = [];

    // Start with SMA for first value
    const firstSMA = data.slice(0, period).reduce((sum, d) => sum + d.price, 0) / period;
    ema.push({ timestamp: data[period - 1].timestamp, price: firstSMA });

    for (let i = period; i < data.length; i++) {
      const emaValue = (data[i].price - ema[ema.length - 1].price) * multiplier + ema[ema.length - 1].price;
      ema.push({
        timestamp: data[i].timestamp,
        price: emaValue,
      });
    }
    return ema;
  };

  const smaData = useMemo(() => {
    if (indicator !== 'SMA' || data.length < smaPeriod) return [];
    return calculateSMA(data, smaPeriod);
  }, [data, indicator, smaPeriod]);

  const emaData = useMemo(() => {
    if (indicator !== 'EMA' || data.length < smaPeriod) return [];
    return calculateEMA(data, smaPeriod);
  }, [data, indicator, smaPeriod]);

  // Calculate Bollinger Bands (BB)
  const calculateBollingerBands = (data: ChartDataPoint[], period: number = 20) => {
    const sma = calculateSMA(data, period);
    const bands: Array<{timestamp: number, upper: number, middle: number, lower: number}> = [];

    for (let i = 0; i < sma.length; i++) {
      const startIdx = i + (data.length - sma.length);
      const slice = data.slice(startIdx - period + 1, startIdx + 1);
      const mean = sma[i].price;
      const squaredDiffs = slice.map(d => Math.pow(d.price - mean, 2));
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
      const stdDev = Math.sqrt(variance);

      bands.push({
        timestamp: sma[i].timestamp,
        upper: mean + (2 * stdDev),
        middle: mean,
        lower: mean - (2 * stdDev),
      });
    }
    return bands;
  };

  // Calculate Relative Strength Index (RSI)
  const calculateRSI = (data: ChartDataPoint[], period: number = 14) => {
    if (data.length < period + 1) return [];

    const rsi: Array<{timestamp: number, value: number}> = [];
    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
      const change = data[i].price - data[i - 1].price;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    let rs = avgGain / avgLoss;
    let rsiValue = 100 - (100 / (1 + rs));

    rsi.push({ timestamp: data[period].timestamp, value: rsiValue });

    // Calculate RSI for remaining data points
    for (let i = period + 1; i < data.length; i++) {
      const change = data[i].price - data[i - 1].price;
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      rs = avgGain / avgLoss;
      rsiValue = 100 - (100 / (1 + rs));

      rsi.push({ timestamp: data[i].timestamp, value: rsiValue });
    }

    return rsi;
  };

  const bollingerBands = useMemo(() => {
    if (indicator !== 'BB' || data.length < smaPeriod) return [];
    return calculateBollingerBands(data, smaPeriod);
  }, [data, indicator, smaPeriod]);

  const rsiData = useMemo(() => {
    if (indicator !== 'RSI' || data.length < 15) return [];
    return calculateRSI(data, 14);
  }, [data, indicator]);

  // Calculate price range for Y-axis
  const priceRange = useMemo(() => {
    const prices = data.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    return {
      min: min - padding,
      max: max + padding,
    };
  }, [data]);

  // Prepare chart data
  const chartData = data.map((d, index) => ({
    x: index,
    y: d.price,
  }));

  const indicatorChartData = useMemo(() => {
    const activeIndicatorData = indicator === 'SMA' ? smaData : indicator === 'EMA' ? emaData : [];
    return activeIndicatorData.map((d, index) => ({
      x: data.findIndex(item => item.timestamp === d.timestamp),
      y: d.price,
    }));
  }, [indicator, smaData, emaData, data]);

  // Calculate stats
  const stats = useMemo(() => {
    if (data.length === 0) return { change: 0, changePercent: 0, high: 0, low: 0 };
    const firstPrice = data[0].price;
    const lastPrice = data[data.length - 1].price;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;
    const high = Math.max(...data.map(d => d.price));
    const low = Math.min(...data.map(d => d.price));
    return { change, changePercent, high, low };
  }, [data]);

  if (data.length === 0) {
    return (
      <BlurView intensity={40} tint="dark" style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No chart data available</Text>
      </BlurView>
    );
  }

  return (
    <BlurView intensity={40} tint="dark" style={styles.container}>
      {/* Chart Type & Indicator Selector */}
      {showIndicators && (
        <View style={styles.controls}>
          <View style={styles.controlGroup}>
            <TouchableOpacity
              style={[styles.controlButton, chartType === 'line' && styles.controlButtonActive]}
              onPress={() => setChartType('line')}
            >
              <Text style={[styles.controlText, chartType === 'line' && styles.controlTextActive]}>Line</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, chartType === 'area' && styles.controlButtonActive]}
              onPress={() => setChartType('area')}
            >
              <Text style={[styles.controlText, chartType === 'area' && styles.controlTextActive]}>Area</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.controlGroup}>
            <TouchableOpacity
              style={[styles.controlButton, indicator === 'none' && styles.controlButtonActive]}
              onPress={() => setIndicator('none')}
            >
              <Text style={[styles.controlText, indicator === 'none' && styles.controlTextActive]}>None</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, indicator === 'SMA' && styles.controlButtonActive]}
              onPress={() => setIndicator('SMA')}
            >
              <Text style={[styles.controlText, indicator === 'SMA' && styles.controlTextActive]}>SMA</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, indicator === 'EMA' && styles.controlButtonActive]}
              onPress={() => setIndicator('EMA')}
            >
              <Text style={[styles.controlText, indicator === 'EMA' && styles.controlTextActive]}>EMA</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, indicator === 'BB' && styles.controlButtonActive]}
              onPress={() => setIndicator('BB')}
            >
              <Text style={[styles.controlText, indicator === 'BB' && styles.controlTextActive]}>BB</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, indicator === 'RSI' && styles.controlButtonActive]}
              onPress={() => setIndicator('RSI')}
            >
              <Text style={[styles.controlText, indicator === 'RSI' && styles.controlTextActive]}>RSI</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Change</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={12} color={stats.change >= 0 ? '#10b981' : '#ef4444'} />
            <Text style={[styles.statValue, { color: stats.change >= 0 ? '#10b981' : '#ef4444' }]}>
              {stats.change >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
            </Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>High</Text>
          <Text style={styles.statValue}>${stats.high.toFixed(2)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Low</Text>
          <Text style={styles.statValue}>${stats.low.toFixed(2)}</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={["y"]}
          domainPadding={{ top: 20, bottom: 20, left: 20, right: 20 }}
          axisOptions={{
            font: {
              size: 10,
            },
            lineColor: '#334155',
            lineWidth: 1,
          }}
        >
          {({ points }) => (
            <>
              {chartType === 'area' ? (
                <Area
                  points={points.y}
                  y0={0}
                  curveType="natural"
                  animate={{ type: 'timing', duration: 300 }}
                />
              ) : null}
              <Line
                points={points.y}
                color="#3b82f6"
                strokeWidth={2}
                curveType="natural"
                animate={{ type: 'timing', duration: 300 }}
              />
            </>
          )}
        </CartesianChart>

        {/* Indicator Line */}
        {indicator !== 'none' && indicatorChartData.length > 0 && (
          <View style={StyleSheet.absoluteFill}>
            <CartesianChart
              data={indicatorChartData}
              xKey="x"
              yKeys={["y"]}
              domainPadding={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              {({ points }) => (
                <Line
                  points={points.y}
                  color={indicator === 'SMA' ? '#f59e0b' : '#8b5cf6'}
                  strokeWidth={1.5}
                  curveType="natural"
                  opacity={0.8}
                  animate={{ type: 'timing', duration: 300 }}
                />
              )}
            </CartesianChart>
          </View>
        )}
      </View>

      {/* Legend */}
      {indicator !== 'none' && indicator !== 'RSI' && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>Price</Text>
          </View>
          {indicator === 'BB' ? (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>Upper Band</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#8b5cf6' }]} />
                <Text style={styles.legendText}>Lower Band</Text>
              </View>
            </>
          ) : (
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: indicator === 'SMA' ? '#f59e0b' : '#8b5cf6' }]} />
              <Text style={styles.legendText}>{indicator} ({smaPeriod})</Text>
            </View>
          )}
        </View>
      )}

      {/* RSI Chart */}
      {indicator === 'RSI' && rsiData.length > 0 && (
        <View style={styles.rsiContainer}>
          <Text style={styles.rsiTitle}>RSI (14)</Text>
          <View style={{ height: 100 }}>
            <CartesianChart
              data={rsiData.map((d, idx) => ({ x: idx, y: d.value }))}
              xKey="x"
              yKeys={["y"]}
              domainPadding={{ top: 10, bottom: 10, left: 20, right: 20 }}
              axisOptions={{
                font: { size: 9 },
                lineColor: '#334155',
                lineWidth: 0.5,
              }}
            >
              {({ points }) => (
                <>
                  <Line
                    points={points.y}
                    color="#8b5cf6"
                    strokeWidth={1.5}
                    curveType="natural"
                    animate={{ type: 'timing', duration: 300 }}
                  />
                </>
              )}
            </CartesianChart>
          </View>
          <View style={styles.rsiLevels}>
            <View style={styles.rsiLevel}>
              <View style={[styles.rsiLevelLine, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.rsiLevelText}>Overbought (70)</Text>
            </View>
            <View style={styles.rsiLevel}>
              <View style={[styles.rsiLevelLine, { backgroundColor: '#10b981' }]} />
              <Text style={styles.rsiLevelText}>Oversold (30)</Text>
            </View>
          </View>
        </View>
      )}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, overflow: 'hidden', padding: 16, marginBottom: 16 },
  emptyContainer: { borderRadius: 16, padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: '#64748b' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 12 },
  controlGroup: { flexDirection: 'row', gap: 6 },
  controlButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  controlButtonActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  controlText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  controlTextActive: { color: '#fff' },
  statsBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  chartContainer: { height: 220, marginBottom: 12 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendColor: { width: 12, height: 12, borderRadius: 2 },
  legendText: { fontSize: 11, color: '#94a3b8' },
  rsiContainer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#334155' },
  rsiTitle: { fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 8 },
  rsiLevels: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 8 },
  rsiLevel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rsiLevelLine: { width: 12, height: 2, borderRadius: 1 },
  rsiLevelText: { fontSize: 10, color: '#64748b' },
});
