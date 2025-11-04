import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Trash2, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function AlertsAdminScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, triggered: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*, profiles(full_name, email, trading_passport)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAlerts(data || []);
      setStats({
        total: data?.length || 0,
        active: data?.filter(a => a.active && !a.triggered).length || 0,
        triggered: data?.filter(a => a.triggered).length || 0,
      });
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (id: string) => {
    Alert.alert('Delete Alert', 'Permanently delete this alert?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('price_alerts').delete().eq('id', id);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            Alert.alert('Success', 'Alert deleted');
            fetchAlerts();
          }
        },
      },
    ]);
  };

  const triggerAlert = async (id: string) => {
    const { error } = await supabase
      .from('price_alerts')
      .update({ triggered: true, triggered_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Alert triggered manually');
      fetchAlerts();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Price Alerts Management</Text>
          <Text style={styles.headerSubtitle}>{stats.total} total alerts</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.triggered}</Text>
          <Text style={styles.statLabel}>Triggered</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {alerts.map((alert) => (
          <View key={alert.id} style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <View style={styles.alertIcon}>
                {alert.condition === 'above' || alert.condition === 'crosses_above' ? (
                  <TrendingUp size={18} color="#10b981" />
                ) : (
                  <TrendingDown size={18} color="#ef4444" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.alertSymbol}>{alert.symbol}</Text>
                  {alert.triggered && (
                    <View style={styles.triggeredBadge}>
                      <CheckCircle size={12} color="#10b981" />
                      <Text style={styles.triggeredText}>Triggered</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.alertUser}>
                  {alert.profiles?.full_name} ({alert.profiles?.trading_passport})
                </Text>
              </View>
            </View>

            <View style={styles.alertDetails}>
              <Text style={styles.detailText}>
                Condition: {alert.condition.replace('_', ' ')}
              </Text>
              <Text style={styles.detailText}>
                Target: ${alert.target_price.toFixed(2)}
              </Text>
              <Text style={styles.detailText}>
                Created: {new Date(alert.created_at).toLocaleDateString()}
              </Text>
              {alert.triggered_at && (
                <Text style={styles.detailText}>
                  Triggered: {new Date(alert.triggered_at).toLocaleString()}
                </Text>
              )}
            </View>

            <View style={styles.alertActions}>
              {!alert.triggered && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.triggerButton]}
                  onPress={() => triggerAlert(alert.id)}
                >
                  <Bell size={14} color="#f59e0b" />
                  <Text style={styles.actionText}>Trigger</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deleteAlert(alert.id)}
              >
                <Trash2 size={14} color="#ef4444" />
                <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {alerts.length === 0 && (
          <View style={styles.emptyState}>
            <Bell size={48} color="#64748b" />
            <Text style={styles.emptyTitle}>No price alerts</Text>
            <Text style={styles.emptyText}>Users haven't created any alerts yet</Text>
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
  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#64748b', textTransform: 'uppercase' },
  content: { flex: 1, padding: 16 },
  alertCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  alertIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  alertSymbol: { fontSize: 18, fontWeight: '600', color: '#fff' },
  alertUser: { fontSize: 13, color: '#64748b', marginTop: 4 },
  triggeredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  triggeredText: { fontSize: 11, fontWeight: '600', color: '#10b981' },
  alertDetails: { backgroundColor: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 12 },
  detailText: { fontSize: 13, color: '#94a3b8', marginBottom: 4 },
  alertActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 8 },
  triggerButton: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 1, borderColor: '#f59e0b' },
  deleteButton: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: '#ef4444' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#f59e0b' },
  emptyState: { alignItems: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
});
