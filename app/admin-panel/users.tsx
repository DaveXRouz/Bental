import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Shield, Lock, CheckCircle, DollarSign, TrendingUp, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [userAccounts, setUserAccounts] = useState<Record<string, any[]>>({});
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editingBalance, setEditingBalance] = useState<any>(null);
  const [newBalance, setNewBalance] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setUsers(data);
      for (const user of data) {
        fetchUserAccounts(user.id);
      }
    }
  };

  const fetchUserAccounts = async (userId: string) => {
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId);
    if (data) {
      setUserAccounts(prev => ({ ...prev, [userId]: data }));
    }
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

  const handleManageAccounts = (user: any) => {
    setSelectedUser(user);
  };

  const handleEditBalance = (account: any) => {
    setEditingBalance(account);
    setNewBalance(account.balance.toString());
  };

  const handleSaveBalance = async () => {
    if (!editingBalance) return;
    try {
      const balance = parseFloat(newBalance);
      if (isNaN(balance) || balance < 0) {
        Alert.alert('Error', 'Invalid balance amount');
        return;
      }
      const { error } = await supabase
        .from('accounts')
        .update({ balance })
        .eq('id', editingBalance.id);
      if (error) throw error;
      await fetchUserAccounts(editingBalance.user_id);
      setEditingBalance(null);
      setNewBalance('');
      Alert.alert('Success', 'Account balance updated');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update balance');
    }
  };

  const getTotalBalance = (userId: string) => {
    const accounts = userAccounts[userId] || [];
    return accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
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
              <Text style={[styles.detailLabel, { color: '#10b981', fontWeight: '600' }]}>
                Total: ${getTotalBalance(user.id).toLocaleString()}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { flex: 1 }]}
                onPress={() => handleManageAccounts(user)}
              >
                <DollarSign size={16} color="#10b981" />
                <Text style={[styles.actionText, { color: '#10b981' }]}>Manage Accounts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { flex: 1 }]}
                onPress={() => handleResetPassword(user)}
              >
                <Lock size={16} color="#3b82f6" />
                <Text style={styles.actionText}>Reset Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={selectedUser !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedUser(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedUser?.full_name}</Text>
                <Text style={styles.modalSubtitle}>{selectedUser?.email}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedUser(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {selectedUser && userAccounts[selectedUser.id]?.map((account: any) => (
                <View key={account.id} style={styles.accountCard}>
                  <View style={styles.accountHeader}>
                    <View>
                      <Text style={styles.accountType}>{account.account_type}</Text>
                      <Text style={styles.accountNumber}>#{account.account_number}</Text>
                    </View>
                    <View style={styles.accountStatus}>
                      <Text style={[
                        styles.statusBadge,
                        account.status === 'active' && styles.statusActive
                      ]}>
                        {account.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.accountBalance}>
                    <Text style={styles.balanceLabel}>Balance</Text>
                    <Text style={styles.balanceAmount}>${parseFloat(account.balance).toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editBalanceButton}
                    onPress={() => handleEditBalance(account)}
                  >
                    <DollarSign size={16} color="#3b82f6" />
                    <Text style={styles.editBalanceText}>Edit Balance</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {selectedUser && (!userAccounts[selectedUser.id] || userAccounts[selectedUser.id].length === 0) && (
                <Text style={styles.emptyText}>No accounts found</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={editingBalance !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingBalance(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 300 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Balance</Text>
              <TouchableOpacity onPress={() => setEditingBalance(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {editingBalance && (
              <View style={styles.modalBody}>
                <Text style={styles.editLabel}>Account: {editingBalance.account_type}</Text>
                <Text style={styles.editSubLabel}>Current: ${parseFloat(editingBalance.balance).toLocaleString()}</Text>
                <TextInput
                  style={styles.balanceInput}
                  value={newBalance}
                  onChangeText={setNewBalance}
                  placeholder="Enter new balance"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setEditingBalance(null)}
                  >
                    <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSave]}
                    onPress={handleSaveBalance}
                  >
                    <Text style={styles.modalButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: 12, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: '#334155' },
  actionText: { fontSize: 14, color: '#3b82f6', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 16, width: '90%', maxWidth: 600, maxHeight: '80%', borderWidth: 1, borderColor: '#334155' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  modalSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  modalClose: { fontSize: 24, color: '#94a3b8' },
  modalBody: { padding: 20 },
  accountCard: { backgroundColor: '#0f172a', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  accountHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  accountType: { fontSize: 16, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
  accountNumber: { fontSize: 12, color: '#64748b', marginTop: 4 },
  accountStatus: {},
  statusBadge: { fontSize: 11, fontWeight: '600', color: '#64748b', backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, textTransform: 'uppercase' },
  statusActive: { color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  accountBalance: { marginBottom: 12 },
  balanceLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  balanceAmount: { fontSize: 24, fontWeight: 'bold', color: '#10b981' },
  editBalanceButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', padding: 10, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: '#3b82f6' },
  editBalanceText: { fontSize: 13, color: '#3b82f6', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#64748b', fontSize: 14, padding: 20 },
  editLabel: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  editSubLabel: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  balanceInput: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 12, fontSize: 15, color: '#fff', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: '#334155' },
  modalButtonSave: { backgroundColor: '#3b82f6' },
  modalButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalButtonTextCancel: { fontSize: 15, fontWeight: '600', color: '#94a3b8' },
});
