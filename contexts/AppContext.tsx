import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  Transaction,
  TransactionFilters,
  getTransactions,
  getRecentTransactions,
} from '../services/transactionService';
import {
  Beneficiary,
  getBeneficiaries,
  getRecentBeneficiaries,
} from '../services/beneficiaryService';
import { getWalletBalance } from '../services/userService';

// ── Types ───────────────────────────────────────────────────

interface AppContextType {
  // State
  walletBalance: number;
  recentTransactions: Transaction[];
  allTransactions: Transaction[];
  beneficiaries: Beneficiary[];
  recentBeneficiaries: Beneficiary[];
  isLoadingData: boolean;

  // Actions
  refreshAll: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshTransactions: (filters?: TransactionFilters) => Promise<void>;
  refreshBeneficiaries: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ── Provider ────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  const [walletBalance, setWalletBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [recentBeneficiaries, setRecentBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  /**
   * Refresh wallet balance from Firestore.
   */
  const refreshBalance = useCallback(async () => {
    if (!user) return;
    try {
      const balance = await getWalletBalance(user.uid);
      setWalletBalance(balance);
    } catch (err) {
      console.warn('Failed to refresh balance:', err);
    }
  }, [user]);

  /**
   * Refresh transactions from Firestore.
   */
  const refreshTransactions = useCallback(
    async (filters?: TransactionFilters) => {
      if (!user) return;
      try {
        const [recent, all] = await Promise.all([
          getRecentTransactions(user.uid, 3),
          getTransactions(user.uid, filters),
        ]);
        setRecentTransactions(recent);
        setAllTransactions(all);
      } catch (err) {
        console.warn('Failed to refresh transactions:', err);
      }
    },
    [user]
  );

  /**
   * Refresh beneficiaries from Firestore.
   */
  const refreshBeneficiaries = useCallback(async () => {
    if (!user) return;
    try {
      const [all, recent] = await Promise.all([
        getBeneficiaries(user.uid),
        getRecentBeneficiaries(user.uid, 5),
      ]);
      setBeneficiaries(all);
      setRecentBeneficiaries(recent);
    } catch (err) {
      console.warn('Failed to refresh beneficiaries:', err);
    }
  }, [user]);

  /**
   * Refresh all data at once.
   */
  const refreshAll = useCallback(async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      await Promise.all([
        refreshBalance(),
        refreshTransactions(),
        refreshBeneficiaries(),
      ]);
    } catch (err) {
      console.warn('Failed to refresh all data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [user, refreshBalance, refreshTransactions, refreshBeneficiaries]);

  // Auto-load data when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshAll();
    } else {
      // Reset state on logout
      setWalletBalance(0);
      setRecentTransactions([]);
      setAllTransactions([]);
      setBeneficiaries([]);
      setRecentBeneficiaries([]);
    }
  }, [isAuthenticated, user]);

  const value: AppContextType = {
    walletBalance,
    recentTransactions,
    allTransactions,
    beneficiaries,
    recentBeneficiaries,
    isLoadingData,
    refreshAll,
    refreshBalance,
    refreshTransactions,
    refreshBeneficiaries,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ── Hook ────────────────────────────────────────────────────

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
