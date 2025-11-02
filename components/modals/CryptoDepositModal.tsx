import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Clipboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Copy, CheckCircle, Clock, Bitcoin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { CryptoDeposit } from '@/types/models';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const DEMO_ADDRESSES = {
  BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
};

const CRYPTO_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin', confirmations: 3 },
  { symbol: 'ETH', name: 'Ethereum', network: 'Ethereum', confirmations: 12 },
  { symbol: 'USDT', name: 'Tether', network: 'Ethereum (ERC-20)', confirmations: 12 },
  { symbol: 'USDC', name: 'USD Coin', network: 'Ethereum (ERC-20)', confirmations: 12 },
];

export default function CryptoDepositModal({ visible, onClose }: Props) {
  const { user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState(CRYPTO_ASSETS[0]);
  const [depositAddress, setDepositAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState<CryptoDeposit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPendingDeposits();
      generateDemoAddress();
    }
  }, [visible, selectedAsset]);

  const generateDemoAddress = () => {
    const address = DEMO_ADDRESSES[selectedAsset.symbol as keyof typeof DEMO_ADDRESSES];
    setDepositAddress(address);
  };

  const loadPendingDeposits = async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_deposits')
        .select('*')
        .eq('user_id', user?.id)
        .in('status', ['pending', 'confirming'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingDeposits(data || []);
    } catch (error) {
      console.error('Error loading deposits:', error);
    }
  };

  const handleCopy = async () => {
    await Clipboard.setString(depositAddress);
    setCopied(true);

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }

    setTimeout(() => setCopied(false), 2000);
  };

  const simulateDemoDeposit = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const demoTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;
      const demoAmount = (Math.random() * 10 + 0.1).toFixed(8);

      const { data, error } = await supabase
        .from('crypto_deposits')
        .insert({
          user_id: user?.id,
          asset: selectedAsset.symbol,
          network: selectedAsset.network,
          address: depositAddress,
          tx_hash: demoTxHash,
          amount: parseFloat(demoAmount),
          status: 'confirming',
          confirmations: 0,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Demo Deposit Created', 'Watch as confirmations increase automatically!');

      simulateConfirmations(data.id, selectedAsset.confirmations);
      loadPendingDeposits();
    } catch (error) {
      console.error('Error creating demo deposit:', error);
      Alert.alert('Error', 'Failed to create demo deposit');
    } finally {
      setLoading(false);
    }
  };

  const simulateConfirmations = (depositId: string, maxConfirmations: number) => {
    let currentConfirmations = 0;

    const interval = setInterval(async () => {
      currentConfirmations++;

      const status = currentConfirmations >= maxConfirmations ? 'completed' : 'confirming';

      await supabase
        .from('crypto_deposits')
        .update({
          confirmations: currentConfirmations,
          status,
        })
        .eq('id', depositId);

      if (currentConfirmations >= maxConfirmations) {
        clearInterval(interval);
        Alert.alert('Deposit Complete', 'Your crypto deposit has been confirmed!');
      }

      loadPendingDeposits();
    }, 5000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Crypto Deposit</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.label}>Select Asset</Text>
              <View style={styles.assetGrid}>
                {CRYPTO_ASSETS.map((asset) => (
                  <TouchableOpacity
                    key={asset.symbol}
                    style={[
                      styles.assetButton,
                      selectedAsset.symbol === asset.symbol && styles.assetButtonActive,
                    ]}
                    onPress={() => setSelectedAsset(asset)}
                  >
                    <Bitcoin
                      size={24}
                      color={
                        selectedAsset.symbol === asset.symbol ? '#F59E0B' : colors.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.assetSymbol,
                        selectedAsset.symbol === asset.symbol && styles.assetSymbolActive,
                      ]}
                    >
                      {asset.symbol}
                    </Text>
                    <Text style={styles.assetName}>{asset.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Deposit Address</Text>
              <View style={styles.addressCard}>
                <View style={styles.qrPlaceholder}>
                  <Bitcoin size={48} color="#F59E0B" />
                  <Text style={styles.qrText}>Scan QR Code</Text>
                </View>

                <View style={styles.addressContainer}>
                  <Text style={styles.networkBadge}>{selectedAsset.network}</Text>
                  <Text style={styles.address} numberOfLines={2}>
                    {depositAddress}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopy}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={copied ? ['#10B981', '#059669'] : ['#3B82F6', '#2563EB']}
                    style={styles.copyGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {copied ? (
                      <CheckCircle size={20} color={colors.white} />
                    ) : (
                      <Copy size={20} color={colors.white} />
                    )}
                    <Text style={styles.copyText}>{copied ? 'Copied!' : 'Copy Address'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.warningCard}>
                <Text style={styles.warningText}>
                  Only send {selectedAsset.symbol} to this address on {selectedAsset.network}.
                  Requires {selectedAsset.confirmations} confirmations.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={simulateDemoDeposit}
              disabled={loading}
            >
              <Text style={styles.demoButtonText}>
                {loading ? 'Creating Demo Deposit...' : 'Simulate Demo Deposit'}
              </Text>
            </TouchableOpacity>

            {pendingDeposits.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.label}>Pending Deposits</Text>
                {pendingDeposits.map((deposit) => (
                  <View key={deposit.id} style={styles.depositCard}>
                    <View style={styles.depositHeader}>
                      <View style={styles.depositInfo}>
                        <Text style={styles.depositAsset}>{deposit.asset}</Text>
                        <Text style={styles.depositAmount}>
                          {deposit.amount?.toFixed(8) || 'Pending'}
                        </Text>
                      </View>
                      <View style={styles.statusBadge}>
                        <Clock size={14} color="#F59E0B" />
                        <Text style={styles.statusText}>
                          {deposit.confirmations}/
                          {
                            CRYPTO_ASSETS.find((a) => a.symbol === deposit.asset)
                              ?.confirmations
                          }
                        </Text>
                      </View>
                    </View>

                    {deposit.tx_hash && (
                      <Text style={styles.txHash} numberOfLines={1}>
                        {deposit.tx_hash}
                      </Text>
                    )}

                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${
                              (deposit.confirmations /
                                (CRYPTO_ASSETS.find((a) => a.symbol === deposit.asset)
                                  ?.confirmations || 1)) *
                              100
                            }%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'rgba(20,20,20,0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
    marginBottom: Spacing.md,
  },
  assetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  assetButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  assetButtonActive: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderColor: '#F59E0B',
  },
  assetSymbol: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: colors.textMuted,
    marginTop: Spacing.xs,
  },
  assetSymbolActive: {
    color: '#F59E0B',
  },
  assetName: {
    fontSize: Typography.size.xs,
    color: colors.textMuted,
  },
  addressCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 160,
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  qrText: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
    marginTop: Spacing.sm,
  },
  addressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  networkBadge: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    fontSize: Typography.size.xs,
    color: '#3B82F6',
    marginBottom: Spacing.sm,
  },
  address: {
    fontSize: Typography.size.sm,
    color: colors.white,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  copyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  copyText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  warningCard: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  warningText: {
    fontSize: Typography.size.sm,
    color: '#F59E0B',
    lineHeight: 20,
  },
  demoButton: {
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  demoButtonText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: '#A78BFA',
  },
  depositCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  depositHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  depositInfo: {
    flex: 1,
  },
  depositAsset: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  depositAmount: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: '#F59E0B',
  },
  txHash: {
    fontSize: Typography.size.xs,
    color: colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
});
