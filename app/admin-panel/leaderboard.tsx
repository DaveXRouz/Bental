import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trophy, Award, Star } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function LeaderboardAdminScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [newBadge, setNewBadge] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('leaderboard')
      .select('*, profiles(full_name, email, trading_passport)')
      .order('rank', { ascending: true });
    setEntries(data || []);
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('leaderboard')
      .update({ featured: !currentStatus })
      .eq('id', id);
    if (!error) fetchLeaderboard();
  };

  const awardBadge = async () => {
    if (!newBadge || !selectedEntry) return;
    const badges = [...(selectedEntry.badges || []), newBadge];
    const { error } = await supabase
      .from('leaderboard')
      .update({ badges })
      .eq('id', selectedEntry.id);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Badge awarded');
      setNewBadge('');
      setSelectedEntry(null);
      fetchLeaderboard();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Leaderboard Management</Text>
          <Text style={styles.headerSubtitle}>{entries.length} entries</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {entries.map((entry) => (
          <View key={entry.id} style={[styles.entryCard, entry.featured && styles.featuredCard]}>
            <View style={styles.entryHeader}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{entry.rank || '-'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.userName}>{entry.profiles?.full_name}</Text>
                  {entry.featured && <Star size={16} color="#fbbf24" fill="#fbbf24" />}
                </View>
                <Text style={styles.userPassport}>{entry.profiles?.trading_passport}</Text>
                <Text style={styles.visibility}>{entry.public ? 'Public' : 'Private'}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Return</Text>
                <Text style={[styles.statValue, { color: entry.total_return_percent >= 0 ? '#10b981' : '#ef4444' }]}>
                  {entry.total_return_percent.toFixed(2)}%
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Win Rate</Text>
                <Text style={styles.statValue}>{entry.win_rate.toFixed(1)}%</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Trades</Text>
                <Text style={styles.statValue}>{entry.total_trades}</Text>
              </View>
            </View>

            {entry.badges && entry.badges.length > 0 && (
              <View style={styles.badgesRow}>
                {entry.badges.map((badge: string, idx: number) => (
                  <View key={idx} style={styles.badge}>
                    <Award size={12} color="#fbbf24" />
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, entry.featured && styles.featuredButton]}
                onPress={() => toggleFeatured(entry.id, entry.featured)}
              >
                <Star size={14} color={entry.featured ? '#fbbf24' : '#94a3b8'} />
                <Text style={styles.actionText}>{entry.featured ? 'Unfeature' : 'Feature'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setSelectedEntry(entry)}
              >
                <Award size={14} color="#3b82f6" />
                <Text style={styles.actionText}>Award Badge</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!selectedEntry} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Award Badge</Text>
            <Text style={styles.modalSubtitle}>
              To: {selectedEntry?.profiles?.full_name}
            </Text>
            <TextInput
              style={styles.input}
              value={newBadge}
              onChangeText={setNewBadge}
              placeholder="Badge name (e.g., Top Performer)"
              placeholderTextColor="#64748b"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => { setSelectedEntry(null); setNewBadge(''); }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={awardBadge}
              >
                <Text style={styles.saveButtonText}>Award</Text>
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
  content: { flex: 1, padding: 16 },
  entryCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  featuredCard: { borderWidth: 2, borderColor: '#fbbf24' },
  entryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  rankBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  userPassport: { fontSize: 13, color: '#64748b', marginTop: 4 },
  visibility: { fontSize: 11, color: '#3b82f6', marginTop: 4 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: '#0f172a', padding: 12, borderRadius: 8 },
  statLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '600', color: '#fff' },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#fbbf24' },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 8, backgroundColor: '#0f172a' },
  featuredButton: { backgroundColor: 'rgba(251, 191, 36, 0.1)' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 20 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 12, fontSize: 14, color: '#fff', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#334155' },
  saveButton: { backgroundColor: '#3b82f6' },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: '#94a3b8' },
  saveButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
