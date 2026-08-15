import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  FinanceData, Account, Transaction, Category, Goal, Budget, 
  RecurringPayment, QuickTemplate, AppSettings 
} from '../types';
import { loadData, saveData, importData as importStorageData, exportData as exportStorageData, exportCSV as exportStorageCSV, clearData as clearStorageData } from '../services/storage';
import { pushToGist, pullFromGist, createPrivateGist, testGistToken } from '../services/gistSync';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface FinanceContextType {
  data: FinanceData;
  syncStatus: SyncStatus;
  syncError: string | null;
  
  // Cloud Sync Actions
  syncCloud: (direction?: 'push' | 'pull' | 'auto') => Promise<{ success: boolean; message: string }>;
  createCloudBackup: (token: string) => Promise<{ success: boolean; gistId?: string; message: string }>;
  testToken: (token: string) => Promise<{ user: string }>;

  // Accounts
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, account: Partial<Omit<Account, 'id' | 'createdAt'>>) => void;
  deleteAccount: (id: string) => void;
  
  // Transactions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: string) => void;
  
  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, goal: Partial<Omit<Goal, 'id' | 'createdAt'>>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number) => void;
  
  // Budgets
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, budget: Partial<Omit<Budget, 'id'>>) => void;
  deleteBudget: (id: string) => void;
  
  // Recurring Payments
  addRecurringPayment: (payment: Omit<RecurringPayment, 'id'>) => void;
  updateRecurringPayment: (id: string, payment: Partial<Omit<RecurringPayment, 'id'>>) => void;
  deleteRecurringPayment: (id: string) => void;
  
  // Quick Templates
  addQuickTemplate: (template: Omit<QuickTemplate, 'id'>) => void;
  deleteQuickTemplate: (id: string) => void;
  
  // Categories
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Omit<Category, 'id'>>) => void;
  deleteCategory: (id: string) => void;
  
  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Data management
  importData: (json: string) => void;
  exportData: () => string;
  exportCSV: () => string;
  clearAllData: () => void;
  
  // Computed
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savingsRate: number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<FinanceData>(() => {
    const loaded = loadData();
    // Default autoSync to true if token exists
    if (loaded.settings?.githubToken && loaded.settings?.gistId && loaded.settings.autoSync === undefined) {
      loaded.settings.autoSync = true;
    }
    return loaded;
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  
  const autoPushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<FinanceData>(data);
  dataRef.current = data;

  // Auto-save to LocalStorage whenever state changes
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Theme synchronization
  useEffect(() => {
    const theme = data.settings?.theme || 'dark';
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [data.settings?.theme]);

  // Cloud Sync method
  const syncCloud = useCallback(async (direction: 'push' | 'pull' | 'auto' = 'auto', targetData?: FinanceData): Promise<{ success: boolean; message: string }> => {
    const currentData = targetData || dataRef.current;
    const { githubToken, gistId } = currentData.settings || {};
    
    if (!githubToken || !gistId) {
      setSyncStatus('idle');
      return { success: false, message: 'Синхронизация не настроена' };
    }

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      if (direction === 'pull' || direction === 'auto') {
        const remote = await pullFromGist(githubToken, gistId);
        
        if (direction === 'auto') {
          const remoteTime = new Date(remote.data.lastModified || remote.updatedAt).getTime();
          const localTime = new Date(currentData.lastModified || 0).getTime();

          if (remoteTime > localTime) {
            // Remote is newer, load remote data
            const mergedSettings = {
              ...remote.data.settings,
              githubToken,
              gistId,
              autoSync: true,
              lastSyncedAt: new Date().toISOString(),
            };
            setData({
              ...remote.data,
              settings: mergedSettings,
            });
            setSyncStatus('synced');
            return { success: true, message: 'Данные обновлены из облака' };
          } else if (localTime > remoteTime) {
            // Local is newer, push to remote
            await pushToGist(githubToken, gistId, currentData);
            setData(prev => ({
              ...prev,
              settings: {
                ...prev.settings,
                lastSyncedAt: new Date().toISOString(),
              }
            }));
            setSyncStatus('synced');
            return { success: true, message: 'Данные сохранены в облако' };
          } else {
            setSyncStatus('synced');
            return { success: true, message: 'Данные синхронизированы' };
          }
        } else {
          // Explicit pull
          const mergedSettings = {
            ...remote.data.settings,
            githubToken,
            gistId,
            autoSync: true,
            lastSyncedAt: new Date().toISOString(),
          };
          setData({
            ...remote.data,
            settings: mergedSettings,
          });
          setSyncStatus('synced');
          return { success: true, message: 'Данные загружены из облака' };
        }
      } else {
        // Explicit push
        await pushToGist(githubToken, gistId, currentData);
        setData(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            lastSyncedAt: new Date().toISOString(),
          }
        }));
        setSyncStatus('synced');
        return { success: true, message: 'Данные сохранены в облако' };
      }
    } catch (err: any) {
      const msg = err.message || 'Ошибка синхронизации';
      setSyncStatus('error');
      setSyncError(msg);
      return { success: false, message: msg };
    }
  }, []);

  // Automatic immediate background push when data is modified
  const triggerAutoPush = useCallback((nextData: FinanceData) => {
    const { githubToken, gistId, autoSync } = nextData.settings || {};
    if (!githubToken || !gistId || autoSync === false) return;

    setSyncStatus('syncing');

    if (autoPushTimerRef.current) {
      clearTimeout(autoPushTimerRef.current);
    }

    // Debounce by 500ms to bundle rapid operations (e.g. typing or multiple clicks)
    autoPushTimerRef.current = setTimeout(() => {
      syncCloud('push', nextData);
    }, 500);
  }, [syncCloud]);

  // Initial cloud sync on startup + on tab focus / visibility
  useEffect(() => {
    const { githubToken, gistId } = dataRef.current.settings || {};
    if (githubToken && gistId) {
      syncCloud('auto');
    }

    const handleVisibilityOrFocus = () => {
      const { githubToken, gistId } = dataRef.current.settings || {};
      if (document.visibilityState === 'visible' && githubToken && gistId) {
        syncCloud('auto');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [syncCloud]);

  // Create a new Cloud Backup Gist
  const createCloudBackup = async (token: string): Promise<{ success: boolean; gistId?: string; message: string }> => {
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const result = await createPrivateGist(token, dataRef.current);
      const updatedData: FinanceData = {
        ...dataRef.current,
        settings: {
          ...dataRef.current.settings,
          githubToken: token,
          gistId: result.gistId,
          autoSync: true,
          lastSyncedAt: new Date().toISOString(),
        }
      };
      setData(updatedData);
      setSyncStatus('synced');
      return { success: true, gistId: result.gistId, message: 'Приватный Gist создан и автосинхронизация включена!' };
    } catch (err: any) {
      const msg = err.message || 'Ошибка создания Gist';
      setSyncStatus('error');
      setSyncError(msg);
      return { success: false, message: msg };
    }
  };

  const testToken = async (token: string): Promise<{ user: string }> => {
    const res = await testGistToken(token);
    return { user: res.login };
  };

  // State Mutators with Auto Cloud Push
  const addAccount = (account: Omit<Account, 'id' | 'createdAt'>) => {
    const newAccount: Account = {
      ...account,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    const nextData: FinanceData = { 
      ...dataRef.current, 
      lastModified: new Date().toISOString(),
      accounts: [...dataRef.current.accounts, newAccount] 
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  const updateAccount = (id: string, accountUpdates: Partial<Omit<Account, 'id' | 'createdAt'>>) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      accounts: dataRef.current.accounts.map(a => a.id === id ? { ...a, ...accountUpdates } : a),
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  const deleteAccount = (id: string) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      accounts: dataRef.current.accounts.filter(a => a.id !== id),
      transactions: dataRef.current.transactions.filter(t => t.accountId !== id && t.toAccountId !== id),
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  // Transactions
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
    };
    
    let accounts = [...dataRef.current.accounts];
    
    if (transaction.type === 'income') {
      accounts = accounts.map(a => a.id === transaction.accountId ? { ...a, balance: a.balance + transaction.amount } : a);
    } else if (transaction.type === 'expense') {
      accounts = accounts.map(a => a.id === transaction.accountId ? { ...a, balance: a.balance - transaction.amount } : a);
    } else if (transaction.type === 'transfer' && transaction.toAccountId) {
      accounts = accounts.map(a => {
        if (a.id === transaction.accountId) return { ...a, balance: a.balance - transaction.amount };
        if (a.id === transaction.toAccountId) return { ...a, balance: a.balance + transaction.amount };
        return a;
      });
    }
    
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      accounts,
      transactions: [newTransaction, ...dataRef.current.transactions],
    };

    setData(nextData);
    triggerAutoPush(nextData);
  };

  const updateTransaction = (id: string, transactionUpdates: Partial<Omit<Transaction, 'id'>>) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      transactions: dataRef.current.transactions.map(t => t.id === id ? { ...t, ...transactionUpdates } : t),
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  const deleteTransaction = (id: string) => {
    const transaction = dataRef.current.transactions.find(t => t.id === id);
    if (!transaction) return;
    
    let accounts = [...dataRef.current.accounts];
    
    if (transaction.type === 'income') {
      accounts = accounts.map(a => a.id === transaction.accountId ? { ...a, balance: a.balance - transaction.amount } : a);
    } else if (transaction.type === 'expense') {
      accounts = accounts.map(a => a.id === transaction.accountId ? { ...a, balance: a.balance + transaction.amount } : a);
    } else if (transaction.type === 'transfer' && transaction.toAccountId) {
      accounts = accounts.map(a => {
        if (a.id === transaction.accountId) return { ...a, balance: a.balance + transaction.amount };
        if (a.id === transaction.toAccountId) return { ...a, balance: a.balance - transaction.amount };
        return a;
      });
    }
    
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      accounts,
      transactions: dataRef.current.transactions.filter(t => t.id !== id),
    };

    setData(nextData);
    triggerAutoPush(nextData);
  };

  // Goals
  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      goals: [...dataRef.current.goals, { ...goal, id: uuidv4(), createdAt: new Date().toISOString() }],
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  const updateGoal = (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      goals: dataRef.current.goals.map(g => g.id === id ? { ...g, ...updates } : g),
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  const deleteGoal = (id: string) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      goals: dataRef.current.goals.filter(g => g.id !== id),
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  const contributeToGoal = (id: string, amount: number) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      goals: dataRef.current.goals.map(g => g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g),
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  // Budgets
  const addBudget = (budget: Omit<Budget, 'id'>) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      budgets: [...dataRef.current.budgets, { ...budget, id: uuidv4() }],
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  const updateBudget = (id: string, updates: Partial<Omit<Budget, 'id'>>) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      budgets: dataRef.current.budgets.map(b => b.id === id ? { ...b, ...updates } : b),
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  const deleteBudget = (id: string) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      budgets: dataRef.current.budgets.filter(b => b.id !== id),
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  // Recurring Payments
  const addRecurringPayment = (payment: Omit<RecurringPayment, 'id'>) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      recurringPayments: [...dataRef.current.recurringPayments, { ...payment, id: uuidv4() }],
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  const updateRecurringPayment = (id: string, updates: Partial<Omit<RecurringPayment, 'id'>>) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      recurringPayments: dataRef.current.recurringPayments.map(p => p.id === id ? { ...p, ...updates } : p),
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  const deleteRecurringPayment = (id: string) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      recurringPayments: dataRef.current.recurringPayments.filter(p => p.id !== id),
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  // Quick Templates
  const addQuickTemplate = (template: Omit<QuickTemplate, 'id'>) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      quickTemplates: [...dataRef.current.quickTemplates, { ...template, id: uuidv4() }],
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  const deleteQuickTemplate = (id: string) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      quickTemplates: dataRef.current.quickTemplates.filter(t => t.id !== id),
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  // Categories
  const addCategory = (category: Omit<Category, 'id'>) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      categories: [...dataRef.current.categories, { ...category, id: uuidv4() }],
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  const updateCategory = (id: string, updates: Partial<Omit<Category, 'id'>>) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      categories: dataRef.current.categories.map(c => c.id === id ? { ...c, ...updates } : c),
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  const deleteCategory = (id: string) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      categories: dataRef.current.categories.filter(c => c.id !== id),
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  // Settings
  const updateSettings = (settings: Partial<AppSettings>) => {
    const nextData: FinanceData = {
      ...dataRef.current,
      lastModified: new Date().toISOString(),
      settings: { ...dataRef.current.settings, ...settings },
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  // Storage
  const importData = (json: string) => {
    const imported = importStorageData(json);
    const nextData: FinanceData = {
      ...imported,
      lastModified: new Date().toISOString(),
    };
    setData(nextData);
    triggerAutoPush(nextData);
  };

  const exportData = () => exportStorageData();
  const exportCSV = () => exportStorageCSV(data.transactions, data.categories, data.accounts);
  const clearAllData = () => {
    clearStorageData();
    const fresh = loadData();
    setData(fresh);
    triggerAutoPush(fresh);
  };

  // Computed values
  const totalBalance = useMemo(() => {
    return data.accounts.reduce((sum, account) => sum + account.balance, 0);
  }, [data.accounts]);

  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let inc = 0;
    let exp = 0;

    data.transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        if (t.type === 'income') inc += t.amount;
        if (t.type === 'expense') exp += t.amount;
      }
    });

    return { monthlyIncome: inc, monthlyExpense: exp };
  }, [data.transactions]);

  const savingsRate = useMemo(() => {
    if (monthlyIncome === 0) return 0;
    const savings = monthlyIncome - monthlyExpense;
    return savings > 0 ? (savings / monthlyIncome) * 100 : 0;
  }, [monthlyIncome, monthlyExpense]);

  const value = {
    data,
    syncStatus,
    syncError,
    syncCloud,
    createCloudBackup,
    testToken,
    addAccount, updateAccount, deleteAccount,
    addTransaction, updateTransaction, deleteTransaction,
    addGoal, updateGoal, deleteGoal, contributeToGoal,
    addBudget, updateBudget, deleteBudget,
    addRecurringPayment, updateRecurringPayment, deleteRecurringPayment,
    addQuickTemplate, deleteQuickTemplate,
    addCategory, updateCategory, deleteCategory,
    updateSettings,
    importData, exportData, exportCSV, clearAllData,
    totalBalance, monthlyIncome, monthlyExpense, savingsRate
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
