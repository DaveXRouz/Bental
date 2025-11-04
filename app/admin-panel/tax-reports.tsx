import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText, Download, RefreshCw } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function TaxReportsAdmin() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, totalGains: 0, totalLosses: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data } = await supabase
        .from('tax_reports')
        .select('*, profiles(full_name, email, trading_passport)')
        .order('year', { ascending: false })
        .order('generated_at', { ascending: false });

      setReports(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const totalGains = data?.reduce((sum, r) => sum + (r.total_gains || 0), 0) || 0;
      const totalLosses = data?.reduce((sum, r) => sum + (r.total_losses || 0), 0) || 0;
      setStats({ total, totalGains, totalLosses });
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const regenerateReport = async (reportId: string, year: number, userId: string) => {
    Alert.alert('Regenerate Report', `Regenerate ${year} report for this user?`, [
      { text: 'Cancel' },
      {
        text: 'Regenerate',
        onPress: async () => {
          setLoading(true);
          try {
            // Fetch transactions for the year
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;

            const { data: transactions } = await supabase
              .from('transactions')
              .select('*')
              .eq('user_id', userId)
              .gte('created_at', startDate)
              .lte('created_at', endDate);

            if (!transactions || transactions.length === 0) {
              Alert.alert('No Data', 'No transactions found for this period');
              setLoading(false);
              return;
            }

            // Calculate gains/losses
            const sells = transactions.filter(t => t.type === 'sell');
            let totalGains = 0;
            let totalLosses = 0;
            let shortTermGains = 0;
            let longTermGains = 0;

            sells.forEach(sell => {
              const profit = sell.amount - (sell.price * sell.quantity);
              if (profit > 0) {
                totalGains += profit;
                shortTermGains += profit;
              } else {
                totalLosses += Math.abs(profit);
              }
            });

            // Update report
            const { error } = await supabase
              .from('tax_reports')
              .update({
                total_gains: totalGains,
                total_losses: totalLosses,
                net_gain_loss: totalGains - totalLosses,
                short_term_gains: shortTermGains,
                long_term_gains: longTermGains,
                report_data: { transactions },
                generated_at: new Date().toISOString(),
              })
              .eq('id', reportId);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              Alert.alert('Success', 'Report regenerated');
              fetchReports();
            }
          } catch (error: any) {
            Alert.alert('Error', error.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const deleteReport = async (reportId: string) => {
    Alert.alert('Delete Report', 'Permanently delete this report?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('tax_reports').delete().eq('id', reportId);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            fetchReports();
          }
        },
      },
    ]);
  };

  const exportAllReports = () => {
    Alert.alert('Export All', 'Export functionality will generate CSV with all reports', [
      { text: 'Cancel' },
      { text: 'Export CSV' },
      { text: 'Export PDF' },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Tax Reports Management</Text>
          <Text style={styles.headerSubtitle}>{stats.total} total reports</Text>
        </View>
        <TouchableOpacity style={styles.exportButton} onPress={exportAllReports}>
          <Download size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Reports</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            ${(stats.totalGains / 1000).toFixed(1)}K
          </Text>
          <Text style={styles.statLabel}>Total Gains</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>
            ${(stats.totalLosses / 1000).toFixed(1)}K
          </Text>
          <Text style={styles.statLabel}>Total Losses</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: stats.totalGains >= stats.totalLosses ? '#10b981' : '#ef4444' }]}>
            ${((stats.totalGains - stats.totalLosses) / 1000).toFixed(1)}K
          </Text>
          <Text style={styles.statLabel}>Net</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {reports.map((report) => (
          <View key={report.id} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.yearBadge}>
                <FileText size={18} color="#3b82f6" />
                <Text style={styles.yearText}>{report.year}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.userName}>{report.profiles?.full_name}</Text>
                <Text style={styles.userEmail}>{report.profiles?.email}</Text>
              </View>
            </View>

            <View style={styles.reportStats}>
              <View style={styles.reportStat}>
                <Text style={styles.reportStatLabel}>Gains</Text>
                <Text style={[styles.reportStatValue, { color: '#10b981' }]}>
                  ${report.total_gains?.toLocaleString() || '0'}
                </Text>
              </View>
              <View style={styles.reportStat}>
                <Text style={styles.reportStatLabel}>Losses</Text>
                <Text style={[styles.reportStatValue, { color: '#ef4444' }]}>
                  ${report.total_losses?.toLocaleString() || '0'}
                </Text>
              </View>
              <View style={styles.reportStat}>
                <Text style={styles.reportStatLabel}>Net</Text>
                <Text style={[styles.reportStatValue, { color: report.net_gain_loss >= 0 ? '#10b981' : '#ef4444' }]}>
                  ${report.net_gain_loss?.toLocaleString() || '0'}
                </Text>
              </View>
            </View>

            <View style={styles.termBreakdown}>
              <View style={styles.termItem}>
                <Text style={styles.termLabel}>Short-Term</Text>
                <Text style={styles.termValue}>${report.short_term_gains?.toLocaleString() || '0'}</Text>
              </View>
              <View style={styles.termItem}>
                <Text style={styles.termLabel}>Long-Term</Text>
                <Text style={styles.termValue}>${report.long_term_gains?.toLocaleString() || '0'}</Text>
              </View>
            </View>

            <Text style={styles.generatedDate}>
              Generated {new Date(report.generated_at).toLocaleString()}
            </Text>

            <View style={styles.reportActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => regenerateReport(report.id, report.year, report.user_id)}
                disabled={loading}
              >
                <RefreshCw size={14} color="#3b82f6" />
                <Text style={styles.actionText}>Regenerate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => Alert.alert('Export', 'Export this report as PDF or CSV')}
              >
                <Download size={14} color="#10b981" />
                <Text style={styles.actionText}>Export</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteAction]}
                onPress={() => deleteReport(report.id)}
              >
                <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {reports.length === 0 && (
          <View style={styles.emptyState}>
            <FileText size={48} color="#64748b" />
            <Text style={styles.emptyTitle}>No tax reports</Text>
            <Text style={styles.emptyText}>Reports will appear here when users generate them</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#334155', gap: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  exportButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', textAlign: 'center' },
  content: { flex: 1, padding: 16 },
  reportCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  yearBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(59, 130, 246, 0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  yearText: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  userName: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 4 },
  userEmail: { fontSize: 13, color: '#64748b' },
  reportStats: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  reportStat: { flex: 1, backgroundColor: '#0f172a', padding: 12, borderRadius: 8, alignItems: 'center' },
  reportStatLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  reportStatValue: { fontSize: 16, fontWeight: '600' },
  termBreakdown: { flexDirection: 'row', gap: 12, marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  termItem: { flex: 1, backgroundColor: '#0f172a', padding: 12, borderRadius: 8 },
  termLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  termValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  generatedDate: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  reportActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 8, backgroundColor: '#0f172a' },
  deleteAction: { borderWidth: 1, borderColor: '#ef4444' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  emptyState: { alignItems: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
});
