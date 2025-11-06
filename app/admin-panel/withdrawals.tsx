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
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Search,
  AlertTriangle,
  Edit3,
  User,
  Building2,
  Wallet,
  Bitcoin,
  CreditCard,
  Check,
  X,
} from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { useAuth } from '@/contexts/AuthContext';
import { depositWithdrawalService, Withdrawal, RejectionReason } from '@/services/banking/deposit-withdrawal-service';
import { useToast } from '@/components/ui/ToastManager';
import { ButtonSpinner } from '@/components/ui/LoadingSpinner';

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminWithdrawalsScreen() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    pendingAmount: 0,
    approvedToday: 0,
    rejectedToday: 0,
  });

  // Modal states
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);

  // Action states
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState<RejectionReason>('other');
  const [modifiedAmount, setModifiedAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
    fetchStats();
  }, [activeTab]);

  useEffect(() => {
    filterWithdrawals();
  }, [withdrawals, searchQuery, activeTab]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'all' ? undefined :
                     activeTab === 'pending' ? 'pending_review' :
                     activeTab === 'approved' ? 'approved' : 'rejected';

      const data = await depositWithdrawalService.getAdminWithdrawals(status as any, 100);
      setWithdrawals(data);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      showError('Failed to load withdrawals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await depositWithdrawalService.getWithdrawalStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterWithdrawals = () => {
    let filtered = [...withdrawals];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.reference_number?.toLowerCase().includes(query) ||
          w.profiles?.email?.toLowerCase().includes(query) ||
          w.profiles?.full_name?.toLowerCase().includes(query) ||
          w.amount?.toString().includes(query)
      );
    }

    setFilteredWithdrawals(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWithdrawals();
    fetchStats();
  };

  const openApproveModal = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal);
    setAdminNotes('');
    setShowApproveModal(true);
  };

  const openRejectModal = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal);
    setAdminNotes('');
    setRejectionReason('other');
    setShowRejectModal(true);
  };

  const openModifyModal = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal);
    setModifiedAmount('');
    setAdminNotes('');
    setShowModifyModal(true);
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal || !user?.id) return;

    setProcessing(true);
    try {
      const result = await depositWithdrawalService.approveWithdrawal(
        selectedWithdrawal.id,
        user.id,
        adminNotes || undefined
      );

      if (result.success) {
        showSuccess(result.message);
        setShowApproveModal(false);
        setSelectedWithdrawal(null);
        fetchWithdrawals();
        fetchStats();
      } else {
        showError(result.message);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to approve withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !user?.id) return;

    if (!adminNotes.trim()) {
      showError('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const result = await depositWithdrawalService.rejectWithdrawal(
        selectedWithdrawal.id,
        user.id,
        rejectionReason,
        adminNotes
      );

      if (result.success) {
        showSuccess('Withdrawal rejected successfully');
        setShowRejectModal(false);
        setSelectedWithdrawal(null);
        fetchWithdrawals();
        fetchStats();
      } else {
        showError(result.message);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to reject withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  const handleModifyAndApprove = async () => {
    if (!selectedWithdrawal || !user?.id) return;

    const newAmount = parseFloat(modifiedAmount);
    if (isNaN(newAmount) || newAmount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (newAmount > selectedWithdrawal.amount) {
      showError('Modified amount cannot exceed original amount');
      return;
    }

    if (!adminNotes.trim()) {
      showError('Please explain why the amount was modified');
      return;
    }

    setProcessing(true);
    try {
      const result = await depositWithdrawalService.approveWithdrawal(
        selectedWithdrawal.id,
        user.id,
        adminNotes,
        newAmount
      );

      if (result.success) {
        showSuccess(result.message);
        setShowModifyModal(false);
        setSelectedWithdrawal(null);
        fetchWithdrawals();
        fetchStats();
      } else {
        showError(result.message);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to modify and approve withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer':
      case 'wire':
      case 'check':
      case 'ach':
        return Building2;
      case 'paypal':
      case 'venmo':
        return Wallet;
      case 'crypto':
        return Bitcoin;
      case 'debit_card':
        return CreditCard;
      default:
        return DollarSign;
    }
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      bank_transfer: 'Bank Transfer',
      wire: 'Wire Transfer',
      check: 'Check',
      ach: 'ACH Transfer',
      paypal: 'PayPal',
      venmo: 'Venmo',
      crypto: 'Crypto',
      debit_card: 'Debit Card',
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
        <Text style={styles.statValue}>{stats.approvedToday}</Text>
        <Text style={styles.statLabel}>Approved Today</Text>
      </BlurView>

      <BlurView intensity={40} tint="dark" style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
          <XCircle size={20} color="#EF4444" />
        </View>
        <Text style={styles.statValue}>{stats.rejectedToday}</Text>
        <Text style={styles.statLabel}>Rejected Today</Text>
      </BlurView>
    </View>
  );

  const renderWithdrawalCard = (withdrawal: any) => {
    const MethodIcon = getMethodIcon(withdrawal.method);
    const isPending = withdrawal.admin_approval_status === 'pending_review';
    const createdDate = new Date(withdrawal.created_at);
    const hoursOld = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);
    const isUrgent = isPending && hoursOld > 24;

    return (
      <View key={withdrawal.id} style={styles.withdrawalCard}>
        <BlurView intensity={50} tint="dark" style={styles.withdrawalCardInner}>
          {isUrgent && (
            <View style={styles.urgentBadge}>
              <AlertTriangle size={14} color="#EF4444" />
              <Text style={styles.urgentText}>Urgent - {Math.floor(hoursOld)}h old</Text>
            </View>
          )}

          <View style={styles.withdrawalHeader}>
            <View style={styles.withdrawalUser}>
              <View style={styles.userAvatar}>
                <User size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{withdrawal.profiles?.full_name || 'Unknown User'}</Text>
                <Text style={styles.userEmail}>{withdrawal.profiles?.email}</Text>
              </View>
            </View>

            <View style={styles.withdrawalAmount}>
              <Text style={styles.amountValue}>${Number(withdrawal.amount).toLocaleString()}</Text>
              <Text style={styles.amountLabel}>Requested</Text>
            </View>
          </View>

          <View style={styles.withdrawalDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Method:</Text>
              <View style={styles.methodBadge}>
                <MethodIcon size={14} color={colors.textSecondary} />
                <Text style={styles.methodText}>{getMethodLabel(withdrawal.method)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference:</Text>
              <Text style={styles.detailValue}>{withdrawal.reference_number}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account Balance:</Text>
              <Text style={styles.detailValue}>${Number(withdrawal.accounts?.balance || 0).toLocaleString()}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Requested:</Text>
              <Text style={styles.detailValue}>
                {createdDate.toLocaleDateString()} {createdDate.toLocaleTimeString()}
              </Text>
            </View>

            {withdrawal.bank_name && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bank:</Text>
                <Text style={styles.detailValue}>
                  {withdrawal.bank_name} (...{withdrawal.account_number_last4})
                </Text>
              </View>
            )}

            {withdrawal.email && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{withdrawal.email}</Text>
              </View>
            )}

            {withdrawal.crypto_address && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Crypto:</Text>
                <Text style={styles.detailValue}>
                  {withdrawal.crypto_currency} ({withdrawal.crypto_address.substring(0, 12)}...)
                </Text>
              </View>
            )}
          </View>

          {isPending && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.rejectButton} onPress={() => openRejectModal(withdrawal)}>
                <XCircle size={18} color="#EF4444" />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modifyButton} onPress={() => openModifyModal(withdrawal)}>
                <Edit3 size={18} color="#F59E0B" />
                <Text style={styles.modifyButtonText}>Modify</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.approveButton} onPress={() => openApproveModal(withdrawal)}>
                <CheckCircle2 size={18} color="#10B981" />
                <Text style={styles.approveButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isPending && withdrawal.admin_notes && (
            <View style={styles.adminNotesBox}>
              <Text style={styles.adminNotesLabel}>Admin Notes:</Text>
              <Text style={styles.adminNotesText}>{withdrawal.admin_notes}</Text>
            </View>
          )}
        </BlurView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Withdrawal Management</Text>
        <Text style={styles.subtitle}>Review and approve withdrawal requests</Text>
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
        {(['pending', 'approved', 'rejected', 'all'] as FilterTab[]).map((tab) => (
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
            <Text style={styles.loadingText}>Loading withdrawals...</Text>
          </View>
        ) : filteredWithdrawals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <DollarSign size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No withdrawals found</Text>
          </View>
        ) : (
          filteredWithdrawals.map(renderWithdrawalCard)
        )}
      </ScrollView>

      {/* Approve Modal */}
      <Modal visible={showApproveModal} transparent animationType="fade" onRequestClose={() => setShowApproveModal(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={styles.modalBlur}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Approve Withdrawal</Text>
                <TouchableOpacity onPress={() => setShowApproveModal(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalText}>
                Approve withdrawal of ${Number(selectedWithdrawal?.amount).toLocaleString()} for{' '}
                {selectedWithdrawal?.profiles?.email}?
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
                <Text style={styles.modalTitle}>Reject Withdrawal</Text>
                <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalText}>
                Reject withdrawal of ${Number(selectedWithdrawal?.amount).toLocaleString()} for{' '}
                {selectedWithdrawal?.profiles?.email}?
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rejection Reason</Text>
                <View style={styles.reasonButtons}>
                  {[
                    { value: 'insufficient_verification', label: 'Insufficient Verification' },
                    { value: 'suspicious_activity', label: 'Suspicious Activity' },
                    { value: 'incorrect_details', label: 'Incorrect Details' },
                    { value: 'insufficient_funds', label: 'Insufficient Funds' },
                    { value: 'other', label: 'Other' },
                  ].map((reason) => (
                    <TouchableOpacity
                      key={reason.value}
                      style={[
                        styles.reasonChip,
                        rejectionReason === reason.value && styles.reasonChipActive,
                      ]}
                      onPress={() => setRejectionReason(reason.value as RejectionReason)}
                    >
                      <Text
                        style={[
                          styles.reasonChipText,
                          rejectionReason === reason.value && styles.reasonChipTextActive,
                        ]}
                      >
                        {reason.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Explanation (Required)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Explain why this withdrawal is being rejected..."
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

      {/* Modify Amount Modal */}
      <Modal visible={showModifyModal} transparent animationType="fade" onRequestClose={() => setShowModifyModal(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={styles.modalBlur}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Modify & Approve</Text>
                <TouchableOpacity onPress={() => setShowModifyModal(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalText}>
                Original amount: ${Number(selectedWithdrawal?.amount).toLocaleString()}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Amount</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    value={modifiedAmount}
                    onChangeText={setModifiedAmount}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason for Modification (Required)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Explain why the amount is being modified..."
                  placeholderTextColor={colors.textMuted}
                  value={adminNotes}
                  onChangeText={setAdminNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModifyModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmApproveButton} onPress={handleModifyAndApprove} disabled={processing}>
                  {processing ? <ButtonSpinner /> : <Text style={styles.confirmButtonText}>Modify & Approve</Text>}
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
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    alignItems: 'center',
    overflow: 'hidden',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statMoney: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(26, 26, 28, 0.6)',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  tabActive: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#3B82F6',
  },
  tabBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
  },
  withdrawalCard: {
    marginBottom: 16,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  withdrawalCardInner: {
    padding: 20,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(239,68,68,0.15)',
    marginBottom: 12,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  withdrawalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  withdrawalUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59,130,246,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  withdrawalAmount: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  amountLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  withdrawalDetails: {
    gap: 10,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  methodText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  modifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  modifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  adminNotesBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  adminNotesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  adminNotesText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalBlur: {
    width: '90%',
    maxWidth: 500,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  textArea: {
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: GLASS.border,
    backgroundColor: 'rgba(26, 26, 28, 0.6)',
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
  },
  reasonButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(26, 26, 28, 0.6)',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  reasonChipActive: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  reasonChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  reasonChipTextActive: {
    color: '#EF4444',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: GLASS.border,
    backgroundColor: 'rgba(26, 26, 28, 0.6)',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: GLASS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  confirmApproveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    alignItems: 'center',
  },
  confirmRejectButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
