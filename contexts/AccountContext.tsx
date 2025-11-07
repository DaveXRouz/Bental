import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useAccounts } from '@/hooks/useAccounts';

interface Account {
  id: string;
  user_id: string;
  account_type: string;
  name: string;
  balance: number;
  currency: string;
  is_active: boolean;
  is_default: boolean;
  status: string;
}

interface AccountContextType {
  selectedAccountIds: string[];
  selectedAccounts: Account[];
  isAllAccountsSelected: boolean;
  selectAccount: (accountId: string) => void;
  deselectAccount: (accountId: string) => void;
  toggleAccount: (accountId: string) => void;
  selectAllAccounts: () => void;
  clearSelection: () => void;
  setSelectedAccountIds: (accountIds: string[]) => void;
  loading: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

const STORAGE_KEY = '@account_selection';

export function AccountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { accounts, loading: accountsLoading } = useAccounts();
  const [selectedAccountIds, setSelectedAccountIdsState] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedSelection();
  }, [user?.id]);

  useEffect(() => {
    if (!accountsLoading && accounts.length > 0 && selectedAccountIds.length === 0) {
      setSelectedAccountIdsState([]);
    }
  }, [accountsLoading, accounts, selectedAccountIds.length]);

  useEffect(() => {
    if (accounts.length > 0 && selectedAccountIds.length > 0) {
      const validAccountIds = selectedAccountIds.filter(id =>
        accounts.some(acc => acc.id === id && acc.is_active && acc.status === 'active')
      );

      if (validAccountIds.length !== selectedAccountIds.length) {
        setSelectedAccountIdsState(validAccountIds.length > 0 ? validAccountIds : []);
      }
    }
  }, [accounts, selectedAccountIds]);

  const loadSavedSelection = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const saved = await AsyncStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelectedAccountIdsState(parsed);
      }
    } catch (error) {
      console.error('Failed to load saved account selection:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSelection = async (accountIds: string[]) => {
    if (!user?.id) return;

    try {
      await AsyncStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(accountIds));
    } catch (error) {
      console.error('Failed to save account selection:', error);
    }
  };

  const setSelectedAccountIds = useCallback((accountIds: string[]) => {
    setSelectedAccountIdsState(accountIds);
    saveSelection(accountIds);
  }, [user?.id]);

  const selectAccount = useCallback((accountId: string) => {
    setSelectedAccountIdsState(prev => {
      if (prev.includes(accountId)) return prev;
      const newSelection = [...prev, accountId];
      saveSelection(newSelection);
      return newSelection;
    });
  }, [user?.id]);

  const deselectAccount = useCallback((accountId: string) => {
    setSelectedAccountIdsState(prev => {
      const newSelection = prev.filter(id => id !== accountId);
      saveSelection(newSelection);
      return newSelection;
    });
  }, [user?.id]);

  const toggleAccount = useCallback((accountId: string) => {
    setSelectedAccountIdsState(prev => {
      const newSelection = prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId];
      saveSelection(newSelection);
      return newSelection;
    });
  }, [user?.id]);

  const selectAllAccounts = useCallback(() => {
    const allIds = accounts.filter(acc => acc.is_active && acc.status === 'active').map(acc => acc.id);
    setSelectedAccountIdsState([]);
    saveSelection([]);
  }, [accounts, user?.id]);

  const clearSelection = useCallback(() => {
    setSelectedAccountIdsState([]);
    saveSelection([]);
  }, [user?.id]);

  const isAllAccountsSelected = selectedAccountIds.length === 0 ||
    (accounts.length > 0 && selectedAccountIds.length === accounts.filter(a => a.is_active && a.status === 'active').length);

  const selectedAccounts = accounts.filter(acc =>
    selectedAccountIds.length === 0 || selectedAccountIds.includes(acc.id)
  );

  const value: AccountContextType = {
    selectedAccountIds,
    selectedAccounts,
    isAllAccountsSelected,
    selectAccount,
    deselectAccount,
    toggleAccount,
    selectAllAccounts,
    clearSelection,
    setSelectedAccountIds,
    loading: loading || accountsLoading,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccountContext() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccountContext must be used within an AccountProvider');
  }
  return context;
}
