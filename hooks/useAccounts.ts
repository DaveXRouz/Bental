import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Account {
  id: string;
  user_id: string;
  account_type: string;
  name: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Custom hook for managing user accounts
 *
 * Fetches and manages all active accounts for the authenticated user.
 * Automatically refetches when the user session changes.
 *
 * @returns {Object} Account management object
 * @returns {Account[]} accounts - Array of user's active accounts
 * @returns {boolean} loading - Loading state for account fetching
 * @returns {string | null} error - Error message if fetch fails
 * @returns {Function} refetch - Manual refetch function
 * @returns {Function} getTotalBalance - Calculate total balance across all accounts
 *
 * @example
 * ```tsx
 * const { accounts, loading, error, refetch, getTotalBalance } = useAccounts();
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error} />;
 *
 * const total = getTotalBalance();
 * return (
 *   <View>
 *     <Text>Total Balance: ${total.toFixed(2)}</Text>
 *     {accounts.map(account => (
 *       <AccountCard key={account.id} account={account} />
 *     ))}
 *   </View>
 * );
 * ```
 */
export function useAccounts() {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchAccounts();
    }
  }, [session?.user?.id]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', session?.user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAccounts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  };

  return { accounts, loading, error, refetch: fetchAccounts, getTotalBalance };
}
