export interface Account {
  id: string;
  name: string;
  type: 'card' | 'cash' | 'savings' | 'investment' | 'crypto';
  balance: number;
  currency: string;
  color: string;
  icon: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  parentId?: string;
  subcategories?: Category[];
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  date: string;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  description: string;
  tags?: string[];
  isRecurring?: boolean;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
  icon: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  month: string; // YYYY-MM
}

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  accountId: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  nextDate: string;
  isActive: boolean;
}

export interface QuickTemplate {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  accountId: string;
  type: 'income' | 'expense';
}

export interface AppSettings {
  currency: string;
  currencySymbol: string;
  theme: 'light' | 'dark' | 'system';
  githubToken?: string;
  gistId?: string;
  autoSync?: boolean;
  lastSyncedAt?: string;
}

export interface FinanceData {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
  recurringPayments: RecurringPayment[];
  quickTemplates: QuickTemplate[];
  settings: AppSettings;
  lastModified?: string;
}
