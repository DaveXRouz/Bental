import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Shield, Lock, CheckCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  const handleResetPassword = async (user: any) => {
    Alert.alert(
      'Reset Password',
      `Reset password for ${user.email}?`,
      [
        { text: 'Cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('admin_update_user_password', {
                user_email: user.email,
                new_password: 'Welcome2025!',
              });
              if (error) throw error;
              Alert.alert('Success', 'Password reset to Welcome2025!');
            } catch (e) {
              Alert.alert('Error', 'Failed to reset password');
            }
          },
        },
      ]
    );
  };

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSubtitle}>{filtered.length} users</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={styles.content}>
        {filtered.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.full_name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <View style={styles.badges}>
                {user.role === 'admin' && (
                  <View style={styles.badgeAdmin}>
                    <Shield size={12} color="#3b82f6" />
                    <Text style={styles.badgeText}>Admin</Text>
                  </View>
                )}
                {user.email_verified && (
                  <CheckCircle size={16} color="#10b981" />
                )}
              </View>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.detailLabel}>KYC: {user.kyc_status}</Text>
              <Text style={styles.detailLabel}>
                Joined: {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleResetPassword(user)}
            >
              <Lock size={16} color="#3b82f6" />
              <Text style={styles.actionText}>Reset Password</Text>
            </TouchableOpacity>
          </View>
        ))}
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', margin: 16, padding: 12, borderRadius: 8, gap: 12 },
  searchInput: { flex: 1, fontSize: 14, color: '#fff' },
  content: { flex: 1, padding: 16 },
  userCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 20, marginBottom: 16 },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#94a3b8' },
  badges: { flexDirection: 'row', gap: 8 },
  badgeAdmin: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e40af20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  badgeText: { fontSize: 11, color: '#3b82f6', fontWeight: '600' },
  userDetails: { flexDirection: 'row', gap: 20, marginBottom: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  detailLabel: { fontSize: 12, color: '#64748b' },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: 12, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: '#334155' },
  actionText: { fontSize: 14, color: '#3b82f6', fontWeight: '500' },
});
