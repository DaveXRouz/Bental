import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Settings, Shield } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function ConfigurationPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<any[]>([]);
  const [featureFlags, setFeatureFlags] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'config' | 'features'>('config');

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
                const value = JSON.parse(config.value);
                return (
                  <View key={config.id} style={styles.configItem}>
                    <Text style={styles.configKey}>{config.key.replace(/_/g, ' ')}</Text>
                    <Text style={styles.configDesc}>{config.description}</Text>
                    <Text style={styles.configValue}>
                      {typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : String(value)}
                    </Text>
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
  configKey: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8, textTransform: 'capitalize' },
  configDesc: { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  configValue: { fontSize: 14, color: '#3b82f6', fontWeight: '500' },
  featureFlag: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: 20, borderRadius: 12, marginBottom: 12 },
  flagContent: { flex: 1, marginRight: 16 },
  flagName: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 6 },
  flagDesc: { fontSize: 13, color: '#94a3b8' },
  infoBox: { flexDirection: 'row', backgroundColor: '#1e40af20', borderWidth: 1, borderColor: '#3b82f6', padding: 20, borderRadius: 12, gap: 16 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#3b82f6', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#94a3b8' },
});
