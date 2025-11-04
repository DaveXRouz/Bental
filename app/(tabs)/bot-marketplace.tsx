import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { Bot, TrendingUp, Users, DollarSign, Activity, X, CheckCircle } from 'lucide-react-native';
import { useBotMarketplace } from '@/hooks/useBotMarketplace';
import { GlassCard } from '@/components/glass/GlassCard';
import { Screen } from '@/components/layout/Screen';

export default function BotMarketplaceScreen() {
  const { templates, subscriptions, loading, subscribe, unsubscribe, refresh } = useBotMarketplace();
  const [selectedBot, setSelectedBot] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleSubscribe = async (templateId: string) => {
    const { error } = await subscribe(templateId);
    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Success', 'Successfully subscribed to bot');
      setSelectedBot(null);
    }
  };

  const handleUnsubscribe = async (subscriptionId: string) => {
    Alert.alert('Unsubscribe', 'Are you sure you want to cancel this subscription?', [
      { text: 'Cancel' },
      {
        text: 'Unsubscribe',
        style: 'destructive',
        onPress: async () => {
          const { error } = await unsubscribe(subscriptionId);
          if (error) {
            Alert.alert('Error', error);
          } else {
            Alert.alert('Success', 'Subscription cancelled');
          }
        },
      },
    ]);
  };

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#64748b';
    }
  };

  const isSubscribed = (templateId: string) => {
    return subscriptions.some(s => s.template_id === templateId && s.status === 'active');
  };

  const featuredBots = templates.filter(t => t.featured);
  const allBots = templates.filter(t => !t.featured);

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Bot size={32} color="#8b5cf6" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Bot Marketplace</Text>
          <Text style={styles.subtitle}>{templates.length} trading strategies</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />}
      >
        {subscriptions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MY SUBSCRIPTIONS</Text>
            {subscriptions.map((sub) => (
              <GlassCard key={sub.id} style={styles.subscriptionCard}>
                <View style={styles.subHeader}>
                  <View style={styles.botIconActive}>
                    <Bot size={20} color="#10b981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.botName}>{sub.templates?.name}</Text>
                    <Text style={styles.botStrategy}>{sub.templates?.strategy_type}</Text>
                  </View>
                  <View style={[styles.statusBadge, styles.statusActive]}>
                    <Text style={styles.statusText}>{sub.status}</Text>
                  </View>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Return</Text>
                    <Text style={styles.statValue}>
                      {sub.templates?.total_return ? `${sub.templates.total_return.toFixed(2)}%` : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Win Rate</Text>
                    <Text style={styles.statValue}>
                      {sub.templates?.win_rate ? `${sub.templates.win_rate.toFixed(1)}%` : 'N/A'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.unsubscribeButton}
                  onPress={() => handleUnsubscribe(sub.id)}
                >
                  <Text style={styles.unsubscribeText}>Cancel Subscription</Text>
                </TouchableOpacity>
              </GlassCard>
            ))}
          </View>
        )}

        {featuredBots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FEATURED STRATEGIES</Text>
            {featuredBots.map((bot) => (
              <TouchableOpacity key={bot.id} onPress={() => setSelectedBot(bot)}>
                <GlassCard style={[styles.botCard, styles.featuredBotCard]}>
                  <View style={styles.botHeader}>
                    <View style={styles.botIcon}>
                      <Bot size={24} color="#8b5cf6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.botName}>{bot.name}</Text>
                      <Text style={styles.botStrategy}>{bot.strategy_type}</Text>
                    </View>
                    <View style={[styles.riskBadge, { backgroundColor: `${getRiskColor(bot.risk_level)}20` }]}>
                      <Text style={[styles.riskText, { color: getRiskColor(bot.risk_level) }]}>
                        {bot.risk_level?.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {bot.description && (
                    <Text style={styles.botDescription} numberOfLines={2}>{bot.description}</Text>
                  )}

                  <View style={styles.metricsRow}>
                    <View style={styles.metric}>
                      <TrendingUp size={16} color="#10b981" />
                      <Text style={styles.metricValue}>
                        {bot.expected_return_percent ? `${bot.expected_return_percent}%` : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.metric}>
                      <Users size={16} color="#3b82f6" />
                      <Text style={styles.metricValue}>{bot.subscribers_count}</Text>
                    </View>
                    <View style={styles.metric}>
                      <DollarSign size={16} color="#fbbf24" />
                      <Text style={styles.metricValue}>
                        ${bot.price_monthly > 0 ? `${bot.price_monthly}/mo` : 'Free'}
                      </Text>
                    </View>
                  </View>

                  {isSubscribed(bot.id) && (
                    <View style={styles.subscribedBanner}>
                      <CheckCircle size={16} color="#10b981" />
                      <Text style={styles.subscribedText}>Subscribed</Text>
                    </View>
                  )}
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ALL STRATEGIES</Text>
          {allBots.map((bot) => (
            <TouchableOpacity key={bot.id} onPress={() => setSelectedBot(bot)}>
              <GlassCard style={styles.botCard}>
                <View style={styles.botHeader}>
                  <View style={styles.botIcon}>
                    <Bot size={20} color="#8b5cf6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.botName}>{bot.name}</Text>
                    <Text style={styles.botStrategy}>{bot.strategy_type}</Text>
                  </View>
                  <View style={[styles.riskBadge, { backgroundColor: `${getRiskColor(bot.risk_level)}20` }]}>
                    <Text style={[styles.riskText, { color: getRiskColor(bot.risk_level) }]}>
                      {bot.risk_level?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metric}>
                    <TrendingUp size={14} color="#10b981" />
                    <Text style={styles.metricValueSmall}>
                      {bot.expected_return_percent ? `${bot.expected_return_percent}%` : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Users size={14} color="#3b82f6" />
                    <Text style={styles.metricValueSmall}>{bot.subscribers_count}</Text>
                  </View>
                  {isSubscribed(bot.id) && (
                    <View style={styles.subscribedBadge}>
                      <CheckCircle size={12} color="#10b981" />
                    </View>
                  )}
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!selectedBot} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.modalHeaderRow}>
                  <View style={styles.botIconLarge}>
                    <Bot size={32} color="#8b5cf6" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.modalTitle}>{selectedBot?.name}</Text>
                    <Text style={styles.modalStrategy}>{selectedBot?.strategy_type}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedBot(null)} style={styles.closeButton}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Overview</Text>
                <Text style={styles.modalText}>{selectedBot?.description}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Performance Metrics</Text>
                <View style={styles.modalMetricsGrid}>
                  <View style={styles.modalMetric}>
                    <Text style={styles.modalMetricLabel}>Expected Return</Text>
                    <Text style={styles.modalMetricValue}>
                      {selectedBot?.expected_return_percent}%
                    </Text>
                  </View>
                  <View style={styles.modalMetric}>
                    <Text style={styles.modalMetricLabel}>Risk Level</Text>
                    <Text style={[styles.modalMetricValue, { color: getRiskColor(selectedBot?.risk_level) }]}>
                      {selectedBot?.risk_level?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.modalMetric}>
                    <Text style={styles.modalMetricLabel}>Min Investment</Text>
                    <Text style={styles.modalMetricValue}>
                      ${selectedBot?.min_investment?.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.modalMetric}>
                    <Text style={styles.modalMetricLabel}>Subscribers</Text>
                    <Text style={styles.modalMetricValue}>
                      {selectedBot?.subscribers_count}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Pricing</Text>
                <View style={styles.pricingCard}>
                  <Text style={styles.priceAmount}>
                    ${selectedBot?.price_monthly > 0 ? selectedBot?.price_monthly : 'Free'}
                  </Text>
                  {selectedBot?.price_monthly > 0 && (
                    <Text style={styles.priceFrequency}>per month</Text>
                  )}
                </View>
              </View>
            </ScrollView>

            {!isSubscribed(selectedBot?.id) && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.subscribeButton}
                  onPress={() => handleSubscribe(selectedBot?.id)}
                >
                  <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8' },
  content: { flex: 1, padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 12 },
  subscriptionCard: { padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#10b981' },
  subHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  botIconActive: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#334155' },
  statusActive: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#10b981' },
  unsubscribeButton: { marginTop: 12, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ef4444', alignItems: 'center' },
  unsubscribeText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
  botCard: { padding: 16, marginBottom: 12 },
  featuredBotCard: { borderWidth: 2, borderColor: '#8b5cf6' },
  botHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  botIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(139, 92, 246, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  botIconLarge: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(139, 92, 246, 0.2)', justifyContent: 'center', alignItems: 'center' },
  botName: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  botStrategy: { fontSize: 13, color: '#94a3b8' },
  botDescription: { fontSize: 14, color: '#cbd5e1', lineHeight: 20, marginBottom: 12 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  riskText: { fontSize: 11, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', gap: 16 },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  metricValueSmall: { fontSize: 13, fontWeight: '600', color: '#fff' },
  subscribedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  subscribedText: { fontSize: 13, fontWeight: '600', color: '#10b981' },
  subscribedBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  statItem: { flex: 1 },
  statLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '600', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', padding: 24, borderBottomWidth: 1, borderBottomColor: '#334155' },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  modalStrategy: { fontSize: 14, color: '#94a3b8' },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  modalBody: { padding: 24 },
  modalSection: { marginBottom: 24 },
  modalSectionTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 12 },
  modalText: { fontSize: 15, color: '#cbd5e1', lineHeight: 24 },
  modalMetricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  modalMetric: { flex: 1, minWidth: '45%', backgroundColor: '#0f172a', padding: 16, borderRadius: 12 },
  modalMetricLabel: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  modalMetricValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  pricingCard: { backgroundColor: '#0f172a', padding: 24, borderRadius: 12, alignItems: 'center' },
  priceAmount: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  priceFrequency: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  modalFooter: { padding: 24, borderTopWidth: 1, borderTopColor: '#334155' },
  subscribeButton: { backgroundColor: '#8b5cf6', padding: 16, borderRadius: 12, alignItems: 'center' },
  subscribeButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
