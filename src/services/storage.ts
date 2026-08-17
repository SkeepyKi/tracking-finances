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
  const defaults = getDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;

    return {
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : defaults.accounts,
      categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : defaults.categories,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : defaults.transactions,
      goals: Array.isArray(parsed.goals) ? parsed.goals : defaults.goals,
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets : defaults.budgets,
      recurringPayments: Array.isArray(parsed.recurringPayments) ? parsed.recurringPayments : defaults.recurringPayments,
      quickTemplates: Array.isArray(parsed.quickTemplates) ? parsed.quickTemplates : defaults.quickTemplates,
      settings: { ...defaults.settings, ...(parsed.settings || {}) },
      lastModified: parsed.lastModified,
    };
  } catch (error) {
    console.error('Error loading data from localStorage', error);
    return defaults;
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
  return JSON.stringify(loadData(), null, 2);
}

export function importData(jsonString: string): FinanceData {
  try {
    const parsed = JSON.parse(jsonString);
    const defaults = getDefaultData();
    const cleanData: FinanceData = {
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : defaults.accounts,
      categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : defaults.categories,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : defaults.transactions,
      goals: Array.isArray(parsed.goals) ? parsed.goals : defaults.goals,
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets : defaults.budgets,
      recurringPayments: Array.isArray(parsed.recurringPayments) ? parsed.recurringPayments : defaults.recurringPayments,
      quickTemplates: Array.isArray(parsed.quickTemplates) ? parsed.quickTemplates : defaults.quickTemplates,
      settings: { ...defaults.settings, ...(parsed.settings || {}) },
      lastModified: new Date().toISOString(),
    };
    saveData(cleanData);
    return cleanData;
  } catch (error) {
    console.error('Invalid JSON imported', error);
    throw new Error('Некорректный формат JSON-файла');
  }
}

export function exportCSV(transactions: Transaction[], categories: Category[], accounts: Account[]): string {
  const headers = ['ID', 'Дата', 'Тип', 'Сумма', 'Описание', 'Категория', 'Счет', 'На счет'];
  const rows = transactions.map(t => {
    const cat = categories.find(c => c.id === t.categoryId)?.name || '';
    const acc = accounts.find(a => a.id === t.accountId)?.name || '';
    const toAcc = t.toAccountId ? (accounts.find(a => a.id === t.toAccountId)?.name || '') : '';
    const typeLabel = t.type === 'expense' ? 'Расход' : t.type === 'income' ? 'Доход' : 'Перевод';
    return [
      t.id,
      t.date,
      typeLabel,
      t.amount,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${cat.replace(/"/g, '""')}"`,
      `"${acc.replace(/"/g, '""')}"`,
      `"${toAcc.replace(/"/g, '""')}"`
    ];
  });
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function clearData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing data', error);
  }
}
