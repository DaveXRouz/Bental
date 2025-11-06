import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  Settings,
  BarChart3,
  FileText,
  LogOut,
  TrendingUp,
  Shield,
  Activity,
  DollarSign,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminPanelDashboard() {
  const router = useRouter();
  const { signOut, session } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalAccounts: 0,
    totalValue: 0,
    totalTrades: 0,
    activeBots: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const [usersRes, accountsRes, holdingsRes, tradesRes, botsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('accounts').select('*', { count: 'exact', head: true }),
        supabase.from('holdings').select('market_value'),
        supabase.from('trades').select('*', { count: 'exact', head: true }),
        supabase.from('bots').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      const totalValue = holdingsRes.data?.reduce((sum, h) => sum + Number(h.market_value || 0), 0) || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        activeUsers: usersRes.count || 0,
        totalAccounts: accountsRes.count || 0,
        totalValue,
        totalTrades: tradesRes.count || 0,
        activeBots: botsRes.count || 0,
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Shield size={32} color="#3b82f6" />
          <Text style={styles.sidebarTitle}>Admin Panel</Text>
        </View>

        <View style={styles.nav}>
          <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
            <BarChart3 size={20} color="#3b82f6" />
            <Text style={[styles.navText, styles.navTextActive]}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/admin-panel/users')}
          >
            <Users size={20} color="#94a3b8" />
            <Text style={styles.navText}>Users</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/admin-panel/withdrawals')}
          >
            <DollarSign size={20} color="#94a3b8" />
            <Text style={styles.navText}>Withdrawals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/admin-panel/configuration')}
          >
            <Settings size={20} color="#94a3b8" />
            <Text style={styles.navText}>Configuration</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/admin-panel/logs')}
          >
            <FileText size={20} color="#94a3b8" />
            <Text style={styles.navText}>Activity Logs</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>System Overview</Text>
          <Text style={styles.headerSubtitle}>Real-time monitoring</Text>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} />
          }
        >
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
              <Users size={24} color="#3b82f6" />
              <Text style={styles.statValue}>{stats.totalUsers}</Text>
              <Text style={styles.statTitle}>Total Users</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
              <Activity size={24} color="#10b981" />
              <Text style={styles.statValue}>{stats.totalAccounts}</Text>
              <Text style={styles.statTitle}>Accounts</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#8b5cf6' }]}>
              <TrendingUp size={24} color="#8b5cf6" />
              <Text style={styles.statValue}>
                ${(stats.totalValue / 1000000).toFixed(2)}M
              </Text>
              <Text style={styles.statTitle}>Portfolio Value</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
              <Activity size={24} color="#f59e0b" />
              <Text style={styles.statValue}>{stats.totalTrades}</Text>
              <Text style={styles.statTitle}>Total Trades</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#ec4899' }]}>
              <Shield size={24} color="#ec4899" />
              <Text style={styles.statValue}>{stats.activeBots}</Text>
              <Text style={styles.statTitle}>Active Bots</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Health</Text>
            <View style={styles.healthCard}>
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
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/admin-panel/users')}
            >
              <Users size={24} color="#3b82f6" />
              <Text style={styles.actionText}>Manage Users</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/admin-panel/configuration')}
            >
              <Settings size={24} color="#10b981" />
              <Text style={styles.actionText}>App Settings</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#0f172a' },
  sidebar: { width: 280, backgroundColor: '#1e293b', padding: 24 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 12 },
  sidebarTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  nav: { flex: 1, gap: 8 },
  navItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, gap: 12 },
  navItemActive: { backgroundColor: '#1e40af20' },
  navText: { fontSize: 15, color: '#94a3b8' },
  navTextActive: { color: '#3b82f6', fontWeight: '600' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, gap: 12, borderWidth: 1, borderColor: '#ef4444', marginTop: 16 },
  logoutText: { fontSize: 15, color: '#ef4444', fontWeight: '600' },
  mainContent: { flex: 1 },
  header: { padding: 32, borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: '#94a3b8' },
  content: { flex: 1, padding: 24 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, marginBottom: 24 },
  statCard: { flex: 1, minWidth: 200, backgroundColor: '#1e293b', borderRadius: 12, padding: 24, borderLeftWidth: 4 },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 12 },
  statTitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 16 },
  healthCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 20 },
  healthItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  healthDot: { width: 12, height: 12, borderRadius: 6 },
  healthText: { fontSize: 16, color: '#fff' },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 20, borderRadius: 12, marginBottom: 12, gap: 16 },
  actionText: { fontSize: 16, color: '#fff', fontWeight: '500' },
});
