import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Activity } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    console.clear();
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('admin_activity_log')
      .select('*, profiles!admin_activity_log_admin_user_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setLogs(data);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Activity Logs</Text>
          <Text style={styles.headerSubtitle}>{logs.length} entries</Text>
        </View>
      </View>
      <ScrollView style={styles.content}>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>No activity logs yet</Text>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <Activity size={16} color="#3b82f6" />
              <View style={styles.logContent}>
                <Text style={styles.logAction}>{log.action_type}</Text>
                <Text style={styles.logMeta}>
                  by {log.profiles?.full_name || 'Unknown'} •{' '}
                  {new Date(log.created_at).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
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
  content: { flex: 1, padding: 16 },
  logItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 8, marginBottom: 12, gap: 12 },
  logContent: { flex: 1 },
  logAction: { fontSize: 14, color: '#e2e8f0', fontWeight: '500', marginBottom: 4 },
  logMeta: { fontSize: 12, color: '#94a3b8' },
  emptyText: { textAlign: 'center', color: '#64748b', fontSize: 14, padding: 24 },
});
