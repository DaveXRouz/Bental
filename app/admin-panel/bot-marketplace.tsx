import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bot, Plus, Edit2, Trash2, Eye, EyeOff, Star } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function BotMarketplaceAdmin() {
  const router = useRouter();
  const [bots, setBots] = useState<any[]>([]);
  const [editingBot, setEditingBot] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    const { data } = await supabase
      .from('bot_templates')
      .select('*')
      .order('created_at', { ascending: false });
    setBots(data || []);
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('bot_templates')
      .update({ published: !currentStatus })
      .eq('id', id);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', `Bot ${!currentStatus ? 'published' : 'unpublished'}`);
      fetchBots();
    }
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('bot_templates')
      .update({ featured: !currentStatus })
      .eq('id', id);
    if (!error) fetchBots();
  };

  const deleteBot = async (id: string) => {
    Alert.alert('Delete Bot', 'This will remove the bot template. Subscriptions will remain.', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('bot_templates').delete().eq('id', id);
          if (error) Alert.alert('Error', error.message);
          else fetchBots();
        },
      },
    ]);
  };

  const createBot = () => {
    setEditingBot({
      name: '',
      description: '',
      strategy_type: '',
      risk_level: 'medium',
      expected_return_percent: 0,
      min_investment: 1000,
      price_monthly: 0,
      published: false,
      featured: false,
    });
    setShowModal(true);
  };

  const saveBot = async () => {
    if (!editingBot.name || !editingBot.strategy_type) {
      Alert.alert('Error', 'Name and strategy type are required');
      return;
    }

    const { error } = editingBot.id
      ? await supabase.from('bot_templates').update(editingBot).eq('id', editingBot.id)
      : await supabase.from('bot_templates').insert([editingBot]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Bot saved');
      setShowModal(false);
      fetchBots();
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Bot Marketplace</Text>
          <Text style={styles.headerSubtitle}>{bots.length} bot templates</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={createBot}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {bots.map((bot) => (
          <View key={bot.id} style={[styles.botCard, bot.featured && styles.featuredCard]}>
            <View style={styles.botHeader}>
              <View style={styles.botIcon}>
                <Bot size={20} color="#8b5cf6" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.botName}>{bot.name}</Text>
                  {bot.featured && <Star size={16} color="#fbbf24" fill="#fbbf24" />}
                </View>
                <Text style={styles.botStrategy}>{bot.strategy_type}</Text>
              </View>
              <View style={[styles.statusBadge, bot.published && styles.statusPublished]}>
                <Text style={styles.statusText}>{bot.published ? 'Published' : 'Draft'}</Text>
              </View>
            </View>

            <View style={styles.botDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Risk Level:</Text>
                <Text style={[styles.detailValue, { color: getRiskColor(bot.risk_level) }]}>
                  {bot.risk_level?.toUpperCase()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expected Return:</Text>
                <Text style={styles.detailValue}>{bot.expected_return_percent}%</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price:</Text>
                <Text style={styles.detailValue}>
                  ${bot.price_monthly > 0 ? `${bot.price_monthly}/mo` : 'Free'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Subscribers:</Text>
                <Text style={styles.detailValue}>{bot.subscribers_count || 0}</Text>
              </View>
            </View>

            <View style={styles.botActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => togglePublish(bot.id, bot.published)}
              >
                {bot.published ? <EyeOff size={14} color="#f59e0b" /> : <Eye size={14} color="#10b981" />}
                <Text style={styles.actionText}>{bot.published ? 'Unpublish' : 'Publish'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, bot.featured && styles.featuredButton]}
                onPress={() => toggleFeatured(bot.id, bot.featured)}
              >
                <Star size={14} color={bot.featured ? '#fbbf24' : '#94a3b8'} />
                <Text style={styles.actionText}>{bot.featured ? 'Unfeature' : 'Feature'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => { setEditingBot(bot); setShowModal(true); }}
              >
                <Edit2 size={14} color="#3b82f6" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => deleteBot(bot.id)}>
                <Trash2 size={14} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingBot?.id ? 'Edit' : 'Create'} Bot Template</Text>
            <ScrollView>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={editingBot?.name || ''}
                onChangeText={(text) => setEditingBot({ ...editingBot, name: text })}
                placeholder="Bot name"
                placeholderTextColor="#64748b"
              />
              <Text style={styles.label}>Strategy Type *</Text>
              <TextInput
                style={styles.input}
                value={editingBot?.strategy_type || ''}
                onChangeText={(text) => setEditingBot({ ...editingBot, strategy_type: text })}
                placeholder="e.g., Momentum Trading"
                placeholderTextColor="#64748b"
              />
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={editingBot?.description || ''}
                onChangeText={(text) => setEditingBot({ ...editingBot, description: text })}
                placeholder="Describe the strategy"
                placeholderTextColor="#64748b"
                multiline
              />
              <Text style={styles.label}>Risk Level</Text>
              <View style={styles.riskButtons}>
                {['low', 'medium', 'high'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.riskButton, editingBot?.risk_level === level && styles.riskButtonActive]}
                    onPress={() => setEditingBot({ ...editingBot, risk_level: level })}
                  >
                    <Text style={[styles.riskButtonText, editingBot?.risk_level === level && styles.riskButtonTextActive]}>
                      {level.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Expected Return %</Text>
              <TextInput
                style={styles.input}
                value={editingBot?.expected_return_percent?.toString() || ''}
                onChangeText={(text) => setEditingBot({ ...editingBot, expected_return_percent: parseFloat(text) || 0 })}
                placeholder="10"
                placeholderTextColor="#64748b"
                keyboardType="decimal-pad"
              />
              <Text style={styles.label}>Monthly Price ($)</Text>
              <TextInput
                style={styles.input}
                value={editingBot?.price_monthly?.toString() || ''}
                onChangeText={(text) => setEditingBot({ ...editingBot, price_monthly: parseFloat(text) || 0 })}
                placeholder="0 for free"
                placeholderTextColor="#64748b"
                keyboardType="decimal-pad"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonSave]} onPress={saveBot}>
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  botCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  featuredCard: { borderWidth: 2, borderColor: '#fbbf24' },
  botHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  botIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(139, 92, 246, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  botName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  botStrategy: { fontSize: 13, color: '#64748b', marginTop: 4 },
  statusBadge: { backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPublished: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  botDetails: { backgroundColor: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { fontSize: 13, color: '#64748b' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#fff' },
  botActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 8, backgroundColor: '#0f172a' },
  featuredButton: { backgroundColor: 'rgba(251, 191, 36, 0.1)' },
  actionText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 12, fontSize: 14, color: '#fff' },
  riskButtons: { flexDirection: 'row', gap: 8 },
  riskButton: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 2, borderColor: '#334155', alignItems: 'center' },
  riskButtonActive: { borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)' },
  riskButtonText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  riskButtonTextActive: { color: '#8b5cf6' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: '#334155' },
  modalButtonSave: { backgroundColor: '#8b5cf6' },
  modalButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalButtonTextCancel: { fontSize: 15, fontWeight: '600', color: '#94a3b8' },
});
