import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { QuantumFieldBackground } from '@/components/backgrounds';
import { BlurView } from 'expo-blur';
import {
  Clock,
  CheckCircle2,
  XCircle,
  TrendingDown,
  User,
  DollarSign,
  Calendar,
  FileText,
} from 'lucide-react-native';
import { colors, Spacing, Typography } from '@/constants/theme';
import { useAdminPortfolio, usePendingOrderStats } from '@/hooks/useAdminPortfolio';
import { formatDistance } from 'date-fns';
import * as Haptics from 'expo-haptics';

export default function PendingOrdersScreen() {
  const { pendingOrders, loading, fetchPendingOrders, approveSell, rejectSell } =
    useAdminPortfolio();
  const { stats } = usePendingOrderStats();

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [actualPrice, setActualPrice] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionMode, setActionMode] = useState<'approve' | 'reject' | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      console.clear();
      fetchPendingOrders();
    }, [fetchPendingOrders])
  );

  const handleSelectOrder = (orderId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (selectedOrder === orderId) {
      setSelectedOrder(null);
      setActionMode(null);
      setActualPrice('');
      setAdminNotes('');
      setRejectionReason('');
    } else {
      setSelectedOrder(orderId);
      setActionMode(null);
      setActualPrice('');
      setAdminNotes('');
      setRejectionReason('');
    }
  };

  const handleApprove = async (orderId: string, estimatedPrice: number) => {
    if (!actualPrice) {
      setActualPrice(estimatedPrice.toString());
    }

    if (actionMode === 'approve' && actualPrice) {
      setProcessingId(orderId);

      try {
        await approveSell({
          order_id: orderId,
          actual_price: parseFloat(actualPrice),
          admin_notes: adminNotes || undefined,
        });

        setSelectedOrder(null);
        setActionMode(null);
        setActualPrice('');
        setAdminNotes('');
      } finally {
        setProcessingId(null);
      }
    } else {
      setActionMode('approve');
    }
  };

  const handleReject = async (orderId: string) => {
    if (actionMode === 'reject' && rejectionReason) {
      setProcessingId(orderId);

      try {
        await rejectSell({
          order_id: orderId,
          rejection_reason: rejectionReason,
          admin_notes: adminNotes || undefined,
        });

        setSelectedOrder(null);
        setActionMode(null);
        setRejectionReason('');
        setAdminNotes('');
      } finally {
        setProcessingId(null);
      }
    } else {
      setActionMode('reject');
    }
  };

  return (
    <View style={styles.container}>
      <QuantumFieldBackground />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Pending Sell Orders</Text>
          <Text style={styles.headerSubtitle}>Review and approve user sell requests</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <BlurView intensity={20} tint="dark" style={styles.statCard}>
          <Clock size={20} color={colors.warning} />
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Pending</Text>
        </BlurView>

        <BlurView intensity={20} tint="dark" style={styles.statCard}>
          <DollarSign size={20} color={colors.success} />
          <Text style={styles.statValue}>${stats.total_value.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Value</Text>
        </BlurView>

        <BlurView intensity={20} tint="dark" style={styles.statCard}>
          <FileText size={20} color={colors.info} />
          <Text style={styles.statValue}>{stats.pending_review}</Text>
          <Text style={styles.statLabel}>Needs Review</Text>
        </BlurView>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchPendingOrders}
            tintColor={colors.white}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && pendingOrders.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.success} />
            <Text style={styles.loadingText}>Loading pending orders...</Text>
          </View>
        ) : pendingOrders.length === 0 ? (
          <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
            <CheckCircle2 size={48} color={colors.success} />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>No pending sell orders to review</Text>
          </BlurView>
        ) : (
          pendingOrders.map((order) => {
            const isSelected = selectedOrder === order.id;
            const isProcessing = processingId === order.id;

            return (
              <BlurView key={order.id} intensity={20} tint="dark" style={styles.orderCard}>
                <TouchableOpacity
                  onPress={() => handleSelectOrder(order.id)}
                  activeOpacity={0.7}
                  disabled={isProcessing}
                >
                  {/* Order Header */}
                  <View style={styles.orderHeader}>
                    <View style={styles.orderHeaderLeft}>
                      <View style={styles.orderIcon}>
                        <TrendingDown size={20} color={colors.danger} />
                      </View>
                      <View>
                        <Text style={styles.orderSymbol}>{order.symbol}</Text>
                        <Text style={styles.orderType}>{order.asset_type}</Text>
                      </View>
                    </View>

                    <View style={styles.orderHeaderRight}>
                      <Text style={styles.orderQuantity}>{order.quantity}</Text>
                      <Text style={styles.orderQuantityLabel}>shares</Text>
                    </View>
                  </View>

                  {/* Order Details */}
                  <View style={styles.orderDetails}>
                    <View style={styles.detailRow}>
                      <User size={14} color={colors.textMuted} />
                      <Text style={styles.detailText}>
                        {order.profiles?.full_name || 'Unknown User'}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <DollarSign size={14} color={colors.textMuted} />
                      <Text style={styles.detailText}>
                        ${order.estimated_price.toFixed(2)} × {order.quantity} = $
                        {order.estimated_total.toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Calendar size={14} color={colors.textMuted} />
                      <Text style={styles.detailText}>
                        {formatDistance(new Date(order.submitted_at), new Date(), {
                          addSuffix: true,
                        })}
                      </Text>
                    </View>

                    {order.user_notes && (
                      <View style={styles.notesContainer}>
                        <FileText size={14} color={colors.info} />
                        <Text style={styles.notesText}>{order.user_notes}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Action Panel */}
                {isSelected && (
                  <View style={styles.actionPanel}>
                    {actionMode === null && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.approveButton]}
                          onPress={() => handleApprove(order.id, order.estimated_price)}
                          disabled={isProcessing}
                          activeOpacity={0.8}
                        >
                          <CheckCircle2 size={18} color={colors.white} />
                          <Text style={styles.actionButtonText}>Approve</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton]}
                          onPress={() => handleReject(order.id)}
                          disabled={isProcessing}
                          activeOpacity={0.8}
                        >
                          <XCircle size={18} color={colors.white} />
                          <Text style={styles.actionButtonText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {actionMode === 'approve' && (
                      <View style={styles.actionForm}>
                        <Text style={styles.formLabel}>Execution Price</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder={order.estimated_price.toFixed(2)}
                          placeholderTextColor={colors.textMuted}
                          value={actualPrice}
                          onChangeText={setActualPrice}
                          keyboardType="decimal-pad"
                        />

                        <Text style={styles.formLabel}>Admin Notes (Optional)</Text>
                        <TextInput
                          style={[styles.formInput, styles.formTextArea]}
                          placeholder="Add any notes..."
                          placeholderTextColor={colors.textMuted}
                          value={adminNotes}
                          onChangeText={setAdminNotes}
                          multiline
                          numberOfLines={2}
                        />

                        <View style={styles.formButtons}>
                          <TouchableOpacity
                            style={styles.formCancelButton}
                            onPress={() => setActionMode(null)}
                          >
                            <Text style={styles.formCancelText}>Cancel</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.formSubmitButton,
                              styles.approveButton,
                              isProcessing && styles.formSubmitButtonDisabled,
                            ]}
                            onPress={() => handleApprove(order.id, order.estimated_price)}
                            disabled={!actualPrice || isProcessing}
                          >
                            {isProcessing ? (
                              <ActivityIndicator size="small" color={colors.white} />
                            ) : (
                              <Text style={styles.formSubmitText}>Confirm Approval</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {actionMode === 'reject' && (
                      <View style={styles.actionForm}>
                        <Text style={styles.formLabel}>Rejection Reason</Text>
                        <TextInput
                          style={[styles.formInput, styles.formTextArea]}
                          placeholder="Explain why this order is being rejected..."
                          placeholderTextColor={colors.textMuted}
                          value={rejectionReason}
                          onChangeText={setRejectionReason}
                          multiline
                          numberOfLines={3}
                        />

                        <Text style={styles.formLabel}>Admin Notes (Optional)</Text>
                        <TextInput
                          style={[styles.formInput, styles.formTextArea]}
                          placeholder="Add any internal notes..."
                          placeholderTextColor={colors.textMuted}
                          value={adminNotes}
                          onChangeText={setAdminNotes}
                          multiline
                          numberOfLines={2}
                        />

                        <View style={styles.formButtons}>
                          <TouchableOpacity
                            style={styles.formCancelButton}
                            onPress={() => setActionMode(null)}
                          >
                            <Text style={styles.formCancelText}>Cancel</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.formSubmitButton,
                              styles.rejectButton,
                              isProcessing && styles.formSubmitButtonDisabled,
                            ]}
                            onPress={() => handleReject(order.id)}
                            disabled={!rejectionReason || isProcessing}
                          >
                            {isProcessing ? (
                              <ActivityIndicator size="small" color={colors.white} />
                            ) : (
                              <Text style={styles.formSubmitText}>Confirm Rejection</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </BlurView>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  statLabel: {
    fontSize: Typography.size.xs,
    color: colors.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.xxxxl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.size.sm,
    color: colors.textMuted,
  },
  emptyCard: {
    padding: Spacing.xxxl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  emptyText: {
    fontSize: Typography.size.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  orderCard: {
    marginBottom: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderSymbol: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  orderType: {
    fontSize: Typography.size.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  orderHeaderRight: {
    alignItems: 'flex-end',
  },
  orderQuantity: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  orderQuantityLabel: {
    fontSize: Typography.size.xs,
    color: colors.textMuted,
  },
  orderDetails: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
  },
  notesContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.md,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    marginTop: Spacing.sm,
  },
  notesText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: colors.info,
    lineHeight: 18,
  },
  actionPanel: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: Spacing.md,
    borderRadius: 12,
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.danger,
  },
  actionButtonText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  actionForm: {
    gap: Spacing.md,
  },
  formLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: Typography.size.md,
    color: colors.white,
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  formCancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCancelText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: colors.textMuted,
  },
  formSubmitButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSubmitButtonDisabled: {
    opacity: 0.5,
  },
  formSubmitText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
});
