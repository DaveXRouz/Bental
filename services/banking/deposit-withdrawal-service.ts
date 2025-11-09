import { supabase } from '@/lib/supabase';

export type DepositMethod = 'bank_transfer' | 'wire' | 'check' | 'card' | 'crypto' | 'cash_courier';
export type WithdrawalMethod = 'bank_transfer' | 'wire' | 'check' | 'ach' | 'paypal' | 'venmo' | 'crypto' | 'debit_card';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type AdminApprovalStatus = 'pending_review' | 'approved' | 'rejected' | 'cancelled';
export type RejectionReason = 'insufficient_verification' | 'suspicious_activity' | 'incorrect_details' | 'insufficient_funds' | 'other';

export interface Deposit {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  method: DepositMethod;
  status: TransactionStatus;
  reference_number: string;
  bank_name?: string;
  account_number_last4?: string;
  notes?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  method: WithdrawalMethod;
  status: TransactionStatus;
  reference_number: string;
  // Traditional banking fields
  bank_name?: string;
  account_number_last4?: string;
  routing_number?: string;
  // Digital wallet fields
  email?: string;
  // Crypto fields
  crypto_address?: string;
  crypto_currency?: string;
  crypto_network?: string;
  // Card fields
  card_last4?: string;
  // Admin approval fields
  admin_approval_status?: AdminApprovalStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
  original_amount?: number;
  modified_amount?: number;
  rejection_reason?: RejectionReason;
  // Common fields
  notes?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DepositRequest {
  accountId: string;
  amount: number;
  method: DepositMethod;
  bankName?: string;
  accountNumberLast4?: string;
  notes?: string;
}

export interface WithdrawalRequest {
  accountId: string;
  amount: number;
  method: WithdrawalMethod;
  // Traditional banking fields
  bankName?: string;
  accountNumberLast4?: string;
  routingNumber?: string;
  // Digital wallet fields
  email?: string; // For PayPal, Venmo
  // Crypto fields
  cryptoAddress?: string;
  cryptoCurrency?: string; // BTC, ETH, USDT, USDC
  cryptoNetwork?: string;
  // Card fields
  cardLast4?: string;
  notes?: string;
}

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  message: string;
  error?: string;
}

