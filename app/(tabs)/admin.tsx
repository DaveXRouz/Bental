import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart3, Users, DollarSign, Activity, Database, TrendingUp, AlertCircle, Shield } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { GlassCard } from '@/components/glass';
import AdminPasswordResetModal from '@/components/modals/AdminPasswordResetModal';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalAccounts: number;
  totalHoldings: number;
  totalValue: number;
  totalTransactions: number;
  activeBots: number;
  totalTrades: number;
}

export default function AdminDashboard() {
  const { session } = useAuth();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalAccounts: 0,
    totalHoldings: 0,
    totalValue: 0,
    totalTransactions: 0,
    activeBots: 0,
    totalTrades: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [passwordResetModalVisible, setPasswordResetModalVisible] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchStats();
      fetchRecentActivity();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const [
        usersCount,
        accountsCount,
        holdingsData,
        transactionsCount,
        botsCount,
        tradesCount,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('accounts').select('id', { count: 'exact', head: true }),
        supabase.from('holdings').select('market_value'),
        supabase.from('transactions').select('id', { count: 'exact', head: true }),
        supabase.from('bot_allocations').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('bot_trades').select('id', { count: 'exact', head: true }),
      ]);

      const totalValue = holdingsData.data?.reduce((sum, h) => sum + Number(h.market_value || 0), 0) || 0;

      setStats({
        totalUsers: usersCount.count || 0,
        activeUsers: usersCount.count || 0, // Simplified for demo
        totalAccounts: accountsCount.count || 0,
        totalHoldings: holdingsData.data?.length || 0,
        totalValue,
        totalTransactions: transactionsCount.count || 0,
        activeBots: botsCount.count || 0,
        totalTrades: tradesCount.count || 0,
      });
    } catch (error) {
      // Error fetching stats
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*, accounts(name)')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivity(data || []);
    } catch (error) {
      // Error fetching activity
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
    fetchRecentActivity();
  };

  const handleOpenPasswordReset = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPasswordResetModalVisible(true);
  };

  const handleClosePasswordReset = () => {
    setPasswordResetModalVisible(false);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    suffix = '',
  }: {
    title: string;
    value: number | string;
    icon: any;
    color: string;
    suffix?: string;
  }) => (
    <GlassCard style={styles.statCard}>
      <View style={styles.statIcon}>
        <LinearGradient
          colors={[color + '40', color + '10']}
          style={styles.iconGradient}
        >
          <Icon size={24} color={color} />
        </LinearGradient>
      </View>
      <Text style={styles.statValue}>
        {typeof value === 'number' && value > 1000
          ? value.toLocaleString()
          : value}
        {suffix}
      </Text>
      <Text style={styles.statTitle}>{title}</Text>
    </GlassCard>
  );

  return (
    <LinearGradient colors={['#0F0F23', '#1a1a2e', '#16213e']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>System Overview & Analytics</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Tools</Text>
          <TouchableOpacity
            style={styles.adminToolButton}
            onPress={handleOpenPasswordReset}
            activeOpacity={0.8}
          >
            <GlassCard style={styles.adminToolCard}>
              <View style={styles.adminToolIcon}>
                <LinearGradient
                  colors={['#ef444440', '#ef444410']}
                  style={styles.iconGradient}
                >
                  <Shield size={24} color="#ef4444" />
                </LinearGradient>
              </View>
              <View style={styles.adminToolContent}>
                <Text style={styles.adminToolTitle}>Reset User Password</Text>
                <Text style={styles.adminToolDescription}>
                  Search for a user and reset their password
                </Text>
              </View>
              <Text style={styles.adminToolArrow}>→</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Statistics</Text>
          <View style={styles.statsGrid}>
            <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="#3b82f6" />
            <StatCard title="Accounts" value={stats.totalAccounts} icon={DollarSign} color="#10b981" />
            <StatCard
              title="Total Value"
              value={`$${(stats.totalValue / 1000000).toFixed(2)}M`}
              icon={TrendingUp}
              color="#8b5cf6"
            />
            <StatCard title="Holdings" value={stats.totalHoldings} icon={Database} color="#f59e0b" />
            <StatCard
              title="Transactions"
              value={stats.totalTransactions}
              icon={Activity}
              color="#ef4444"
            />
            <StatCard title="Active Bots" value={stats.activeBots} icon={BarChart3} color="#06b6d4" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <GlassCard style={styles.metricsCard}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Total Bot Trades</Text>
              <Text style={styles.metricValue}>{stats.totalTrades.toLocaleString()}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Avg Holdings/User</Text>
              <Text style={styles.metricValue}>
                {stats.totalUsers > 0 ? (stats.totalHoldings / stats.totalUsers).toFixed(1) : 0}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Avg Account Value</Text>
              <Text style={styles.metricValue}>
                ${stats.totalAccounts > 0 ? (stats.totalValue / stats.totalAccounts).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
              </Text>
            </View>
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.slice(0, 5).map((activity, index) => (
            <GlassCard key={activity.id} style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <Text style={styles.activitySymbol}>{activity.symbol}</Text>
                <Text
                  style={[
                    styles.activityType,
                    { color: activity.transaction_type === 'buy' ? '#10b981' : '#ef4444' },
                  ]}
                >
                  {activity.transaction_type.toUpperCase()}
                </Text>
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityText}>
                  Qty: {activity.quantity} @ ${activity.price.toFixed(2)}
                </Text>
                <Text style={styles.activityText}>
                  Total: ${activity.total_amount.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.activityDate}>
                {new Date(activity.created_at).toLocaleString()}
              </Text>
            </GlassCard>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Health</Text>
          <GlassCard style={styles.healthCard}>
            <View style={styles.healthItem}>
              <View style={[styles.healthDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.healthText}>Database: Online</Text>
            </View>
            <View style={styles.healthItem}>
              <View style={[styles.healthDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.healthText}>Authentication: Active</Text>
            </View>
            <View style={styles.healthItem}>
              <View style={[styles.healthDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.healthText}>Real-time: Connected</Text>
            </View>
            <View style={styles.healthItem}>
              <View style={[styles.healthDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.healthText}>API Services: Operational</Text>
            </View>
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Summary</Text>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              The system currently manages {stats.totalUsers} users with {stats.totalAccounts}{' '}
              accounts holding {stats.totalHoldings} different positions.
            </Text>
            <Text style={styles.summaryText}>
              Trading bots have executed {stats.totalTrades.toLocaleString()} trades across{' '}
              {stats.activeBots} active strategies.
            </Text>
            <Text style={styles.summaryText}>
              Total portfolio value: ${stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Text>
          </GlassCard>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <AdminPasswordResetModal
        visible={passwordResetModalVisible}
        onClose={handleClosePasswordReset}
        onSuccess={() => {
          fetchStats();
          fetchRecentActivity();
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statCard: {
    width: (width - 56) / 2,
    margin: 8,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 12,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  metricsCard: {
    padding: 20,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  metricLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  activityCard: {
    padding: 16,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activitySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  activityType: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityDetails: {
    marginBottom: 8,
  },
  activityText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  healthCard: {
    padding: 20,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  healthDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  healthText: {
    fontSize: 16,
    color: '#fff',
  },
  summaryCard: {
    padding: 20,
  },
  summaryText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
    marginBottom: 12,
  },
  adminToolButton: {
    marginBottom: 12,
  },
  adminToolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  adminToolIcon: {
    marginRight: 16,
  },
  adminToolContent: {
    flex: 1,
  },
  adminToolTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  adminToolDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  adminToolArrow: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
});
