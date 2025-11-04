import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, RefreshControl } from 'react-native';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react-native';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { GlassCard } from '@/components/glass/GlassCard';
import { Screen } from '@/components/layout/Screen';

export default function AlertsScreen() {
  const { alerts, loading, createAlert, deleteAlert, toggleAlert, resetAlert } = usePriceAlerts();
  const [showModal, setShowModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    symbol: '',
    condition: 'above' as 'above' | 'below' | 'crosses_above' | 'crosses_below',
    target_price: '',
    repeat: false,
  });
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!newAlert.symbol || !newAlert.target_price) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const result = await createAlert({
      symbol: newAlert.symbol.toUpperCase(),
      condition: newAlert.condition,
      target_price: parseFloat(newAlert.target_price),
      repeat: newAlert.repeat,
    });

    if (result) {
      Alert.alert('Success', 'Alert created');
      setShowModal(false);
      setNewAlert({ symbol: '', condition: 'above', target_price: '', repeat: false });
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Alert', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAlert(id) },
    ]);
  };

  const activeAlerts = alerts.filter(a => a.active && !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Price Alerts</Text>
          <Text style={styles.subtitle}>{activeAlerts.length} active alerts</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />}
      >
        {activeAlerts.length === 0 && triggeredAlerts.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Bell size={48} color="#64748b" />
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptyText}>Create your first price alert to get notified</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setShowModal(true)}>
              <Text style={styles.emptyButtonText}>Create Alert</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          <>
            {activeAlerts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ACTIVE ALERTS</Text>
                {activeAlerts.map((alert) => (
                  <GlassCard key={alert.id} style={styles.alertCard}>
                    <View style={styles.alertHeader}>
                      <View style={styles.alertIcon}>
                        {alert.condition === 'above' || alert.condition === 'crosses_above' ? (
                          <TrendingUp size={20} color="#10b981" />
                        ) : (
                          <TrendingDown size={20} color="#ef4444" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.alertSymbol}>{alert.symbol}</Text>
                        <Text style={styles.alertCondition}>
                          {alert.condition.replace('_', ' ')} ${alert.target_price.toFixed(2)}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDelete(alert.id)} style={styles.deleteButton}>
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.alertFooter}>
                      <Text style={styles.alertDate}>
                        Created {new Date(alert.created_at).toLocaleDateString()}
                      </Text>
                      {alert.repeat && (
                        <View style={styles.repeatBadge}>
                          <Text style={styles.repeatText}>Repeat</Text>
                        </View>
                      )}
                    </View>
                  </GlassCard>
                ))}
              </View>
            )}

            {triggeredAlerts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>TRIGGERED ALERTS</Text>
                {triggeredAlerts.map((alert) => (
                  <GlassCard key={alert.id} style={[styles.alertCard, styles.triggeredCard]}>
                    <View style={styles.alertHeader}>
                      <View style={[styles.alertIcon, styles.triggeredIcon]}>
                        <CheckCircle size={20} color="#10b981" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.alertSymbol}>{alert.symbol}</Text>
                        <Text style={styles.alertCondition}>
                          Hit ${alert.target_price.toFixed(2)}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => resetAlert(alert.id)} style={styles.resetButton}>
                        <Text style={styles.resetText}>Reactivate</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.triggeredDate}>
                      Triggered {new Date(alert.triggered_at!).toLocaleString()}
                    </Text>
                  </GlassCard>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Price Alert</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Symbol</Text>
            <TextInput
              style={styles.input}
              value={newAlert.symbol}
              onChangeText={(text) => setNewAlert({ ...newAlert, symbol: text.toUpperCase() })}
              placeholder="AAPL"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Condition</Text>
            <View style={styles.conditionButtons}>
              {['above', 'below'].map((cond) => (
                <TouchableOpacity
                  key={cond}
                  style={[styles.conditionButton, newAlert.condition === cond && styles.conditionButtonActive]}
                  onPress={() => setNewAlert({ ...newAlert, condition: cond as any })}
                >
                  <Text style={[styles.conditionText, newAlert.condition === cond && styles.conditionTextActive]}>
                    {cond.charAt(0).toUpperCase() + cond.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Target Price</Text>
            <TextInput
              style={styles.input}
              value={newAlert.target_price}
              onChangeText={(text) => setNewAlert({ ...newAlert, target_price: text })}
              placeholder="150.00"
              placeholderTextColor="#64748b"
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={styles.repeatToggle}
              onPress={() => setNewAlert({ ...newAlert, repeat: !newAlert.repeat })}
            >
              <View style={[styles.checkbox, newAlert.repeat && styles.checkboxActive]}>
                {newAlert.repeat && <CheckCircle size={16} color="#fff" />}
              </View>
              <Text style={styles.repeatLabel}>Repeat alert after triggered</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setShowModal(false)}>
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonSave]} onPress={handleCreate}>
                <Text style={styles.modalButtonText}>Create Alert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8' },
  addButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 20 },
  emptyCard: { alignItems: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  emptyButton: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 12 },
  alertCard: { marginBottom: 12, padding: 16 },
  triggeredCard: { opacity: 0.7 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  alertIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  triggeredIcon: { backgroundColor: 'rgba(16, 185, 129, 0.3)' },
  alertSymbol: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 4 },
  alertCondition: { fontSize: 14, color: '#94a3b8' },
  deleteButton: { padding: 8 },
  alertFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertDate: { fontSize: 12, color: '#64748b' },
  repeatBadge: { backgroundColor: 'rgba(59, 130, 246, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  repeatText: { fontSize: 11, fontWeight: '600', color: '#3b82f6' },
  triggeredDate: { fontSize: 12, color: '#64748b', marginTop: 8 },
  resetButton: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  resetText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  modalClose: { fontSize: 24, color: '#94a3b8' },
  label: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff' },
  conditionButtons: { flexDirection: 'row', gap: 12 },
  conditionButton: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#334155', alignItems: 'center' },
  conditionButtonActive: { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  conditionText: { fontSize: 15, fontWeight: '600', color: '#94a3b8' },
  conditionTextActive: { color: '#3b82f6' },
  repeatToggle: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#334155', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  repeatLabel: { fontSize: 14, color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: '#334155' },
  modalButtonSave: { backgroundColor: '#3b82f6' },
  modalButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  modalButtonTextCancel: { fontSize: 16, fontWeight: '600', color: '#94a3b8' },
});
