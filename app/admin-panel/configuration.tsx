import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Settings, Shield, Edit2, Check, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { safeDatabaseJson } from '@/utils/safe-json-parser';

export default function ConfigurationPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<any[]>([]);
  const [featureFlags, setFeatureFlags] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'config' | 'features'>('config');
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchData();
    setupRealtimeSync();
  }, []);

  const fetchData = async () => {
    const [configRes, flagsRes] = await Promise.all([
      supabase.from('app_configuration').select('*').order('category'),
      supabase.from('feature_flags').select('*').order('flag_name'),
    ]);
    if (configRes.data) setConfigs(configRes.data);
    if (flagsRes.data) setFeatureFlags(flagsRes.data);
  };

  const setupRealtimeSync = () => {
    const channel = supabase
      .channel('config-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_configuration' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feature_flags' }, fetchData)
      .subscribe();
    return () => supabase.removeChannel(channel);
  };

  const handleToggleFeature = async (flag: any) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: !flag.is_enabled })
        .eq('id', flag.id);
      if (error) throw error;
      await supabase.rpc('log_admin_action', {
        p_action_type: 'feature_flag_toggle',
        p_target_entity: 'feature_flags',
        p_target_entity_id: flag.id,
        p_changes: { flag_name: flag.flag_name, old: flag.is_enabled, new: !flag.is_enabled },
      });
      setFeatureFlags((prev) =>
        prev.map((f) => (f.id === flag.id ? { ...f, is_enabled: !f.is_enabled } : f))
      );
      Alert.alert('Success', 'Feature flag updated');
    } catch (e) {
      Alert.alert('Error', 'Failed to update');
    }
  };

  const handleToggleConfig = async (config: any) => {
    try {
      const currentValue = safeDatabaseJson(config.value, 'app_config.value', false);
      const newValue = !currentValue;
      const { error } = await supabase
        .from('app_configuration')
        .update({ value: newValue })
        .eq('id', config.id);
      if (error) throw error;
      await supabase.rpc('log_admin_action', {
        p_action_type: 'config_update',
        p_target_entity: 'app_configuration',
        p_target_entity_id: config.id,
        p_changes: { key: config.key, old: currentValue, new: newValue },
      });
      setConfigs((prev) =>
        prev.map((c) => (c.id === config.id ? { ...c, value: newValue } : c))
      );
      Alert.alert('Success', 'Configuration updated');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update');
    }
  };

  const handleEditConfig = (config: any) => {
    const value = safeDatabaseJson(config.value, 'app_config.value', '');
    setEditingConfig(config);
    setEditValue(String(value));
  };

  const handleSaveConfig = async () => {
    if (!editingConfig) return;
    try {
      const oldValue = safeDatabaseJson(editingConfig.value, 'editingConfig.value', null);
      let newValue: any = editValue;
      if (editingConfig.data_type === 'number') {
        newValue = parseFloat(editValue);
        if (isNaN(newValue)) {
          Alert.alert('Error', 'Invalid number');
          return;
        }
      } else if (editingConfig.data_type === 'boolean') {
        newValue = editValue.toLowerCase() === 'true';
      }
      const { error } = await supabase
        .from('app_configuration')
        .update({ value: newValue })
        .eq('id', editingConfig.id);
      if (error) throw error;
      await supabase.rpc('log_admin_action', {
        p_action_type: 'config_update',
        p_target_entity: 'app_configuration',
        p_target_entity_id: editingConfig.id,
        p_changes: { key: editingConfig.key, old: oldValue, new: newValue },
      });
      setConfigs((prev) =>
        prev.map((c) => (c.id === editingConfig.id ? { ...c, value: newValue } : c))
      );
      setEditingConfig(null);
      setEditValue('');
      Alert.alert('Success', 'Configuration updated');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update');
    }
  };

  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.category]) acc[config.category] = [];
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Configuration</Text>
          <Text style={styles.headerSubtitle}>App settings & features</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'config' && styles.tabActive]}
          onPress={() => setActiveTab('config')}
        >
          <Settings size={20} color={activeTab === 'config' ? '#3b82f6' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'config' && styles.tabTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'features' && styles.tabActive]}
          onPress={() => setActiveTab('features')}
        >
          <Shield size={20} color={activeTab === 'features' ? '#3b82f6' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'features' && styles.tabTextActive]}>
            Feature Flags
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'config' ? (
          Object.entries(groupedConfigs).map(([category, items]) => (
            <View key={category} style={styles.section}>
              <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
              {(items as any[]).map((config: any) => {
                const value = safeDatabaseJson(config.value, 'app_config.value', null);
                const isBoolean = typeof value === 'boolean';
                const isString = typeof value === 'string';
                const isNumber = typeof value === 'number';
                return (
                  <View key={config.id} style={styles.configItem}>
                    <View style={styles.configHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.configKey}>{config.key.replace(/_/g, ' ')}</Text>
                        <Text style={styles.configDesc}>{config.description}</Text>
                      </View>
                      {isBoolean ? (
                        <Switch
                          value={value}
                          onValueChange={() => handleToggleConfig(config)}
                          trackColor={{ false: '#334155', true: '#10b981' }}
                          thumbColor="#fff"
                        />
                      ) : (
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => handleEditConfig(config)}
                        >
                          <Edit2 size={16} color="#3b82f6" />
                        </TouchableOpacity>
                      )}
                    </View>
                    {!isBoolean && (
                      <Text style={styles.configValue}>
                        {String(value)}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))
        ) : (
          <View style={styles.section}>
            <Text style={styles.categoryTitle}>FEATURE FLAGS</Text>
            {featureFlags.map((flag) => (
              <View key={flag.id} style={styles.featureFlag}>
                <View style={styles.flagContent}>
                  <Text style={styles.flagName}>{flag.flag_name}</Text>
                  <Text style={styles.flagDesc}>{flag.description}</Text>
                </View>
                <Switch
                  value={flag.is_enabled}
                  onValueChange={() => handleToggleFeature(flag)}
                  trackColor={{ false: '#334155', true: '#10b981' }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoBox}>
          <Shield size={20} color="#3b82f6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Real-time Sync Active</Text>
            <Text style={styles.infoText}>Changes sync instantly to all users</Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={editingConfig !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingConfig(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Configuration</Text>
              <TouchableOpacity onPress={() => setEditingConfig(null)}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            {editingConfig && (
              <>
                <Text style={styles.modalLabel}>{editingConfig.key.replace(/_/g, ' ')}</Text>
                <Text style={styles.modalDesc}>{editingConfig.description}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  placeholder={`Enter ${editingConfig.data_type} value`}
                  placeholderTextColor="#64748b"
                  keyboardType={editingConfig.data_type === 'number' ? 'numeric' : 'default'}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setEditingConfig(null)}
                  >
                    <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSave]}
                    onPress={handleSaveConfig}
                  >
                    <Check size={18} color="#fff" />
                    <Text style={styles.modalButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  tabs: { flexDirection: 'row', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, gap: 8 },
  tabActive: { backgroundColor: '#1e40af20' },
  tabText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
  tabTextActive: { color: '#3b82f6', fontWeight: '600' },
  content: { flex: 1, padding: 24 },
  section: { marginBottom: 32 },
  categoryTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 16 },
  configItem: { backgroundColor: '#1e293b', padding: 20, borderRadius: 12, marginBottom: 12 },
  configHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  configKey: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4, textTransform: 'capitalize' },
  configDesc: { fontSize: 13, color: '#94a3b8' },
  configValue: { fontSize: 14, color: '#3b82f6', fontWeight: '500', marginTop: 8 },
  editButton: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#1e40af20', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24, width: '100%', maxWidth: 500, borderWidth: 1, borderColor: '#334155' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  modalLabel: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8, textTransform: 'capitalize' },
  modalDesc: { fontSize: 13, color: '#94a3b8', marginBottom: 16 },
  modalInput: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 12, fontSize: 15, color: '#fff', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 8, gap: 8 },
  modalButtonCancel: { backgroundColor: '#334155' },
  modalButtonSave: { backgroundColor: '#3b82f6' },
  modalButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalButtonTextCancel: { fontSize: 15, fontWeight: '600', color: '#94a3b8' },
  featureFlag: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: 20, borderRadius: 12, marginBottom: 12 },
  flagContent: { flex: 1, marginRight: 16 },
  flagName: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 6 },
  flagDesc: { fontSize: 13, color: '#94a3b8' },
  infoBox: { flexDirection: 'row', backgroundColor: '#1e40af20', borderWidth: 1, borderColor: '#3b82f6', padding: 20, borderRadius: 12, gap: 16 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#3b82f6', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#94a3b8' },
});