class DepositWithdrawalService {
  /**
   * Generate a unique reference number for transactions
   */
  private generateReferenceNumber(type: 'DEP' | 'WTH'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${type}-${timestamp}-${random}`;
  }

  /**
   * Validate deposit request
   */
  private validateDepositRequest(request: DepositRequest): { valid: boolean; error?: string } {
    if (request.amount <= 0) {
      return { valid: false, error: 'Amount must be greater than zero' };
    }

    if (request.amount > 1000000) {
      return { valid: false, error: 'Amount exceeds maximum deposit limit of $1,000,000' };
    }

    const validMethods: DepositMethod[] = ['bank_transfer', 'wire', 'check', 'card', 'crypto', 'cash_courier'];
    if (!validMethods.includes(request.method)) {
      return { valid: false, error: 'Invalid deposit method' };
    }

    // Additional validation for cash courier
    if (request.method === 'cash_courier') {
      if (request.amount < 10000) {
        return { valid: false, error: 'Cash courier requires minimum deposit of $10,000' };
      }
      if (request.amount > 500000) {
        return { valid: false, error: 'Cash courier maximum deposit is $500,000' };
      }
    }

    return { valid: true };
  }

  /**
   * Validate withdrawal request
   */
  private async validateWithdrawalRequest(
    request: WithdrawalRequest,
    userId: string
  ): Promise<{ valid: boolean; error?: string }> {
    if (request.amount <= 0) {
      return { valid: false, error: 'Amount must be greater than zero' };
    }

    // Check account balance
    const { data: account } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', request.accountId)
      .eq('user_id', userId)
      .single();

    if (!account) {
      return { valid: false, error: 'Account not found' };
    }

    if (Number(account.balance) < request.amount) {
      return { valid: false, error: 'Insufficient funds in account' };
    }

    const validMethods: WithdrawalMethod[] = ['bank_transfer', 'wire', 'check', 'ach', 'paypal', 'venmo', 'crypto', 'debit_card'];
    if (!validMethods.includes(request.method)) {
      return { valid: false, error: 'Invalid withdrawal method' };
    }

    // Method-specific validation
    if (request.method === 'bank_transfer' || request.method === 'wire' || request.method === 'check' || request.method === 'ach') {
      if (!request.bankName || request.bankName.trim().length === 0) {
        return { valid: false, error: 'Bank name is required' };
      }
      if (!request.accountNumberLast4 || request.accountNumberLast4.length !== 4) {
        return { valid: false, error: 'Invalid account number (last 4 digits required)' };
      }
    }

    if (request.method === 'paypal' || request.method === 'venmo') {
      if (!request.email || !this.isValidEmail(request.email)) {
        return { valid: false, error: 'Valid email address is required' };
      }
    }

    if (request.method === 'crypto') {
      if (!request.cryptoAddress || request.cryptoAddress.trim().length === 0) {
        return { valid: false, error: 'Crypto wallet address is required' };
      }
      if (!request.cryptoCurrency) {
        return { valid: false, error: 'Cryptocurrency type is required' };
      }
      const validCryptos = ['BTC', 'ETH', 'USDT', 'USDC'];
      if (!validCryptos.includes(request.cryptoCurrency)) {
        return { valid: false, error: 'Invalid cryptocurrency type' };
      }
    }

    if (request.method === 'debit_card') {
      if (!request.cardLast4 || request.cardLast4.length !== 4) {
        return { valid: false, error: 'Invalid card number (last 4 digits required)' };
      }
      // Instant withdrawal fee for debit card
      if (request.amount > 10000) {
        return { valid: false, error: 'Debit card withdrawals limited to $10,000' };
      }
    }

    return { valid: true };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Create a deposit request
   */
  async createDeposit(request: DepositRequest, userId: string): Promise<TransactionResult> {
    try {
      // Validate request
      const validation = this.validateDepositRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.error || 'Validation failed',
          error: validation.error,
        };
      }

      // Generate reference number
      const referenceNumber = this.generateReferenceNumber('DEP');

      // Create deposit record
      const { data: deposit, error } = await supabase
        .from('deposits')
        .insert({
          user_id: userId,
          account_id: request.accountId,
          amount: request.amount,
          method: request.method,
          status: 'pending',
          reference_number: referenceNumber,
          bank_name: request.bankName,
          account_number_last4: request.accountNumberLast4,
          notes: request.notes,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        transactionId: deposit.id,
        message: `Deposit request created successfully. Reference: ${referenceNumber}`,
      };
    } catch (error: any) {
      console.error('Create deposit error:', error);
      return {
        success: false,
        message: 'Failed to create deposit request',
        error: error.message,
      };
    }
  }

  /**
   * Create a withdrawal request
   */
  async createWithdrawal(request: WithdrawalRequest, userId: string): Promise<TransactionResult> {
    try {
      // Validate request
      const validation = await this.validateWithdrawalRequest(request, userId);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.error || 'Validation failed',
          error: validation.error,
        };
      }

      // Generate reference number
      const referenceNumber = this.generateReferenceNumber('WTH');

      // Create withdrawal record (funds will be deducted when processed)
      const insertData: any = {
        user_id: userId,
        account_id: request.accountId,
        amount: request.amount,
        method: request.method,
        status: 'pending',
        reference_number: referenceNumber,
        notes: request.notes,
      };

      // Add method-specific fields
      if (request.bankName) insertData.bank_name = request.bankName;
      if (request.accountNumberLast4) insertData.account_number_last4 = request.accountNumberLast4;
      if (request.routingNumber) insertData.routing_number = request.routingNumber;
      if (request.email) insertData.email = request.email;
      if (request.cryptoAddress) insertData.crypto_address = request.cryptoAddress;
      if (request.cryptoCurrency) insertData.crypto_currency = request.cryptoCurrency;
      if (request.cryptoNetwork) insertData.crypto_network = request.cryptoNetwork;
      if (request.cardLast4) insertData.card_last4 = request.cardLast4;

      const { data: withdrawal, error } = await supabase
        .from('withdrawals')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        transactionId: withdrawal.id,
        message: `Withdrawal request submitted for admin review. Reference: ${referenceNumber}`,
      };
    } catch (error: any) {
      console.error('Create withdrawal error:', error);
      return {
        success: false,
        message: 'Failed to create withdrawal request',
        error: error.message,
      };
    }
  }

  /**
   * Get user deposits
   */
  async getDeposits(userId: string, limit: number = 50): Promise<Deposit[]> {
    try {
      const { data, error } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching deposits:', error);
      return [];
    }
  }

  /**
   * Get user withdrawals
   */
  async getWithdrawals(userId: string, limit: number = 50): Promise<Withdrawal[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      return [];
    }
  }

  /**
   * Get pending transactions count
   */
  async getPendingCount(userId: string): Promise<{ deposits: number; withdrawals: number }> {
    try {
      const [depositsResult, withdrawalsResult] = await Promise.all([
        supabase
          .from('deposits')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'pending'),
        supabase
          .from('withdrawals')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'pending'),
      ]);

      return {
        deposits: depositsResult.count || 0,
        withdrawals: withdrawalsResult.count || 0,
      };
    } catch (error) {
      console.error('Error fetching pending count:', error);
      return { deposits: 0, withdrawals: 0 };
    }
  }

  /**
   * Approve withdrawal (admin only)
   */
  async approveWithdrawal(
    withdrawalId: string,
    adminId: string,
    notes?: string,
    modifiedAmount?: number
  ): Promise<TransactionResult> {
    try {
      const { data, error } = await supabase.rpc('admin_approve_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_admin_id: adminId,
        p_notes: notes || null,
        p_modified_amount: modifiedAmount || null,
      });

      if (error) throw error;

      const result = data as any;
      const message = result.modified
        ? `Withdrawal approved with modified amount: $${result.final_amount}`
        : `Withdrawal approved: $${result.final_amount}`;

      return {
        success: true,
        transactionId: withdrawalId,
        message,
      };
    } catch (error: any) {
      console.error('Approve withdrawal error:', error);
      return {
        success: false,
        message: 'Failed to approve withdrawal',
        error: error.message,
      };
    }
  }

  /**
   * Reject withdrawal (admin only)
   */
  async rejectWithdrawal(
    withdrawalId: string,
    adminId: string,
    rejectionReason: RejectionReason,
    notes: string
  ): Promise<TransactionResult> {
    try {
      const { data, error } = await supabase.rpc('admin_reject_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_admin_id: adminId,
        p_rejection_reason: rejectionReason,
        p_notes: notes,
      });

      if (error) throw error;

      return {
        success: true,
        transactionId: withdrawalId,
        message: 'Withdrawal rejected successfully',
      };
    } catch (error: any) {
      console.error('Reject withdrawal error:', error);
      return {
        success: false,
        message: 'Failed to reject withdrawal',
        error: error.message,
      };
    }
  }

  /**
   * Cancel withdrawal (user only, before admin review)
   */
  async cancelWithdrawal(withdrawalId: string, userId: string): Promise<TransactionResult> {
    try {
      const { data, error } = await supabase.rpc('user_cancel_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_user_id: userId,
      });

      if (error) throw error;

      return {
        success: true,
        transactionId: withdrawalId,
        message: 'Withdrawal cancelled successfully',
      };
    } catch (error: any) {
      console.error('Cancel withdrawal error:', error);
      return {
        success: false,
        message: error.message || 'Failed to cancel withdrawal',
        error: error.message,
      };
    }
  }

  /**
   * Get pending withdrawals for admin review
   *
   * Note: Uses implicit join with profiles and accounts tables.
   * Both withdrawals.user_id and profiles.id reference auth.users.id.
   */
  async getPendingWithdrawalsForAdmin(limit: number = 50): Promise<Withdrawal[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          profiles(email, full_name),
          accounts(name, balance)
        `)
        .eq('admin_approval_status', 'pending_review')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch pending withdrawals:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching pending withdrawals for admin:', error);
      return [];
    }
  }

  /**
   * Get all withdrawals for admin with filters
   *
   * Note: Uses implicit join with profiles and accounts tables.
   * Both withdrawals.user_id and profiles.id reference auth.users.id.
   */
  async getAdminWithdrawals(
    status?: AdminApprovalStatus,
    limit: number = 100
  ): Promise<Withdrawal[]> {
    try {
      let query = supabase
        .from('withdrawals')
        .select(`
          *,
          profiles(email, full_name),
          accounts(name, balance)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('admin_approval_status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch admin withdrawals:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching admin withdrawals:', error);
      return [];
    }
  }

  /**
   * Get withdrawal statistics for admin dashboard
   */
  async getWithdrawalStats(): Promise<{
    pending: number;
    pendingAmount: number;
    approvedToday: number;
    rejectedToday: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [pendingResult, approvedResult, rejectedResult] = await Promise.all([
        supabase
          .from('withdrawals')
          .select('amount')
          .eq('admin_approval_status', 'pending_review'),
        supabase
          .from('withdrawals')
          .select('id', { count: 'exact', head: true })
          .eq('admin_approval_status', 'approved')
          .gte('reviewed_at', today.toISOString()),
        supabase
          .from('withdrawals')
          .select('id', { count: 'exact', head: true })
          .eq('admin_approval_status', 'rejected')
          .gte('reviewed_at', today.toISOString()),
      ]);

      const pendingWithdrawals = pendingResult.data || [];
      const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

      return {
        pending: pendingWithdrawals.length,
        pendingAmount,
        approvedToday: approvedResult.count || 0,
        rejectedToday: rejectedResult.count || 0,
      };
    } catch (error) {
      console.error('Error fetching withdrawal stats:', error);
      return {
        pending: 0,
        pendingAmount: 0,
        approvedToday: 0,
        rejectedToday: 0,
      };
    }
  }

  /**
   * Get transaction by reference number
   */
  async getByReferenceNumber(
    referenceNumber: string,
    userId: string
  ): Promise<{ type: 'deposit' | 'withdrawal'; transaction: Deposit | Withdrawal } | null> {
    try {
      // Try deposits first
      const { data: deposit } = await supabase
        .from('deposits')
        .select('*')
        .eq('reference_number', referenceNumber)
        .eq('user_id', userId)
        .single();

      if (deposit) {
        return { type: 'deposit', transaction: deposit };
      }

      // Try withdrawals
      const { data: withdrawal } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('reference_number', referenceNumber)
        .eq('user_id', userId)
        .single();

      if (withdrawal) {
        return { type: 'withdrawal', transaction: withdrawal };
      }

      return null;
    } catch (error) {
      console.error('Error fetching transaction by reference:', error);
      return null;
    }
  }

  /**
   * Get all deposits for admin review
   *
   * Note: Uses implicit join with profiles and accounts tables.
   * Both deposits.user_id and profiles.id reference auth.users.id.
   */
  async getAdminDeposits(status?: TransactionStatus, limit: number = 100): Promise<Deposit[]> {
    try {
      let query = supabase
        .from('deposits')
        .select(`
          *,
          profiles(email, full_name),
          accounts(name, balance)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch admin deposits:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching admin deposits:', error);
      return [];
    }
  }

  /**
   * Get deposit statistics for admin dashboard
   */
  async getDepositStats(): Promise<{
    pending: number;
    pendingAmount: number;
    completedToday: number;
    failedToday: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [pendingResult, completedResult, failedResult] = await Promise.all([
        supabase.from('deposits').select('amount').eq('status', 'pending'),
        supabase
          .from('deposits')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('processed_at', today.toISOString()),
        supabase
          .from('deposits')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'failed')
          .gte('updated_at', today.toISOString()),
      ]);

      const pendingDeposits = pendingResult.data || [];
      const pendingAmount = pendingDeposits.reduce((sum, d) => sum + Number(d.amount), 0);

      return {
        pending: pendingDeposits.length,
        pendingAmount,
        completedToday: completedResult.count || 0,
        failedToday: failedResult.count || 0,
      };
    } catch (error) {
      console.error('Error fetching deposit stats:', error);
      return {
        pending: 0,
        pendingAmount: 0,
        completedToday: 0,
        failedToday: 0,
      };
    }
  }

  /**
   * Approve a deposit (admin only)
   */
  async approveDeposit(
    depositId: string,
    adminId: string,
    adminNotes?: string
  ): Promise<TransactionResult> {
    try {
      // Get deposit details
      const { data: deposit, error: fetchError } = await supabase
        .from('deposits')
        .select('*')
        .eq('id', depositId)
        .single();

      if (fetchError) throw fetchError;
      if (!deposit) throw new Error('Deposit not found');

      if (deposit.status !== 'pending' && deposit.status !== 'processing') {
        return {
          success: false,
          message: `Deposit cannot be approved in current status: ${deposit.status}`,
        };
      }

      // Update account balance
      const { error: balanceError } = await supabase.rpc('increment_account_balance', {
        account_id: deposit.account_id,
        amount: deposit.amount,
      });

      if (balanceError) throw balanceError;

      // Update deposit status
      const { error: updateError } = await supabase
        .from('deposits')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', depositId);

      if (updateError) throw updateError;

      return {
        success: true,
        transactionId: depositId,
        message: `Deposit approved successfully. $${deposit.amount} credited to account.`,
      };
    } catch (error: any) {
      console.error('Approve deposit error:', error);
      return {
        success: false,
        message: 'Failed to approve deposit',
        error: error.message,
      };
    }
  }

  /**
   * Reject a deposit (admin only)
   */
  async rejectDeposit(
    depositId: string,
    adminId: string,
    rejectionReason: string
  ): Promise<TransactionResult> {
    try {
      const { data: deposit, error: fetchError } = await supabase
        .from('deposits')
        .select('*')
        .eq('id', depositId)
        .single();

      if (fetchError) throw fetchError;
      if (!deposit) throw new Error('Deposit not found');

      if (deposit.status !== 'pending' && deposit.status !== 'processing') {
        return {
          success: false,
          message: `Deposit cannot be rejected in current status: ${deposit.status}`,
        };
      }

      const { error: updateError } = await supabase
        .from('deposits')
        .update({
          status: 'failed',
          admin_notes: rejectionReason,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', depositId);

      if (updateError) throw updateError;

      return {
        success: true,
        transactionId: depositId,
        message: 'Deposit rejected successfully',
      };
    } catch (error: any) {
      console.error('Reject deposit error:', error);
      return {
        success: false,
        message: 'Failed to reject deposit',
        error: error.message,
      };
    }
  }
}

export const depositWithdrawalService = new DepositWithdrawalService();
