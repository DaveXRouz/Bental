import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Search,
  AlertTriangle,
  User,
  Building2,
  Wallet,
  CreditCard,
  Check,
  X,
  Calendar,
} from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { useAuth } from '@/contexts/AuthContext';
import { depositWithdrawalService } from '@/services/banking/deposit-withdrawal-service';
import { useToast } from '@/components/ui/ToastManager';
import { ButtonSpinner } from '@/components/ui/LoadingSpinner';
import { formatDistance } from 'date-fns';

type FilterTab = 'pending' | 'completed' | 'failed' | 'all';

export default function AdminDepositsScreen() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [filteredDeposits, setFilteredDeposits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    pendingAmount: 0,
    completedToday: 0,
    failedToday: 0,
  });

  // Modal states
  const [selectedDeposit, setSelectedDeposit] = useState<any | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Action states
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDeposits();
    fetchStats();
  }, [activeTab]);

  useEffect(() => {
    filterDeposits();
  }, [deposits, searchQuery, activeTab]);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'all' ? undefined : activeTab;
      const data = await depositWithdrawalService.getAdminDeposits(status as any, 100);
      setDeposits(data);
    } catch (error) {
      console.error('Error fetching deposits:', error);
      showError('Failed to load deposits');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await depositWithdrawalService.getDepositStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterDeposits = () => {
    let filtered = [...deposits];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.reference_number?.toLowerCase().includes(query) ||
          d.profiles?.email?.toLowerCase().includes(query) ||
          d.profiles?.full_name?.toLowerCase().includes(query) ||
          d.amount?.toString().includes(query)
      );
    }

    setFilteredDeposits(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDeposits();
    fetchStats();
  };

  const openApproveModal = (deposit: any) => {
    setSelectedDeposit(deposit);
    setAdminNotes('');
    setShowApproveModal(true);
  };

  const openRejectModal = (deposit: any) => {
    setSelectedDeposit(deposit);
    setAdminNotes('');
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedDeposit || !user?.id) return;

    setProcessing(true);
    try {
      const result = await depositWithdrawalService.approveDeposit(
        selectedDeposit.id,
        user.id,
        adminNotes || undefined
      );

      if (result.success) {
        showSuccess(result.message);
        setShowApproveModal(false);
        setSelectedDeposit(null);
        fetchDeposits();
        fetchStats();
      } else {
        showError(result.message);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to approve deposit');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDeposit || !user?.id) return;

    if (!adminNotes.trim()) {
      showError('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const result = await depositWithdrawalService.rejectDeposit(
        selectedDeposit.id,
        user.id,
        adminNotes
      );

      if (result.success) {
        showSuccess('Deposit rejected successfully');
        setShowRejectModal(false);
        setSelectedDeposit(null);
        fetchDeposits();
        fetchStats();
      } else {
        showError(result.message);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to reject deposit');
    } finally {
      setProcessing(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer':
      case 'wire':
      case 'check':
        return Building2;
      case 'card':
        return CreditCard;
      case 'crypto':
      case 'cash_courier':
        return Wallet;
      default:
        return DollarSign;
    }
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      bank_transfer: 'Bank Transfer',
      wire: 'Wire Transfer',
      check: 'Check',
      card: 'Card',
      crypto: 'Cryptocurrency',
      cash_courier: 'Cash Courier',
    };
    return labels[method] || method;
  };

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <BlurView intensity={40} tint="dark" style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
          <Clock size={20} color="#F59E0B" />
        </View>
        <Text style={styles.statValue}>{stats.pending}</Text>
        <Text style={styles.statLabel}>Pending Review</Text>
        <Text style={styles.statMoney}>${stats.pendingAmount.toLocaleString()}</Text>
      </BlurView>

      <BlurView intensity={40} tint="dark" style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
          <CheckCircle2 size={20} color="#10B981" />
        </View>
        <Text style={styles.statValue}>{stats.completedToday}</Text>
        <Text style={styles.statLabel}>Completed Today</Text>
      </BlurView>

      <BlurView intensity={40} tint="dark" style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
          <XCircle size={20} color="#EF4444" />
        </View>
        <Text style={styles.statValue}>{stats.failedToday}</Text>
        <Text style={styles.statLabel}>Failed Today</Text>
      </BlurView>
    </View>
  );

  const renderDepositCard = (deposit: any) => {
    const MethodIcon = getMethodIcon(deposit.method);
    const isPending = deposit.status === 'pending';
    const createdDate = new Date(deposit.created_at);
    const hoursOld = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);
    const isUrgent = isPending && hoursOld > 24;

    return (
      <View key={deposit.id} style={styles.depositCard}>
        <BlurView intensity={50} tint="dark" style={styles.depositCardInner}>
          {isUrgent && (
            <View style={styles.urgentBadge}>
              <AlertTriangle size={14} color="#EF4444" />
              <Text style={styles.urgentText}>Urgent - {Math.floor(hoursOld)}h old</Text>
            </View>
          )}

          <View style={styles.depositHeader}>
            <View style={styles.depositUser}>
              <View style={styles.userAvatar}>
                <User size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{deposit.profiles?.full_name || 'Unknown User'}</Text>
                <Text style={styles.userEmail}>{deposit.profiles?.email}</Text>
              </View>
            </View>

            <View style={styles.depositAmount}>
              <Text style={styles.amountValue}>${Number(deposit.amount).toLocaleString()}</Text>
              <Text style={styles.amountLabel}>Deposit</Text>
            </View>
          </View>

          <View style={styles.depositDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Method:</Text>
              <View style={styles.methodBadge}>
                <MethodIcon size={14} color={colors.textSecondary} />
                <Text style={styles.methodText}>{getMethodLabel(deposit.method)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference:</Text>
              <Text style={styles.detailValue}>{deposit.reference_number}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account Balance:</Text>
              <Text style={styles.detailValue}>${Number(deposit.accounts?.balance || 0).toLocaleString()}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Submitted:</Text>
              <Text style={styles.detailValue}>
                {formatDistance(createdDate, new Date(), { addSuffix: true })}
              </Text>
            </View>

            {deposit.bank_name && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bank:</Text>
                <Text style={styles.detailValue}>
                  {deposit.bank_name} (...{deposit.account_number_last4})
                </Text>
              </View>
            )}

            {deposit.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>User Notes:</Text>
                <Text style={styles.notesText}>{deposit.notes}</Text>
              </View>
            )}
          </View>

          {isPending && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.rejectButton} onPress={() => openRejectModal(deposit)}>
                <XCircle size={18} color="#EF4444" />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.approveButton} onPress={() => openApproveModal(deposit)}>
                <CheckCircle2 size={18} color="#10B981" />
                <Text style={styles.approveButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          )}

          {deposit.admin_notes && (
            <View style={styles.adminNotesBox}>
              <Text style={styles.adminNotesLabel}>Admin Notes:</Text>
              <Text style={styles.adminNotesText}>{deposit.admin_notes}</Text>
            </View>
          )}
        </BlurView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Deposit Management</Text>
        <Text style={styles.subtitle}>Review and verify deposit requests</Text>
      </View>

      {renderStatsCard()}

      <View style={styles.searchContainer}>
        <BlurView intensity={50} tint="dark" style={styles.searchInput}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Search by reference, email, or amount..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </BlurView>
      </View>

      <View style={styles.tabs}>
        {(['pending', 'completed', 'failed', 'all'] as FilterTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {tab === 'pending' && stats.pending > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{stats.pending}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FFFFFF" />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ButtonSpinner />
            <Text style={styles.loadingText}>Loading deposits...</Text>
          </View>
        ) : filteredDeposits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <DollarSign size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No deposits found</Text>
          </View>
        ) : (
          filteredDeposits.map(renderDepositCard)
        )}
      </ScrollView>

      {/* Approve Modal */}
      <Modal visible={showApproveModal} transparent animationType="fade" onRequestClose={() => setShowApproveModal(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={styles.modalBlur}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Approve Deposit</Text>
                <TouchableOpacity onPress={() => setShowApproveModal(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalText}>
                Approve deposit of ${Number(selectedDeposit?.amount).toLocaleString()} for{' '}
                {selectedDeposit?.profiles?.email}?
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Admin Notes (Optional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Add any notes..."
                  placeholderTextColor={colors.textMuted}
                  value={adminNotes}
                  onChangeText={setAdminNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowApproveModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmApproveButton} onPress={handleApprove} disabled={processing}>
                  {processing ? <ButtonSpinner /> : <Text style={styles.confirmButtonText}>Approve</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal visible={showRejectModal} transparent animationType="fade" onRequestClose={() => setShowRejectModal(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={styles.modalBlur}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reject Deposit</Text>
                <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalText}>
                Reject deposit of ${Number(selectedDeposit?.amount).toLocaleString()} from{' '}
                {selectedDeposit?.profiles?.email}?
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rejection Reason (Required)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Explain why this deposit is being rejected..."
                  placeholderTextColor={colors.textMuted}
                  value={adminNotes}
                  onChangeText={setAdminNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowRejectModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmRejectButton} onPress={handleReject} disabled={processing}>
                  {processing ? <ButtonSpinner /> : <Text style={styles.confirmButtonText}>Reject</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 24 },
  statCard: { flex: 1, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: GLASS.border, alignItems: 'center', overflow: 'hidden' },
  statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  statLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
  statMoney: { fontSize: 12, fontWeight: '600', color: '#F59E0B', marginTop: 4 },
  searchContainer: { paddingHorizontal: 24, marginBottom: 16 },
  searchInput: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: GLASS.border, overflow: 'hidden' },
  searchTextInput: { flex: 1, fontSize: 14, color: colors.text },
  tabs: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 16 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md, backgroundColor: 'rgba(26, 26, 28, 0.6)', borderWidth: 1, borderColor: GLASS.border },
  tabActive: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.3)' },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: '#3B82F6' },
  tabBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: '#000000' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 8 },
  depositCard: { marginBottom: 16, borderRadius: radius.xl, overflow: 'hidden' },
  depositCardInner: { padding: 20, borderRadius: radius.xl, borderWidth: 1, borderColor: GLASS.border },
  urgentBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: 'rgba(239,68,68,0.15)', marginBottom: 12 },
  urgentText: { fontSize: 11, fontWeight: '600', color: '#EF4444' },
  depositHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  depositUser: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(59,130,246,0.15)', justifyContent: 'center', alignItems: 'center' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  userEmail: { fontSize: 12, color: colors.textSecondary },
  depositAmount: { alignItems: 'flex-end' },
  amountValue: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 2 },
  amountLabel: { fontSize: 11, color: colors.textSecondary },
  depositDetails: { gap: 10, marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 13, color: colors.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '500', color: colors.text },
  methodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.05)' },
  methodText: { fontSize: 12, fontWeight: '500', color: colors.text },
  notesContainer: { marginTop: 8, padding: 12, borderRadius: radius.md, backgroundColor: 'rgba(59,130,246,0.08)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  notesLabel: { fontSize: 11, fontWeight: '600', color: '#3B82F6', marginBottom: 4 },
  notesText: { fontSize: 12, color: colors.text, lineHeight: 18 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  rejectButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: radius.md, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  rejectButtonText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  approveButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: radius.md, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  approveButtonText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  adminNotesBox: { marginTop: 12, padding: 12, borderRadius: radius.md, backgroundColor: 'rgba(59,130,246,0.08)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  adminNotesLabel: { fontSize: 11, fontWeight: '600', color: '#3B82F6', marginBottom: 4 },
  adminNotesText: { fontSize: 12, color: colors.text, lineHeight: 18 },
  loadingContainer: { paddingVertical: 60, alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 14, color: colors.textSecondary },
  emptyContainer: { paddingVertical: 60, alignItems: 'center', gap: 16 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalBlur: { width: '90%', maxWidth: 500, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: GLASS.border },
  modalContent: { padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  modalText: { fontSize: 15, color: colors.textSecondary, marginBottom: 20, lineHeight: 22 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  textArea: { padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: GLASS.border, backgroundColor: 'rgba(26, 26, 28, 0.6)', fontSize: 14, color: colors.text, minHeight: 80 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: GLASS.border, alignItems: 'center' },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: colors.text },
  confirmApproveButton: { flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: 'rgba(16,185,129,0.2)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', alignItems: 'center' },
  confirmRejectButton: { flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', alignItems: 'center' },
  confirmButtonText: { fontSize: 15, fontWeight: '700', color: colors.text },
});
