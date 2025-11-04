import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { FileText, Download, Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react-native';
import { GlassCard } from '@/components/glass/GlassCard';
import { Screen } from '@/components/layout/Screen';
import { supabase } from '@/lib/supabase';

export default function TaxReportsScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data } = await supabase
      .from('tax_reports')
      .select('*')
      .order('year', { ascending: false });
    setReports(data || []);
  };

  const generateReport = async (year: number) => {
    setGenerating(true);
    try {
      // Fetch all transactions for the year
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (!transactions || transactions.length === 0) {
        Alert.alert('No Data', 'No transactions found for this year');
        setGenerating(false);
        return;
      }

      // Calculate gains and losses
      const sells = transactions.filter((t) => t.type === 'sell');
      let totalGains = 0;
      let totalLosses = 0;
      let shortTermGains = 0;
      let longTermGains = 0;

      sells.forEach((sell) => {
        const profit = sell.amount - (sell.price * sell.quantity);
        if (profit > 0) {
          totalGains += profit;
          // Assume short-term for demo (< 1 year holding)
          shortTermGains += profit;
        } else {
          totalLosses += Math.abs(profit);
        }
      });

      const netGainLoss = totalGains - totalLosses;

      // Save report
      const { error } = await supabase.from('tax_reports').upsert([
        {
          year,
          total_gains: totalGains,
          total_losses: totalLosses,
          net_gain_loss: netGainLoss,
          short_term_gains: shortTermGains,
          long_term_gains: longTermGains,
          report_data: { transactions },
        },
      ]);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', `${year} tax report generated`);
        fetchReports();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = (report: any) => {
    Alert.alert('Export', 'Export functionality will be implemented in production', [
      { text: 'Export PDF' },
      { text: 'Export CSV' },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <FileText size={32} color="#3b82f6" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Tax Reports</Text>
          <Text style={styles.subtitle}>Annual trading summaries</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GENERATE REPORT</Text>
          <GlassCard style={styles.generateCard}>
            <Calendar size={48} color="#3b82f6" />
            <Text style={styles.generateTitle}>Generate {currentYear} Report</Text>
            <Text style={styles.generateText}>
              Create a comprehensive tax report for {currentYear} including all gains, losses, and transaction details
            </Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={() => generateReport(currentYear)}
              disabled={generating}
            >
              <FileText size={18} color="#fff" />
              <Text style={styles.generateButtonText}>
                {generating ? 'Generating...' : `Generate ${currentYear} Report`}
              </Text>
            </TouchableOpacity>
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREVIOUS REPORTS</Text>
          {reports.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <FileText size={48} color="#64748b" />
              <Text style={styles.emptyTitle}>No reports yet</Text>
              <Text style={styles.emptyText}>Generate your first tax report above</Text>
            </GlassCard>
          ) : (
            reports.map((report) => (
              <GlassCard key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.yearBadge}>
                    <Calendar size={20} color="#3b82f6" />
                    <Text style={styles.yearText}>{report.year}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.exportButton}
                    onPress={() => exportReport(report)}
                  >
                    <Download size={16} color="#3b82f6" />
                    <Text style={styles.exportText}>Export</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <View style={[styles.summaryIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                      <TrendingUp size={20} color="#10b981" />
                    </View>
                    <Text style={styles.summaryLabel}>Total Gains</Text>
                    <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                      ${report.total_gains?.toLocaleString() || '0'}
                    </Text>
                  </View>

                  <View style={styles.summaryItem}>
                    <View style={[styles.summaryIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                      <TrendingDown size={20} color="#ef4444" />
                    </View>
                    <Text style={styles.summaryLabel}>Total Losses</Text>
                    <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                      ${report.total_losses?.toLocaleString() || '0'}
                    </Text>
                  </View>
                </View>

                <View style={styles.netGainLoss}>
                  <DollarSign size={24} color={report.net_gain_loss >= 0 ? '#10b981' : '#ef4444'} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.netLabel}>Net Gain/Loss</Text>
                    <Text
                      style={[
                        styles.netValue,
                        { color: report.net_gain_loss >= 0 ? '#10b981' : '#ef4444' },
                      ]}
                    >
                      {report.net_gain_loss >= 0 ? '+' : ''}$
                      {report.net_gain_loss?.toLocaleString() || '0'}
                    </Text>
                  </View>
                </View>

                <View style={styles.termBreakdown}>
                  <View style={styles.termItem}>
                    <Text style={styles.termLabel}>Short-Term</Text>
                    <Text style={styles.termValue}>
                      ${report.short_term_gains?.toLocaleString() || '0'}
                    </Text>
                  </View>
                  <View style={styles.termItem}>
                    <Text style={styles.termLabel}>Long-Term</Text>
                    <Text style={styles.termValue}>
                      ${report.long_term_gains?.toLocaleString() || '0'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.generatedDate}>
                  Generated {new Date(report.generated_at).toLocaleDateString()}
                </Text>
              </GlassCard>
            ))
          )}
        </View>
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
  generateCard: { padding: 24, alignItems: 'center' },
  generateTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginTop: 16, marginBottom: 8 },
  generateText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  generateButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  generateButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  emptyCard: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  reportCard: { padding: 20, marginBottom: 16 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  yearBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(59, 130, 246, 0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  yearText: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  exportButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6' },
  exportText: { fontSize: 13, fontWeight: '600', color: '#3b82f6' },
  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '600' },
  netGainLoss: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0f172a', padding: 16, borderRadius: 12, marginBottom: 16 },
  netLabel: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  netValue: { fontSize: 24, fontWeight: 'bold' },
  termBreakdown: { flexDirection: 'row', gap: 12, marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  termItem: { flex: 1 },
  termLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  termValue: { fontSize: 16, fontWeight: '600', color: '#fff' },
  generatedDate: { fontSize: 12, color: '#64748b', marginTop: 8 },
});
