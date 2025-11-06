import { supabase } from '@/lib/supabase';

export type DepositMethod = 'bank_transfer' | 'wire' | 'check' | 'card' | 'crypto' | 'cash_courier';
export type WithdrawalMethod = 'bank_transfer' | 'wire' | 'check' | 'ach' | 'paypal' | 'venmo' | 'crypto' | 'debit_card';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

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
        message: `Withdrawal request submitted successfully. Reference: ${referenceNumber}`,
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
}

export const depositWithdrawalService = new DepositWithdrawalService();
