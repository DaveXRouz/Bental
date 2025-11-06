import { supabase } from '@/lib/supabase';

export interface AccountType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'cash' | 'investment' | 'specialized';
  features: Record<string, any>;
  min_balance: number;
  allows_deposits: boolean;
  allows_withdrawals: boolean;
  allows_trading: boolean;
  allows_crypto: boolean;
  display_order: number;
  is_active: boolean;
}

export interface CreateAccountParams {
  accountType: string;
  name: string;
  description?: string;
  currency?: string;
  initialDeposit?: number;
}

export interface Account {
  id: string;
  user_id: string;
  account_type: string;
  name: string;
  account_description?: string;
  balance: number;
  currency: string;
  is_active: boolean;
  is_default: boolean;
  status: 'active' | 'frozen' | 'closed';
  account_features?: Record<string, any>;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

class AccountManagementService {
  /**
   * Fetch all available account types
   */
  async getAccountTypes(): Promise<{ success: boolean; data?: AccountType[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('account_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('[AccountManagement] Get account types error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get account type by ID
   */
  async getAccountTypeById(typeId: string): Promise<{ success: boolean; data?: AccountType; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('account_types')
        .select('*')
        .eq('id', typeId)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('[AccountManagement] Get account type error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new account for the user
   */
  async createAccount(
    userId: string,
    params: CreateAccountParams
  ): Promise<{ success: boolean; data?: Account; error?: string; message?: string }> {
    try {
      // Validate account name
      if (!params.name || params.name.trim().length === 0) {
        return { success: false, error: 'Account name is required' };
      }

      if (params.name.length > 50) {
        return { success: false, error: 'Account name must be less than 50 characters' };
      }

      // Check if account name already exists for user
      const { data: existingAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('name', params.name.trim())
        .maybeSingle();

      if (existingAccount) {
        return { success: false, error: 'An account with this name already exists' };
      }

      // Count active accounts
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', userId)
        .neq('status', 'closed');

      if (accounts && accounts.length >= 10) {
        return { success: false, error: 'Maximum number of accounts (10) reached' };
      }

      // Check if this is the first account (should be default)
      const isFirstAccount = !accounts || accounts.length === 0;

      // Create the account
      const { data: newAccount, error } = await supabase
        .from('accounts')
        .insert({
          user_id: userId,
          account_type: params.accountType,
          name: params.name.trim(),
          account_description: params.description?.trim() || null,
          balance: params.initialDeposit || 0,
          currency: params.currency || 'USD',
          is_active: true,
          is_default: isFirstAccount,
          status: 'active',
          account_features: {},
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: newAccount,
        message: `Account "${params.name}" created successfully`,
      };
    } catch (error: any) {
      console.error('[AccountManagement] Create account error:', error);
      return { success: false, error: error.message || 'Failed to create account' };
    }
  }

  /**
   * Update account details
   */
  async updateAccount(
    accountId: string,
    updates: Partial<Pick<Account, 'name' | 'account_description'>>
  ): Promise<{ success: boolean; data?: Account; error?: string; message?: string }> {
    try {
      // Validate name if provided
      if (updates.name !== undefined) {
        if (!updates.name || updates.name.trim().length === 0) {
          return { success: false, error: 'Account name cannot be empty' };
        }

        if (updates.name.length > 50) {
          return { success: false, error: 'Account name must be less than 50 characters' };
        }

        // Check for duplicate name
        const { data: account } = await supabase
          .from('accounts')
          .select('user_id')
          .eq('id', accountId)
          .single();

        if (account) {
          const { data: existingAccount } = await supabase
            .from('accounts')
            .select('id')
            .eq('user_id', account.user_id)
            .eq('name', updates.name.trim())
            .neq('id', accountId)
            .maybeSingle();

          if (existingAccount) {
            return { success: false, error: 'An account with this name already exists' };
          }
        }
      }

      const { data, error } = await supabase
        .from('accounts')
        .update({
          ...(updates.name && { name: updates.name.trim() }),
          ...(updates.account_description !== undefined && {
            account_description: updates.account_description?.trim() || null,
          }),
        })
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Account updated successfully',
      };
    } catch (error: any) {
      console.error('[AccountManagement] Update account error:', error);
      return { success: false, error: error.message || 'Failed to update account' };
    }
  }

  /**
   * Set an account as default
   */
  async setDefaultAccount(accountId: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      // Call the database function
      const { error } = await supabase.rpc('set_default_account', {
        p_account_id: accountId,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Default account updated',
      };
    } catch (error: any) {
      console.error('[AccountManagement] Set default account error:', error);
      return { success: false, error: error.message || 'Failed to set default account' };
    }
  }

  /**
   * Close an account (requires zero balance)
   */
  async closeAccount(accountId: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      // Check balance
      const { data: account } = await supabase
        .from('accounts')
        .select('balance, is_default')
        .eq('id', accountId)
        .single();

      if (!account) {
        return { success: false, error: 'Account not found' };
      }

      if (Number(account.balance) !== 0) {
        return {
          success: false,
          error: 'Cannot close account with non-zero balance. Please transfer funds first.',
        };
      }

      if (account.is_default) {
        return {
          success: false,
          error: 'Cannot close default account. Please set another account as default first.',
        };
      }

      const { error } = await supabase
        .from('accounts')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          is_active: false,
        })
        .eq('id', accountId);

      if (error) throw error;

      return {
        success: true,
        message: 'Account closed successfully',
      };
    } catch (error: any) {
      console.error('[AccountManagement] Close account error:', error);
      return { success: false, error: error.message || 'Failed to close account' };
    }
  }

  /**
   * Get count of active accounts for a user
   */
  async getAccountCount(userId: string): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('count_active_accounts', {
        p_user_id: userId,
      });

      if (error) throw error;

      return { success: true, count: data || 0 };
    } catch (error: any) {
      console.error('[AccountManagement] Get account count error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate account type for user
   */
  async validateAccountType(accountType: string): Promise<{ success: boolean; valid: boolean; error?: string }> {
    try {
      const { data, error} = await supabase
        .from('account_types')
        .select('id')
        .eq('id', accountType)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      return { success: true, valid: !!data };
    } catch (error: any) {
      console.error('[AccountManagement] Validate account type error:', error);
      return { success: false, valid: false, error: error.message };
    }
  }
}

export const accountManagementService = new AccountManagementService();
