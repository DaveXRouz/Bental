import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Wallet, TrendingUp, Bitcoin, DollarSign, PiggyBank, Zap } from 'lucide-react-native';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountContext } from '@/contexts/AccountContext';

interface Account {
  id: string;
  name: string;
  account_type: string;
  balance: number;
  displayName?: string;
}

interface AssetAllocation {
  label: string;
  value: number;
  percent: number;
  color: string;
  icon: any;
}

interface AccountSplitProps {
  accounts: Account[];
  totalValue: number;
}

const S = 8;

// Asset type styles for allocation breakdown
const ASSET_TYPE_STYLES: Record<string, { color: string; icon: any; label: string }> = {
  cash: { color: '#10B981', icon: Wallet, label: 'Cash' },
  stocks: { color: '#3B82F6', icon: TrendingUp, label: 'Stocks' },
  crypto: { color: '#F59E0B', icon: Bitcoin, label: 'Crypto' },
  bonds: { color: '#8B5CF6', icon: DollarSign, label: 'Bonds' },
  other: { color: '#6B7280', icon: PiggyBank, label: 'Other' },
};

export const AccountSplit = React.memo(({ accounts, totalValue }: AccountSplitProps) => {
  const { user } = useAuth();
  const { selectedAccountIds } = useAccountContext();
  const [assetAllocations, setAssetAllocations] = useState<AssetAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Ref to track if fetch is in progress (prevents duplicate requests)
  const fetchInProgressRef = useRef(false);
  // Ref to store AbortController for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize accountIds to prevent infinite loop from array reference changes
  const accountIdsMemo = useMemo(() => {
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return [];
    }

    // Use selected accounts if any, otherwise use all accounts
    if (selectedAccountIds && selectedAccountIds.length > 0) {
      return selectedAccountIds;
    }

    return accounts.map(a => a.id);
  }, [
    selectedAccountIds?.length,
    selectedAccountIds?.[0],
    accounts.length,
    accounts[0]?.id
  ]);

  // Memoized fetch function with abort signal support
  const fetchAssetBreakdown = useCallback(async (signal: AbortSignal) => {
    // Prevent duplicate concurrent requests
    if (fetchInProgressRef.current) {
      console.log('[AccountSplit] Request already in progress, skipping');
      return;
    }

    if (!user?.id) {
      console.warn('[AccountSplit] No user ID available');
      setAssetAllocations([]);
      setLoading(false);
      return;
    }

    // Validate accounts prop
    if (!accounts || !Array.isArray(accounts)) {
      console.warn('[AccountSplit] Invalid accounts prop');
      setAssetAllocations([]);
      setLoading(false);
      return;
    }

    // Validate accountIds before making queries
    if (!accountIdsMemo || accountIdsMemo.length === 0) {
      console.log('[AccountSplit] No accounts to display');
      setAssetAllocations([]);
      setLoading(false);
      return;
    }

    fetchInProgressRef.current = true;

    try {
      setLoading(true);

      console.log(`[AccountSplit] Fetching data for ${accountIdsMemo.length} accounts`);

      // Check if request was aborted
      if (signal.aborted) {
        console.log('[AccountSplit] Request aborted before fetch');
        return;
      }

      // Get account balances by type
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('id, account_type, balance')
        .eq('user_id', user.id)
        .in('id', accountIdsMemo)
        .eq('status', 'active')
        .abortSignal(signal);

        if (accountsError) {
          // Don't treat abort as an error
          if (accountsError.message?.includes('aborted') || signal.aborted) {
            console.log('[AccountSplit] Request was aborted');
            return;
          }
          console.error('[AccountSplit] Error fetching accounts:', accountsError);
          setAssetAllocations([]);
          setLoading(false);
          return;
        }

        const accountsList = accountsData || [];

        // Check if request was aborted
        if (signal.aborted) {
          console.log('[AccountSplit] Request aborted after accounts fetch');
          return;
        }

        // Get holdings by asset type - with proper filters
        const { data: holdingsData, error: holdingsError } = await supabase
          .from('holdings')
          .select('asset_type, market_value')
          .eq('user_id', user.id)
          .in('account_id', accountIdsMemo)
          .abortSignal(signal);

        if (holdingsError) {
          // Don't treat abort as an error
          if (!holdingsError.message?.includes('aborted') && !signal.aborted) {
            console.error('[AccountSplit] Error fetching holdings:', holdingsError);
          }
          // Continue with just account data even if holdings fail
        }

        // Final abort check before setting state
        if (signal.aborted) {
          console.log('[AccountSplit] Request aborted after holdings fetch');
          return;
        }

        const holdingsList = holdingsData || [];
        console.log(`[AccountSplit] Found ${accountsList.length} accounts and ${holdingsList.length} holdings`);

        // Categorize accounts
        const cashAccountTypes = ['primary_cash', 'savings_cash', 'trading_cash', 'demo_cash', 'live_cash'];
        const equityAccountTypes = ['equity_trading', 'dividend_income', 'margin_trading', 'demo_equity', 'live_equity'];
        const cryptoAccountTypes = ['crypto_portfolio', 'demo_crypto'];

        // Calculate pure cash (only from cash-type accounts)
        const cashTotal = accountsList
          .filter(a => cashAccountTypes.includes(a.account_type))
          .reduce((sum, a) => sum + Number(a.balance), 0);

        // Calculate stock holdings + uninvested cash in equity accounts
        const stockHoldings = holdingsList
          .filter(h => h.asset_type === 'stock')
          .reduce((sum, h) => sum + Number(h.market_value), 0);
        const equityCash = accountsList
          .filter(a => equityAccountTypes.includes(a.account_type))
          .reduce((sum, a) => sum + Number(a.balance), 0);
        const stocksTotal = stockHoldings + equityCash;

        // Calculate crypto holdings + uninvested cash in crypto accounts
        const cryptoHoldings = holdingsList
          .filter(h => h.asset_type === 'crypto')
          .reduce((sum, h) => sum + Number(h.market_value), 0);
        const cryptoCash = accountsList
          .filter(a => cryptoAccountTypes.includes(a.account_type))
          .reduce((sum, a) => sum + Number(a.balance), 0);
        const cryptoTotal = cryptoHoldings + cryptoCash;

        // Calculate bonds
        const bondsTotal = holdingsList
          .filter(h => h.asset_type === 'bond')
          .reduce((sum, h) => sum + Number(h.market_value), 0);

        // Calculate other
        const otherTotal = holdingsList
          .filter(h => !['stock', 'crypto', 'bond'].includes(h.asset_type))
          .reduce((sum, h) => sum + Number(h.market_value), 0);

        // Build allocations array
        const allocations: AssetAllocation[] = [];
        const total = cashTotal + stocksTotal + cryptoTotal + bondsTotal + otherTotal;

        if (cashTotal > 0) {
          allocations.push({
            label: ASSET_TYPE_STYLES.cash.label,
            value: cashTotal,
            percent: total > 0 ? (cashTotal / total) * 100 : 0,
            color: ASSET_TYPE_STYLES.cash.color,
            icon: ASSET_TYPE_STYLES.cash.icon,
          });
        }

        if (stocksTotal > 0) {
          allocations.push({
            label: ASSET_TYPE_STYLES.stocks.label,
            value: stocksTotal,
            percent: total > 0 ? (stocksTotal / total) * 100 : 0,
            color: ASSET_TYPE_STYLES.stocks.color,
            icon: ASSET_TYPE_STYLES.stocks.icon,
          });
        }

        if (cryptoTotal > 0) {
          allocations.push({
            label: ASSET_TYPE_STYLES.crypto.label,
            value: cryptoTotal,
            percent: total > 0 ? (cryptoTotal / total) * 100 : 0,
            color: ASSET_TYPE_STYLES.crypto.color,
            icon: ASSET_TYPE_STYLES.crypto.icon,
          });
        }

        if (bondsTotal > 0) {
          allocations.push({
            label: ASSET_TYPE_STYLES.bonds.label,
            value: bondsTotal,
            percent: total > 0 ? (bondsTotal / total) * 100 : 0,
            color: ASSET_TYPE_STYLES.bonds.color,
            icon: ASSET_TYPE_STYLES.bonds.icon,
          });
        }

        if (otherTotal > 0) {
          allocations.push({
            label: ASSET_TYPE_STYLES.other.label,
            value: otherTotal,
            percent: total > 0 ? (otherTotal / total) * 100 : 0,
            color: ASSET_TYPE_STYLES.other.color,
            icon: ASSET_TYPE_STYLES.other.icon,
          });
        }

        // Sort by value (highest first)
        allocations.sort((a, b) => b.value - a.value);

        setAssetAllocations(allocations);
        console.log(`[AccountSplit] Successfully calculated ${allocations.length} asset allocations`);
      } catch (error: any) {
        console.error('[AccountSplit] Failed to fetch asset breakdown:', error);
        console.error('[AccountSplit] Error details:', {
          message: error?.message,
          name: error?.name,
          code: error?.code
        });
        setAssetAllocations([]);
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
  }, [user?.id, accountIdsMemo, accounts.length]);

  useEffect(() => {
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Add timeout to prevent infinite loading (increased to 35s to match API timeout + buffer)
    const timeoutId = setTimeout(() => {
      if (fetchInProgressRef.current) {
        console.warn('[AccountSplit] Query timeout after 35s - aborting request');
        abortControllerRef.current?.abort();
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    }, 35000); // 35 second timeout (5s buffer over 30s API timeout)

    // Execute fetch with abort signal
    fetchAssetBreakdown(signal).finally(() => {
      clearTimeout(timeoutId);
    });

    // Cleanup function: abort request and clear timeout
    return () => {
      abortControllerRef.current?.abort();
      clearTimeout(timeoutId);
      fetchInProgressRef.current = false;
    };
  }, [user?.id, accountIdsMemo, fetchAssetBreakdown]);

  if (loading) {
    return (
      <BlurView intensity={15} tint="dark" style={styles.container}>
        <Text style={styles.title}>Account Split</Text>
        <Text style={styles.emptyText}>Loading...</Text>
      </BlurView>
    );
  }

  if (assetAllocations.length === 0) {
    return (
      <BlurView intensity={15} tint="dark" style={styles.container}>
        <Text style={styles.title}>Account Split</Text>
        <Text style={styles.emptyText}>No assets</Text>
      </BlurView>
    );
  }

  return (
    <BlurView intensity={15} tint="dark" style={styles.container}>
      <Text style={styles.title}>Account Split</Text>

      {assetAllocations.map((allocation, index) => {
        const Icon = allocation.icon;

        return (
          <Animated.View
            key={allocation.label}
            entering={FadeIn.duration(400).delay(index * 100)}
          >
            <View style={styles.row}>
              <View style={styles.labelRow}>
                <View style={[styles.iconContainer, { backgroundColor: `${allocation.color}20` }]}>
                  <Icon size={14} color={allocation.color} strokeWidth={2} />
                </View>
                <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
                  {allocation.label}
                </Text>
              </View>
              <CurrencyDisplay
                value={allocation.value}
                size="small"
                compact={allocation.value >= 100000}
                style={styles.amount}
              />
              <Text style={styles.percent}>{allocation.percent.toFixed(1)}%</Text>
            </View>

            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${allocation.percent}%`,
                    backgroundColor: allocation.color,
                  },
                ]}
                entering={FadeIn.duration(600).delay(index * 100 + 200)}
              />
            </View>
          </Animated.View>
        );
      })}
    </BlurView>
  );
});

AccountSplit.displayName = 'AccountSplit';

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    marginBottom: S * 3,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.white,
    marginBottom: S * 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: S,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S,
    flex: 1,
    minWidth: 0,
  },
  iconContainer: {
    width: S * 3,
    height: S * 3,
    borderRadius: S * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
    flex: 1,
  },
  amount: {
    color: colors.white,
    marginRight: S * 2,
  },
  percent: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    minWidth: 50,
    textAlign: 'right',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: S * 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyText: {
    fontSize: typography.size.md,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: S * 2,
  },
});
