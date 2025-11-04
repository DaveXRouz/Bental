import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Send, Users } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function NotificationsAdmin() {
  const router = useRouter();
  const [tokens, setTokens] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, ios: 0, android: 0 });
  const [notification, setNotification] = useState({ title: '', body: '', data: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    const { data } = await supabase
      .from('push_notification_tokens')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false });

    setTokens(data || []);
    setStats({
      total: data?.length || 0,
      active: data?.filter(t => t.active).length || 0,
      ios: data?.filter(t => t.platform === 'ios').length || 0,
      android: data?.filter(t => t.platform === 'android').length || 0,
    });
  };

  const sendBroadcastNotification = async () => {
    if (!notification.title || !notification.body) {
      Alert.alert('Error', 'Title and body are required');
      return;
    }

    setSending(true);
    try {
      // Get all active tokens
      const { data: activeTokens } = await supabase
        .from('push_notification_tokens')
        .select('token')
        .eq('active', true);

      if (!activeTokens || activeTokens.length === 0) {
        Alert.alert('No Recipients', 'No active devices to send to');
        setSending(false);
        return;
      }

      // Prepare notification payload
      const messages = activeTokens.map(t => ({
        to: t.token,
        title: notification.title,
        body: notification.body,
        data: notification.data ? JSON.parse(notification.data) : {},
        sound: 'default',
        priority: 'high',
      }));

      // Send via Expo Push API
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();

      if (result.data && result.data.length > 0) {
        const successCount = result.data.filter((r: any) => r.status === 'ok').length;
        Alert.alert('Success', `Sent to ${successCount} devices`);
        setNotification({ title: '', body: '', data: '' });
      } else {
        Alert.alert('Error', 'Failed to send notifications');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSending(false);
    }
  };

  const sendTestNotification = async () => {
    if (tokens.length === 0) {
      Alert.alert('No Devices', 'No registered devices');
      return;
    }

    const firstToken = tokens.find(t => t.active)?.token;
    if (!firstToken) {
      Alert.alert('No Active Devices', 'No active devices to test with');
      return;
    }

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: firstToken,
          title: 'Test Notification',
          body: 'This is a test from the admin panel',
          sound: 'default',
        }),
      });

      const result = await response.json();
      if (result.data && result.data[0].status === 'ok') {
        Alert.alert('Success', 'Test notification sent');
      } else {
        Alert.alert('Error', 'Failed to send test');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Push Notifications</Text>
          <Text style={styles.headerSubtitle}>{stats.active} active devices</Text>
        </View>
        <TouchableOpacity style={styles.testButton} onPress={sendTestNotification}>
          <Bell size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Users size={20} color="#3b82f6" />
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Bell size={20} color="#10b981" />
          <Text style={styles.statValue}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.platformIcon}>🍎</Text>
          <Text style={styles.statValue}>{stats.ios}</Text>
          <Text style={styles.statLabel}>iOS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.platformIcon}>🤖</Text>
          <Text style={styles.statValue}>{stats.android}</Text>
          <Text style={styles.statLabel}>Android</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BROADCAST MESSAGE</Text>
          <View style={styles.broadcastCard}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={notification.title}
              onChangeText={(text) => setNotification({ ...notification, title: text })}
              placeholder="Notification title"
              placeholderTextColor="#64748b"
            />

            <Text style={styles.label}>Body</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={notification.body}
              onChangeText={(text) => setNotification({ ...notification, body: text })}
              placeholder="Notification message"
              placeholderTextColor="#64748b"
              multiline
            />

            <Text style={styles.label}>Data (JSON, optional)</Text>
            <TextInput
              style={[styles.input, { height: 60, fontFamily: 'monospace' }]}
              value={notification.data}
              onChangeText={(text) => setNotification({ ...notification, data: text })}
              placeholder='{"key": "value"}'
              placeholderTextColor="#64748b"
              multiline
            />

            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={sendBroadcastNotification}
              disabled={sending}
            >
              <Send size={18} color="#fff" />
              <Text style={styles.sendButtonText}>
                {sending ? 'Sending...' : `Send to ${stats.active} Devices`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REGISTERED DEVICES</Text>
          {tokens.map((token) => (
            <View key={token.id} style={styles.deviceCard}>
              <View style={styles.deviceHeader}>
                <View style={[styles.deviceIcon, token.active ? styles.deviceIconActive : styles.deviceIconInactive]}>
                  <Bell size={16} color={token.active ? '#10b981' : '#64748b'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deviceUser}>{token.profiles?.full_name}</Text>
                  <Text style={styles.deviceEmail}>{token.profiles?.email}</Text>
                </View>
                <View style={[styles.platformBadge, { backgroundColor: token.platform === 'ios' ? '#3b82f6' : '#10b981' }]}>
                  <Text style={styles.platformText}>{token.platform?.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.deviceDetails}>
                <Text style={styles.deviceDetailText}>
                  {token.device_info?.brand} {token.device_info?.modelName}
                </Text>
                <Text style={styles.deviceDetailText}>
                  {token.device_info?.osName} {token.device_info?.osVersion}
                </Text>
                <Text style={styles.deviceDate}>
                  Registered {new Date(token.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}

          {tokens.length === 0 && (
            <View style={styles.emptyState}>
              <Bell size={48} color="#64748b" />
              <Text style={styles.emptyTitle}>No devices registered</Text>
              <Text style={styles.emptyText}>Users need to enable notifications in the app</Text>
            </View>
          )}
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
  testButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase' },
  platformIcon: { fontSize: 24 },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 12 },
  broadcastCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 12, fontSize: 14, color: '#fff' },
  sendButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10b981', padding: 16, borderRadius: 8, marginTop: 20 },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  deviceCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  deviceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  deviceIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  deviceIconActive: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  deviceIconInactive: { backgroundColor: '#0f172a' },
  deviceUser: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 4 },
  deviceEmail: { fontSize: 13, color: '#64748b' },
  platformBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  platformText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  deviceDetails: { backgroundColor: '#0f172a', borderRadius: 8, padding: 12 },
  deviceDetailText: { fontSize: 13, color: '#94a3b8', marginBottom: 4 },
  deviceDate: { fontSize: 12, color: '#64748b', marginTop: 4 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
});
