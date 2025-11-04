import { supabase } from '@/lib/supabase';
import { clearConsole } from '@/utils/console-manager';

export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  notes?: string;
}

export interface Transfer {
  id: string;
  from_account_id: string;
  from_account_name: string;
  to_account_id: string;
  to_account_name: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference_number: string;
  notes?: string;
  created_at: string;
}

export interface TransferResult {
  success: boolean;
  transferId?: string;
  referenceNumber?: string;
  message: string;
  error?: string;
}

class TransferService {
  /**
   * Validate transfer request before execution
   */
  private async validateTransferRequest(
    request: TransferRequest,
    userId: string
  ): Promise<{ valid: boolean; error?: string }> {
    // Validate amount
    if (request.amount <= 0) {
      return { valid: false, error: 'Amount must be greater than zero' };
    }

    if (request.amount > 10000000) {
      return { valid: false, error: 'Amount exceeds maximum transfer limit of $10,000,000' };
    }

    // Validate accounts are different
    if (request.fromAccountId === request.toAccountId) {
      return { valid: false, error: 'Cannot transfer to the same account' };
    }

    // Verify both accounts belong to user
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, balance, name')
      .eq('user_id', userId)
      .in('id', [request.fromAccountId, request.toAccountId]);

    if (!accounts || accounts.length !== 2) {
      return { valid: false, error: 'One or both accounts not found or do not belong to you' };
    }

    // Check sufficient balance
    const fromAccount = accounts.find(a => a.id === request.fromAccountId);
    if (!fromAccount) {
      return { valid: false, error: 'Source account not found' };
    }

    if (Number(fromAccount.balance) < request.amount) {
      return {
        valid: false,
        error: `Insufficient funds. Available balance: $${Number(fromAccount.balance).toFixed(2)}`,
      };
    }

    return { valid: true };
  }

  /**
   * Execute a transfer between user's accounts
   */
  async executeTransfer(request: TransferRequest, userId: string): Promise<TransferResult> {
    clearConsole();

    try {
      // Validate request
      const validation = await this.validateTransferRequest(request, userId);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.error || 'Validation failed',
          error: validation.error,
        };
      }

      // Execute transfer via database function (atomic operation)
      const { data, error } = await supabase.rpc('execute_transfer', {
        p_user_id: userId,
        p_from_account_id: request.fromAccountId,
        p_to_account_id: request.toAccountId,
        p_amount: request.amount,
        p_notes: request.notes || null,
      });

      if (error) throw error;

      // Parse result
      const result = data as {
        success: boolean;
        transfer_id?: string;
        reference_number?: string;
        message?: string;
        error?: string;
      };

      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Transfer failed',
          error: result.error,
        };
      }

      return {
        success: true,
        transferId: result.transfer_id,
        referenceNumber: result.reference_number,
        message: result.message || 'Transfer completed successfully',
      };
    } catch (error: any) {
      console.error('Transfer execution error:', error);
      return {
        success: false,
        message: 'Failed to complete transfer',
        error: error.message,
      };
    }
  }

  /**
   * Get transfer history for user
   */
  async getTransferHistory(userId: string, limit: number = 50): Promise<Transfer[]> {
    try {
      const { data, error } = await supabase.rpc('get_transfer_history', {
        p_user_id: userId,
        p_limit: limit,
      });

      if (error) throw error;
      return (data || []) as Transfer[];
    } catch (error) {
      console.error('Error fetching transfer history:', error);
      return [];
    }
  }

  /**
   * Get transfer by reference number
   */
  async getTransferByReference(
    referenceNumber: string,
    userId: string
  ): Promise<Transfer | null> {
    try {
      const { data: transfers } = await supabase.rpc('get_transfer_history', {
        p_user_id: userId,
        p_limit: 1000, // Search through recent transfers
      });

      if (!transfers) return null;

      const transfer = transfers.find(
        (t: Transfer) => t.reference_number === referenceNumber
      );

      return transfer || null;
    } catch (error) {
      console.error('Error fetching transfer by reference:', error);
      return null;
    }
  }

  /**
   * Get pending transfers count
   */
  async getPendingCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('transfers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching pending transfers count:', error);
      return 0;
    }
  }

  /**
   * Get transfers for specific account
   */
  async getAccountTransfers(
    userId: string,
    accountId: string,
    limit: number = 50
  ): Promise<Transfer[]> {
    try {
      const allTransfers = await this.getTransferHistory(userId, limit * 2);

      // Filter transfers involving the specific account
      return allTransfers.filter(
        t => t.from_account_id === accountId || t.to_account_id === accountId
      );
    } catch (error) {
      console.error('Error fetching account transfers:', error);
      return [];
    }
  }
}

export const transferService = new TransferService();
