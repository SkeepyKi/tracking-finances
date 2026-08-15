import { Category, FinanceData, Transaction, Account } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'finance_tracker_data';

export function getDefaultCategories(): Category[] {
  return [
    { id: uuidv4(), name: 'Еда', type: 'expense', color: '#EF4444', icon: 'pizza' },
    { id: uuidv4(), name: 'Транспорт', type: 'expense', color: '#3B82F6', icon: 'bus' },
    { id: uuidv4(), name: 'Жилье', type: 'expense', color: '#10B981', icon: 'home' },
    { id: uuidv4(), name: 'Развлечения', type: 'expense', color: '#8B5CF6', icon: 'gamepad-2' },
    { id: uuidv4(), name: 'Здоровье', type: 'expense', color: '#EC4899', icon: 'heart-pulse' },
    { id: uuidv4(), name: 'Одежда', type: 'expense', color: '#F59E0B', icon: 'shirt' },
    { id: uuidv4(), name: 'Связь', type: 'expense', color: '#6366F1', icon: 'smartphone' },
    { id: uuidv4(), name: 'Образование', type: 'expense', color: '#14B8A6', icon: 'graduation-cap' },
    { id: uuidv4(), name: 'Подарки', type: 'expense', color: '#F43F5E', icon: 'gift' },
    { id: uuidv4(), name: 'Прочее', type: 'expense', color: '#6B7280', icon: 'more-horizontal' },
    
    { id: uuidv4(), name: 'Зарплата', type: 'income', color: '#10B981', icon: 'wallet' },
    { id: uuidv4(), name: 'Фриланс', type: 'income', color: '#3B82F6', icon: 'laptop' },
    { id: uuidv4(), name: 'Инвестиции', type: 'income', color: '#8B5CF6', icon: 'trending-up' },
    { id: uuidv4(), name: 'Подарки', type: 'income', color: '#F43F5E', icon: 'gift' },
    { id: uuidv4(), name: 'Прочее', type: 'income', color: '#6B7280', icon: 'more-horizontal' },
  ];
}

export function getDefaultData(): FinanceData {
  return {
    accounts: [],
    categories: getDefaultCategories(),
    transactions: [],
    goals: [],
    budgets: [],
    recurringPayments: [],
    quickTemplates: [],
    settings: {
      currency: 'RUB',
      currencySymbol: '₽',
      theme: 'system',
    },
  };
}

export function loadData(): FinanceData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return getDefaultData();
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading data from localStorage', error);
    return getDefaultData();
  }
}

export function saveData(data: FinanceData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to localStorage', error);
  }
}

export function exportData(): string {
  const data = loadData();
  return JSON.stringify(data, null, 2);
}

export function importData(json: string): FinanceData {
  try {
    const data = JSON.parse(json) as FinanceData;
    saveData(data);
    return data;
  } catch (error) {
    console.error('Error importing data', error);
    throw new Error('Invalid data format');
  }
}

export function exportCSV(transactions: Transaction[], categories: Category[], accounts: Account[]): string {
  const headers = ['ID', 'Type', 'Amount', 'Date', 'Account', 'To Account', 'Category', 'Description'];
  
  const rows = transactions.map(t => {
    const account = accounts.find(a => a.id === t.accountId)?.name || 'Unknown';
    const toAccount = t.toAccountId ? accounts.find(a => a.id === t.toAccountId)?.name || 'Unknown' : '';
    const category = t.categoryId ? categories.find(c => c.id === t.categoryId)?.name || 'Unknown' : '';
    
    return [
      t.id,
      t.type,
      t.amount.toString(),
      t.date,
      account,
      toAccount,
      category,
      `"${t.description.replace(/"/g, '""')}"`
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
