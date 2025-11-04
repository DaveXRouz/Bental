import { useState, useEffect, useCallback } from 'react';
import { transferService, Transfer } from '@/services/banking/transfer-service';
import { useAuth } from '@/contexts/AuthContext';

export function useTransfers(accountId?: string, limit: number = 50) {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransfers = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let data: Transfer[];
      if (accountId) {
        data = await transferService.getAccountTransfers(user.id, accountId, limit);
      } else {
        data = await transferService.getTransferHistory(user.id, limit);
      }

      setTransfers(data);
    } catch (err: any) {
      console.error('Error fetching transfers:', err);
      setError(err.message || 'Failed to load transfers');
    } finally {
      setLoading(false);
    }
  }, [user?.id, accountId, limit]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const refetch = useCallback(() => {
    return fetchTransfers();
  }, [fetchTransfers]);

  return {
    transfers,
    loading,
    error,
    refetch,
  };
}
