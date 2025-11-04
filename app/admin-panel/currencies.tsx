import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, DollarSign, Edit2, RefreshCw } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function CurrenciesAdmin() {
  const router = useRouter();
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [showRateModal, setShowRateModal] = useState(false);
  const [editingRate, setEditingRate] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [currData, rateData] = await Promise.all([
      supabase.from('currencies').select('*').order('display_order'),
      supabase.from('exchange_rates').select('*').order('from_currency'),
    ]);
    setCurrencies(currData.data || []);
    setRates(rateData.data || []);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('currencies')
      .update({ active: !currentStatus })
      .eq('id', id);
    if (!error) fetchData();
  };

  const updateRate = async () => {
    if (!editingRate.from_currency || !editingRate.to_currency || !editingRate.rate) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    const { error } = await supabase
      .from('exchange_rates')
      .upsert([{
        from_currency: editingRate.from_currency,
        to_currency: editingRate.to_currency,
        rate: parseFloat(editingRate.rate),
        updated_at: new Date().toISOString(),
      }], {
        onConflict: 'from_currency,to_currency'
      });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Exchange rate updated');
      setShowRateModal(false);
      fetchData();
    }
  };

  const generateRates = () => {
    setEditingRate({ from_currency: 'USD', to_currency: '', rate: '' });
    setShowRateModal(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Currency Management</Text>
          <Text style={styles.headerSubtitle}>{currencies.length} currencies</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={generateRates}>
          <RefreshCw size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORTED CURRENCIES</Text>
          {currencies.map((currency) => (
            <View key={currency.id} style={styles.currencyCard}>
              <View style={styles.currencyIcon}>
                <DollarSign size={20} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.currencyCode}>{currency.code}</Text>
                <Text style={styles.currencyName}>{currency.name}</Text>
              </View>
              <View style={styles.currencySymbol}>
                <Text style={styles.symbolText}>{currency.symbol}</Text>
              </View>
              <TouchableOpacity
                style={[styles.activeToggle, currency.active && styles.activeToggleOn]}
                onPress={() => toggleActive(currency.id, currency.active)}
              >
                <Text style={[styles.activeText, currency.active && styles.activeTextOn]}>
                  {currency.active ? 'Active' : 'Inactive'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXCHANGE RATES</Text>
          {rates.map((rate, index) => (
            <View key={index} style={styles.rateCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ratePair}>
                  {rate.from_currency} → {rate.to_currency}
                </Text>
                <Text style={styles.rateUpdated}>
                  Updated {new Date(rate.updated_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.rateValue}>
                <Text style={styles.rateNumber}>{rate.rate.toFixed(4)}</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setEditingRate(rate);
                  setShowRateModal(true);
                }}
              >
                <Edit2 size={16} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          ))}
          {rates.length === 0 && (
            <View style={styles.emptyState}>
              <RefreshCw size={48} color="#64748b" />
              <Text style={styles.emptyTitle}>No exchange rates</Text>
              <Text style={styles.emptyText}>Click + to add rates</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showRateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Exchange Rate</Text>
            <Text style={styles.label}>From Currency</Text>
            <TextInput
              style={styles.input}
              value={editingRate?.from_currency || ''}
              onChangeText={(text) => setEditingRate({ ...editingRate, from_currency: text.toUpperCase() })}
              placeholder="USD"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
              maxLength={3}
            />
            <Text style={styles.label}>To Currency</Text>
            <TextInput
              style={styles.input}
              value={editingRate?.to_currency || ''}
              onChangeText={(text) => setEditingRate({ ...editingRate, to_currency: text.toUpperCase() })}
              placeholder="EUR"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
              maxLength={3}
            />
            <Text style={styles.label}>Exchange Rate</Text>
            <TextInput
              style={styles.input}
              value={editingRate?.rate?.toString() || ''}
              onChangeText={(text) => setEditingRate({ ...editingRate, rate: text })}
              placeholder="0.85"
              placeholderTextColor="#64748b"
              keyboardType="decimal-pad"
            />
            <Text style={styles.helper}>
              Example: 1 {editingRate?.from_currency} = {editingRate?.rate} {editingRate?.to_currency}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowRateModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={updateRate}
              >
                <Text style={styles.modalButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#334155', gap: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 12 },
  currencyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  currencyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  currencyCode: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  currencyName: { fontSize: 13, color: '#64748b' },
  currencySymbol: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 12 },
  symbolText: { fontSize: 18, fontWeight: 'bold', color: '#10b981' },
  activeToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#334155' },
  activeToggleOn: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  activeText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  activeTextOn: { color: '#10b981' },
  rateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  ratePair: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  rateUpdated: { fontSize: 12, color: '#64748b' },
  rateValue: { backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginRight: 12 },
  rateNumber: { fontSize: 18, fontWeight: 'bold', color: '#10b981' },
  editButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 12, fontSize: 14, color: '#fff' },
  helper: { fontSize: 12, color: '#64748b', marginTop: 8, fontStyle: 'italic' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: '#334155' },
  modalButtonSave: { backgroundColor: '#10b981' },
  modalButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalButtonTextCancel: { fontSize: 15, fontWeight: '600', color: '#94a3b8' },
});
