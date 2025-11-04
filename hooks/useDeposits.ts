import { useState, useEffect, useCallback } from 'react';
import { depositWithdrawalService, Deposit, DepositRequest } from '@/services/banking/deposit-withdrawal-service';
import { useAuth } from '@/contexts/AuthContext';

export function useDeposits() {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchDeposits = useCallback(async () => {
    if (!user) {
      setDeposits([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await depositWithdrawalService.getDeposits(user.id);
      setDeposits(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch deposits');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const createDeposit = useCallback(
    async (request: DepositRequest) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setSubmitting(true);
      try {
        const result = await depositWithdrawalService.createDeposit(request, user.id);
        if (result.success) {
          await fetchDeposits();
        }
        return result;
      } finally {
        setSubmitting(false);
      }
    },
    [user, fetchDeposits]
  );

  const pendingDeposits = deposits.filter((d) => d.status === 'pending' || d.status === 'processing');
  const completedDeposits = deposits.filter((d) => d.status === 'completed');

  return {
    deposits,
    pendingDeposits,
    completedDeposits,
    loading,
    error,
    submitting,
    createDeposit,
    refresh: fetchDeposits,
  };
}
