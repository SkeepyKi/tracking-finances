import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef } from 'react';
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
  const [data, setData] = useState<FinanceData>(loadData());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const autoSyncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoadRef = useRef(true);

  // Auto-save to LocalStorage
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

  // Initial cloud sync on startup (Pull if configured)
  useEffect(() => {
    const { githubToken, gistId } = data.settings || {};
    if (isFirstLoadRef.current && githubToken && gistId) {
      isFirstLoadRef.current = false;
      syncCloud('auto');
    }
  }, []);

  // Debounced auto-push when data changes (if autoSync enabled)
  useEffect(() => {
    const { githubToken, gistId, autoSync } = data.settings || {};
    if (!githubToken || !gistId || !autoSync || isFirstLoadRef.current) return;

    if (autoSyncDebounceRef.current) {
      clearTimeout(autoSyncDebounceRef.current);
    }

    autoSyncDebounceRef.current = setTimeout(() => {
      syncCloud('push');
    }, 2000);

    return () => {
      if (autoSyncDebounceRef.current) clearTimeout(autoSyncDebounceRef.current);
    };
  }, [data.accounts, data.transactions, data.goals, data.budgets, data.categories]);

  // Cloud Sync method
  const syncCloud = async (direction: 'push' | 'pull' | 'auto' = 'auto'): Promise<{ success: boolean; message: string }> => {
    const { githubToken, gistId } = data.settings || {};
    if (!githubToken || !gistId) {
      setSyncStatus('idle');
      return { success: false, message: 'Синхронизация не настроена (укажите токен и Gist ID)' };
    }

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      if (direction === 'pull' || direction === 'auto') {
        const remote = await pullFromGist(githubToken, gistId);
        
        // If auto mode: check which is newer (or merge)
        if (direction === 'auto') {
          const remoteTime = new Date(remote.data.lastModified || remote.updatedAt).getTime();
          const localTime = new Date(data.lastModified || 0).getTime();

          if (remoteTime > localTime) {
            // Remote is newer, load remote
            setData({
              ...remote.data,
              settings: {
                ...remote.data.settings,
                githubToken,
                gistId,
                lastSyncedAt: new Date().toISOString(),
              }
            });
            setSyncStatus('synced');
            return { success: true, message: 'Данные успешно обновлены из облака' };
          } else {
            // Local is newer, push to remote
            await pushToGist(githubToken, gistId, data);
            setData(prev => ({
              ...prev,
              settings: {
                ...prev.settings,
                lastSyncedAt: new Date().toISOString(),
              }
            }));
            setSyncStatus('synced');
            return { success: true, message: 'Локальные данные отправлены в облако' };
          }
        } else {
          // Explicit pull
          setData({
            ...remote.data,
            settings: {
              ...remote.data.settings,
              githubToken,
              gistId,
              lastSyncedAt: new Date().toISOString(),
            }
          });
          setSyncStatus('synced');
          return { success: true, message: 'Данные успешно загружены из облака' };
        }
      } else {
        // Explicit push
        await pushToGist(githubToken, gistId, data);
        setData(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            lastSyncedAt: new Date().toISOString(),
          }
        }));
        setSyncStatus('synced');
        return { success: true, message: 'Данные успешно сохранены в облако' };
      }
    } catch (err: any) {
      const msg = err.message || 'Ошибка синхронизации';
      setSyncStatus('error');
      setSyncError(msg);
      return { success: false, message: msg };
    }
  };

  // Create a new Cloud Backup Gist
  const createCloudBackup = async (token: string): Promise<{ success: boolean; gistId?: string; message: string }> => {
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const result = await createPrivateGist(token, data);
      setData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          githubToken: token,
          gistId: result.gistId,
          autoSync: true,
          lastSyncedAt: new Date().toISOString(),
        }
      }));
      setSyncStatus('synced');
      return { success: true, gistId: result.gistId, message: 'Приватный Gist создан и настроен!' };
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

  // Actions
  const addAccount = (account: Omit<Account, 'id' | 'createdAt'>) => {
    const newAccount: Account = {
      ...account,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({ 
      ...prev, 
      lastModified: new Date().toISOString(),
      accounts: [...prev.accounts, newAccount] 
    }));
  };

  const updateAccount = (id: string, accountUpdates: Partial<Omit<Account, 'id' | 'createdAt'>>) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      accounts: prev.accounts.map(a => a.id === id ? { ...a, ...accountUpdates } : a),
    }));
  };

  const deleteAccount = (id: string) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      accounts: prev.accounts.filter(a => a.id !== id),
      transactions: prev.transactions.filter(t => t.accountId !== id && t.toAccountId !== id),
    }));
  };

  // Transactions
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
    };
    
    setData(prev => {
      let accounts = [...prev.accounts];
      
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
      
      return {
        ...prev,
        lastModified: new Date().toISOString(),
        accounts,
        transactions: [newTransaction, ...prev.transactions],
      };
    });
  };

  const updateTransaction = (id: string, transactionUpdates: Partial<Omit<Transaction, 'id'>>) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      transactions: prev.transactions.map(t => t.id === id ? { ...t, ...transactionUpdates } : t),
    }));
  };

  const deleteTransaction = (id: string) => {
    setData(prev => {
      const transaction = prev.transactions.find(t => t.id === id);
      if (!transaction) return prev;
      
      let accounts = [...prev.accounts];
      
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
      
      return {
        ...prev,
        lastModified: new Date().toISOString(),
        accounts,
        transactions: prev.transactions.filter(t => t.id !== id),
      };
    });
  };

  // Goals
  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      goals: [...prev.goals, { ...goal, id: uuidv4(), createdAt: new Date().toISOString() }],
    }));
  };

  const updateGoal = (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g),
    }));
  };

  const deleteGoal = (id: string) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      goals: prev.goals.filter(g => g.id !== id),
    }));
  };

  const contributeToGoal = (id: string, amount: number) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      goals: prev.goals.map(g => g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g),
    }));
  };

  // Budgets
  const addBudget = (budget: Omit<Budget, 'id'>) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      budgets: [...prev.budgets, { ...budget, id: uuidv4() }],
    }));
  };

  const updateBudget = (id: string, updates: Partial<Omit<Budget, 'id'>>) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      budgets: prev.budgets.map(b => b.id === id ? { ...b, ...updates } : b),
    }));
  };

  const deleteBudget = (id: string) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      budgets: prev.budgets.filter(b => b.id !== id),
    }));
  };

  // Recurring Payments
  const addRecurringPayment = (payment: Omit<RecurringPayment, 'id'>) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      recurringPayments: [...prev.recurringPayments, { ...payment, id: uuidv4() }],
    }));
  };

  const updateRecurringPayment = (id: string, updates: Partial<Omit<RecurringPayment, 'id'>>) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      recurringPayments: prev.recurringPayments.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  };

  const deleteRecurringPayment = (id: string) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      recurringPayments: prev.recurringPayments.filter(p => p.id !== id),
    }));
  };

  // Quick Templates
  const addQuickTemplate = (template: Omit<QuickTemplate, 'id'>) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      quickTemplates: [...prev.quickTemplates, { ...template, id: uuidv4() }],
    }));
  };

  const deleteQuickTemplate = (id: string) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      quickTemplates: prev.quickTemplates.filter(t => t.id !== id),
    }));
  };

  // Categories
  const addCategory = (category: Omit<Category, 'id'>) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      categories: [...prev.categories, { ...category, id: uuidv4() }],
    }));
  };

  const updateCategory = (id: string, updates: Partial<Omit<Category, 'id'>>) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      categories: prev.categories.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  };

  const deleteCategory = (id: string) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      categories: prev.categories.filter(c => c.id !== id),
    }));
  };

  // Settings
  const updateSettings = (settings: Partial<AppSettings>) => {
    setData(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      settings: { ...prev.settings, ...settings },
    }));
  };

  // Storage
  const importData = (json: string) => {
    const imported = importStorageData(json);
    setData({
      ...imported,
      lastModified: new Date().toISOString(),
    });
  };

  const exportData = () => exportStorageData();
  const exportCSV = () => exportStorageCSV(data.transactions, data.categories, data.accounts);
  const clearAllData = () => {
    clearStorageData();
    setData(loadData());
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
