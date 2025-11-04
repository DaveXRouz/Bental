import { useState, useEffect, useCallback } from 'react';
import { depositWithdrawalService, Withdrawal, WithdrawalRequest } from '@/services/banking/deposit-withdrawal-service';
import { useAuth } from '@/contexts/AuthContext';

export function useWithdrawals() {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchWithdrawals = useCallback(async () => {
    if (!user) {
      setWithdrawals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await depositWithdrawalService.getWithdrawals(user.id);
      setWithdrawals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const createWithdrawal = useCallback(
    async (request: WithdrawalRequest) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setSubmitting(true);
      try {
        const result = await depositWithdrawalService.createWithdrawal(request, user.id);
        if (result.success) {
          await fetchWithdrawals();
        }
        return result;
      } finally {
        setSubmitting(false);
      }
    },
    [user, fetchWithdrawals]
  );

  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending' || w.status === 'processing');
  const completedWithdrawals = withdrawals.filter((w) => w.status === 'completed');

  return {
    withdrawals,
    pendingWithdrawals,
    completedWithdrawals,
    loading,
    error,
    submitting,
    createWithdrawal,
    refresh: fetchWithdrawals,
  };
}
