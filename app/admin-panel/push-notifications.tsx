import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, Bell, Users, CheckCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface PushToken {
  id: string;
  user_id: string;
  token: string;
  device_type: string;
  device_name: string;
  profiles?: {
    email: string;
    full_name: string;
  };
}

export default function PushNotificationsAdmin() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [tokens, setTokens] = useState<PushToken[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalDevices: 0, activeUsers: 0 });

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const { data } = await supabase
        .from('push_notification_tokens')
        .select('*, profiles(email, full_name)')
        .order('updated_at', { ascending: false });

      setTokens(data || []);
      setStats({
        totalDevices: data?.length || 0,
        activeUsers: new Set(data?.map(t => t.user_id)).size || 0,
      });
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  };

  const toggleToken = (tokenId: string) => {
    const newSelected = new Set(selectedTokens);
    if (newSelected.has(tokenId)) {
      newSelected.delete(tokenId);
    } else {
      newSelected.add(tokenId);
    }
    setSelectedTokens(newSelected);
    setSelectAll(newSelected.size === tokens.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedTokens(new Set());
    } else {
      setSelectedTokens(new Set(tokens.map(t => t.id)));
    }
    setSelectAll(!selectAll);
  };

  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please enter both title and message');
      return;
    }

    if (selectedTokens.size === 0) {
      Alert.alert('Error', 'Please select at least one device');
      return;
    }

    Alert.alert(
      'Send Notification',
      `Send to ${selectedTokens.size} device(s)?`,
      [
        { text: 'Cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setLoading(true);
            try {
              const selectedTokensList = tokens.filter(t => selectedTokens.has(t.id));
              const messages = selectedTokensList.map(token => ({
                to: token.token,
                sound: 'default',
                title: title.trim(),
                body: message.trim(),
                data: { screen: 'notifications' },
              }));

              const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(messages),
              });

              if (!response.ok) {
                throw new Error('Failed to send notifications');
              }

              const uniqueUserIds = new Set(selectedTokensList.map(t => t.user_id));
              await Promise.all(
                Array.from(uniqueUserIds).map(userId =>
                  supabase.from('notifications').insert({
                    user_id: userId,
                    title: title.trim(),
                    message: message.trim(),
                    type: 'admin_broadcast',
                    read: false,
                  })
                )
              );

              Alert.alert('Success', 'Notifications sent successfully');
              setTitle('');
              setMessage('');
              setSelectedTokens(new Set());
              setSelectAll(false);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to send notifications');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Push Notifications</Text>
          <Text style={styles.headerSubtitle}>Send notifications to users</Text>
        </View>
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={sendNotification}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.sendButtonText}>Sending...</Text>
          ) : (
            <>
              <Send size={18} color="#fff" />
              <Text style={styles.sendButtonText}>Send</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Bell size={20} color="#3b82f6" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.statValue}>{stats.totalDevices}</Text>
            <Text style={styles.statLabel}>Devices</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <Users size={20} color="#10b981" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.statValue}>{stats.activeUsers}</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <CheckCircle size={20} color="#f59e0b" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.statValue}>{selectedTokens.size}</Text>
            <Text style={styles.statLabel}>Selected</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.composerCard}>
          <Text style={styles.sectionTitle}>Compose Notification</Text>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter notification title"
            placeholderTextColor="#64748b"
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter notification message"
            placeholderTextColor="#64748b"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            maxLength={200}
          />

          <Text style={styles.charCount}>
            {message.length}/200 characters
          </Text>
        </View>

        <View style={styles.recipientsCard}>
          <View style={styles.recipientsHeader}>
            <Text style={styles.sectionTitle}>Recipients ({tokens.length})</Text>
            <TouchableOpacity style={styles.selectAllButton} onPress={toggleSelectAll}>
              <Text style={styles.selectAllText}>{selectAll ? 'Deselect All' : 'Select All'}</Text>
            </TouchableOpacity>
          </View>

          {tokens.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={40} color="#64748b" />
              <Text style={styles.emptyTitle}>No registered devices</Text>
              <Text style={styles.emptyText}>Users need to enable push notifications</Text>
            </View>
          ) : (
            tokens.map((token) => (
              <TouchableOpacity
                key={token.id}
                style={[
                  styles.tokenCard,
                  selectedTokens.has(token.id) && styles.tokenCardSelected,
                ]}
                onPress={() => toggleToken(token.id)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.tokenUser}>{token.profiles?.full_name || 'Unknown'}</Text>
                  <Text style={styles.tokenEmail}>{token.profiles?.email}</Text>
                  <View style={styles.tokenMeta}>
                    <Text style={styles.tokenDevice}>{token.device_type}</Text>
                    <Text style={styles.tokenSeparator}>•</Text>
                    <Text style={styles.tokenDevice}>{token.device_name}</Text>
                  </View>
                </View>
                <View style={[
                  styles.checkbox,
                  selectedTokens.has(token.id) && styles.checkboxSelected,
                ]}>
                  {selectedTokens.has(token.id) && (
                    <CheckCircle size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 16
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#64748b' },
  content: { flex: 1, padding: 16 },
  composerCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: '#94a3b8', marginBottom: 8 },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
    marginBottom: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: '#64748b', textAlign: 'right', marginTop: -8 },
  recipientsCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 20 },
  recipientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  selectAllButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#334155' },
  selectAllText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tokenCardSelected: { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  tokenUser: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 4 },
  tokenEmail: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  tokenMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tokenDevice: { fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' },
  tokenSeparator: { fontSize: 11, color: '#64748b' },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: '#10b981', borderColor: '#10b981' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
});
