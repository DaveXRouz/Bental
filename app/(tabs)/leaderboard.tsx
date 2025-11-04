import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Switch } from 'react-native';
import { Trophy, Medal, TrendingUp, Award, Eye, EyeOff } from 'lucide-react-native';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { GlassCard } from '@/components/glass/GlassCard';
import { Screen } from '@/components/layout/Screen';

export default function LeaderboardScreen() {
  const { entries, userRank, loading, togglePublicProfile, refresh } = useLeaderboard(100);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={24} color="#fbbf24" />;
    if (rank === 2) return <Medal size={24} color="#94a3b8" />;
    if (rank === 3) return <Medal size={24} color="#fb923c" />;
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#fbbf24';
    if (rank === 2) return '#94a3b8';
    if (rank === 3) return '#fb923c';
    return '#64748b';
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Trophy size={32} color="#fbbf24" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.subtitle}>Top {entries.length} traders</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />}
      >
        {userRank && (
          <GlassCard style={styles.userRankCard}>
            <View style={styles.userRankHeader}>
              <View>
                <Text style={styles.userRankLabel}>Your Rank</Text>
                <Text style={styles.userRankValue}>#{userRank.rank || 'Unranked'}</Text>
              </View>
              <View style={styles.visibilityToggle}>
                {userRank.public ? <Eye size={20} color="#10b981" /> : <EyeOff size={20} color="#64748b" />}
                <Text style={styles.toggleLabel}>{userRank.public ? 'Public' : 'Private'}</Text>
                <Switch
                  value={userRank.public}
                  onValueChange={togglePublicProfile}
                  trackColor={{ false: '#334155', true: '#10b98180' }}
                  thumbColor={userRank.public ? '#10b981' : '#94a3b8'}
                />
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Return</Text>
                <Text style={[styles.statValue, { color: userRank.total_return_percent >= 0 ? '#10b981' : '#ef4444' }]}>
                  {userRank.total_return_percent >= 0 ? '+' : ''}{userRank.total_return_percent.toFixed(2)}%
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Win Rate</Text>
                <Text style={styles.statValue}>{userRank.win_rate.toFixed(1)}%</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Trades</Text>
                <Text style={styles.statValue}>{userRank.total_trades}</Text>
              </View>
            </View>
            {userRank.badges && userRank.badges.length > 0 && (
              <View style={styles.badgesRow}>
                {userRank.badges.map((badge, index) => (
                  <View key={index} style={styles.badge}>
                    <Award size={16} color="#fbbf24" />
                  </View>
                ))}
              </View>
            )}
          </GlassCard>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TOP TRADERS</Text>
          {entries.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Trophy size={48} color="#64748b" />
              <Text style={styles.emptyTitle}>No public rankings yet</Text>
              <Text style={styles.emptyText}>Be the first to make your profile public</Text>
            </GlassCard>
          ) : (
            entries.map((entry, index) => (
              <GlassCard key={entry.id} style={[styles.leaderCard, index < 3 && styles.topCard]}>
                <View style={styles.leaderHeader}>
                  <View style={styles.rankSection}>
                    {getRankIcon(entry.rank) || (
                      <View style={[styles.rankBadge, { borderColor: getRankColor(entry.rank) }]}>
                        <Text style={[styles.rankText, { color: getRankColor(entry.rank) }]}>
                          {entry.rank}
                        </Text>
                      </View>
                    )}
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.traderName}>
                        {entry.profiles?.full_name || 'Anonymous'}
                      </Text>
                      <Text style={styles.traderPassport}>
                        {entry.profiles?.trading_passport || ''}
                      </Text>
                    </View>
                  </View>
                  {entry.featured && (
                    <View style={styles.featuredBadge}>
                      <Award size={16} color="#fbbf24" />
                    </View>
                  )}
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Return</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <TrendingUp size={14} color={entry.total_return_percent >= 0 ? '#10b981' : '#ef4444'} />
                      <Text style={[styles.statValue, { color: entry.total_return_percent >= 0 ? '#10b981' : '#ef4444' }]}>
                        {entry.total_return_percent >= 0 ? '+' : ''}{entry.total_return_percent.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Win Rate</Text>
                    <Text style={styles.statValue}>{entry.win_rate.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Trades</Text>
                    <Text style={styles.statValue}>{entry.total_trades}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Value</Text>
                    <Text style={styles.statValue}>
                      ${(entry.portfolio_value / 1000).toFixed(1)}K
                    </Text>
                  </View>
                </View>

                {entry.badges && entry.badges.length > 0 && (
                  <View style={styles.badgesRow}>
                    {entry.badges.map((badge, idx) => (
                      <View key={idx} style={styles.badge}>
                        <Award size={12} color="#fbbf24" />
                      </View>
                    ))}
                  </View>
                )}
              </GlassCard>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8' },
  content: { flex: 1, padding: 20 },
  userRankCard: { padding: 20, marginBottom: 24, borderWidth: 2, borderColor: '#3b82f6' },
  userRankHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userRankLabel: { fontSize: 14, color: '#94a3b8', marginBottom: 4 },
  userRankValue: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  visibilityToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 12 },
  emptyCard: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  leaderCard: { marginBottom: 12, padding: 16 },
  topCard: { borderLeftWidth: 3, borderLeftColor: '#fbbf24' },
  leaderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  rankSection: { flexDirection: 'row', alignItems: 'center' },
  rankBadge: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 18, fontWeight: 'bold' },
  traderName: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  traderPassport: { fontSize: 12, color: '#64748b' },
  featuredBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(251, 191, 36, 0.2)', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 16 },
  statItem: { flex: 1 },
  statLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '600', color: '#fff' },
  badgesRow: { flexDirection: 'row', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  badge: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(251, 191, 36, 0.2)', justifyContent: 'center', alignItems: 'center' },
});
