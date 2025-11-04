import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Search, TrendingUp, TrendingDown, DollarSign } from 'lucide-react-native';
import { GlassCard } from '@/components/glass/GlassCard';
import { Screen } from '@/components/layout/Screen';
import { supabase } from '@/lib/supabase';

export default function ScreenerScreen() {
  const [results, setResults] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 1000,
    minVolume: 0,
    category: 'all',
  });
  const [loading, setLoading] = useState(false);

  const runScreen = async () => {
    setLoading(true);
    try {
      // Query holdings as a demo data source
      let query = supabase
        .from('holdings')
        .select('symbol, current_price, quantity, average_price, total_gain_loss_percent');

      if (filters.minPrice > 0) {
        query = query.gte('current_price', filters.minPrice);
      }
      if (filters.maxPrice < 1000) {
        query = query.lte('current_price', filters.maxPrice);
      }

      const { data, error } = await query.limit(50);
      if (!error && data) {
        setResults(data);
      }
    } catch (error) {
      console.error('Screening error:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickScreens = [
    { id: 'gainers', label: 'Top Gainers', icon: TrendingUp, color: '#10b981' },
    { id: 'losers', label: 'Top Losers', icon: TrendingDown, color: '#ef4444' },
    { id: 'active', label: 'Most Active', icon: DollarSign, color: '#3b82f6' },
  ];

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Search size={32} color="#3b82f6" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Stock Screener</Text>
          <Text style={styles.subtitle}>Filter by criteria</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK SCREENS</Text>
          <View style={styles.quickScreens}>
            {quickScreens.map((screen) => (
              <TouchableOpacity
                key={screen.id}
                style={styles.quickScreenCard}
                onPress={() => {
                  setFilters({ ...filters, category: screen.id });
                  runScreen();
                }}
              >
                <View style={[styles.quickIcon, { backgroundColor: `${screen.color}20` }]}>
                  <screen.icon size={24} color={screen.color} />
                </View>
                <Text style={styles.quickLabel}>{screen.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FILTERS</Text>
          <GlassCard style={styles.filtersCard}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Price Range</Text>
              <View style={styles.rangeInputs}>
                <View style={styles.rangeInput}>
                  <Text style={styles.rangeValue}>${filters.minPrice}</Text>
                </View>
                <Text style={styles.rangeSeparator}>to</Text>
                <View style={styles.rangeInput}>
                  <Text style={styles.rangeValue}>${filters.maxPrice}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.runButton} onPress={runScreen} disabled={loading}>
              <Search size={18} color="#fff" />
              <Text style={styles.runButtonText}>{loading ? 'Screening...' : 'Run Screen'}</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>

        {results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RESULTS ({results.length})</Text>
            {results.map((stock, index) => (
              <GlassCard key={index} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultSymbol}>{stock.symbol}</Text>
                  <Text style={styles.resultPrice}>${stock.current_price?.toFixed(2) || '0.00'}</Text>
                </View>
                <View style={styles.resultDetails}>
                  <View style={styles.resultStat}>
                    <Text style={styles.resultLabel}>Change</Text>
                    <Text
                      style={[
                        styles.resultValue,
                        { color: (stock.total_gain_loss_percent || 0) >= 0 ? '#10b981' : '#ef4444' },
                      ]}
                    >
                      {(stock.total_gain_loss_percent || 0) >= 0 ? '+' : ''}
                      {(stock.total_gain_loss_percent || 0).toFixed(2)}%
                    </Text>
                  </View>
                  <View style={styles.resultStat}>
                    <Text style={styles.resultLabel}>Shares</Text>
                    <Text style={styles.resultValue}>{stock.quantity || 0}</Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {results.length === 0 && !loading && (
          <GlassCard style={styles.emptyCard}>
            <Search size={48} color="#64748b" />
            <Text style={styles.emptyTitle}>No Results</Text>
            <Text style={styles.emptyText}>Adjust filters and run screen</Text>
          </GlassCard>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8' },
  content: { flex: 1, padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 12 },
  quickScreens: { flexDirection: 'row', gap: 12 },
  quickScreenCard: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.6)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  quickIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickLabel: { fontSize: 12, fontWeight: '600', color: '#fff', textAlign: 'center' },
  filtersCard: { padding: 20 },
  filterRow: { marginBottom: 20 },
  filterLabel: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 12 },
  rangeInputs: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rangeInput: { flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 12, alignItems: 'center' },
  rangeValue: { fontSize: 16, fontWeight: '600', color: '#fff' },
  rangeSeparator: { fontSize: 14, color: '#64748b' },
  runButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3b82f6', padding: 16, borderRadius: 12 },
  runButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  resultCard: { marginBottom: 12, padding: 16 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultSymbol: { fontSize: 18, fontWeight: '600', color: '#fff' },
  resultPrice: { fontSize: 18, fontWeight: '600', color: '#fff' },
  resultDetails: { flexDirection: 'row', gap: 16 },
  resultStat: { flex: 1 },
  resultLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  resultValue: { fontSize: 16, fontWeight: '600', color: '#fff' },
  emptyCard: { alignItems: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
});
