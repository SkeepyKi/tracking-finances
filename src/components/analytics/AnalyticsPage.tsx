import React, { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts';
import { ShieldCheck, TrendingUp, TrendingDown, PieChart as PieIcon, BarChart3, Activity, Inbox } from 'lucide-react';

const CATEGORY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', 
  '#f97316', '#6366f1', '#84cc16'
];

export const AnalyticsPage: React.FC = () => {
  const { data, totalBalance, monthlyIncome, monthlyExpense, savingsRate } = useFinance();
  const transactions = data.transactions || [];
  const categories = data.categories || [];
  const [chartType, setChartType] = useState<'expense' | 'income'>('expense');

  // Expense categories breakdown (current month)
  const categoryExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const expenses = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && t.type === 'expense';
    });

    const byCategory: Record<string, number> = {};
    expenses.forEach((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const name = cat ? cat.name : (t.description || 'Другое');
      byCategory[name] = (byCategory[name] || 0) + t.amount;
    });

    return Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  // Income categories breakdown (current month)
  const categoryIncomes = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const incomes = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && t.type === 'income';
    });

    const byCategory: Record<string, number> = {};
    incomes.forEach((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const name = cat ? cat.name : (t.description || 'Другое');
      byCategory[name] = (byCategory[name] || 0) + t.amount;
    });

    return Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  // Monthly Income vs Expense (last 6 months)
  const monthlyData = useMemo(() => {
    const result = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(d);

      const monthTrans = transactions.filter((t) => {
        const td = new Date(t.date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });

      const income = monthTrans.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = monthTrans.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

      result.push({ name: monthLabel, 'Доходы': income, 'Расходы': expense });
    }
    return result;
  }, [transactions]);

  // Real Net Worth evolution
  const netWorthData = useMemo(() => {
    const result = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(d);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      if (transactions.length === 0) {
        result.push({ name: monthLabel, 'Капитал': totalBalance });
      } else {
        let historicalBalance = 0;
        transactions.forEach((t) => {
          const td = new Date(t.date);
          if (td <= endOfMonth) {
            if (t.type === 'income') historicalBalance += t.amount;
            if (t.type === 'expense') historicalBalance -= t.amount;
          }
        });
        result.push({ name: monthLabel, 'Капитал': Math.max(0, historicalBalance) });
      }
    }
    return result;
  }, [transactions, totalBalance]);

  // Accurate average monthly expense calculation
  const avgMonthlyExpense = useMemo(() => {
    const total6m = monthlyData.reduce((sum, m) => sum + m['Расходы'], 0);
    const activeMonths = monthlyData.filter(m => m['Расходы'] > 0).length;
    if (activeMonths > 0) {
      return total6m / activeMonths;
    }
    return monthlyExpense > 0 ? monthlyExpense : 0;
  }, [monthlyData, monthlyExpense]);

  // Cushion in months
  const cushionMonths = useMemo(() => {
    if (totalBalance <= 0) return '0.0';
    if (avgMonthlyExpense <= 0) return '—';
    return (totalBalance / avgMonthlyExpense).toFixed(1);
  }, [totalBalance, avgMonthlyExpense]);

  const hasAnyTransactions = transactions.length > 0;
  const hasBarData = monthlyData.some(m => m['Доходы'] > 0 || m['Расходы'] > 0);
  const hasPieData = (chartType === 'expense' ? categoryExpenses : categoryIncomes).length > 0;
  const hasNetWorthData = totalBalance > 0 || netWorthData.some(m => m['Капитал'] > 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Финансовая аналитика</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
          Структура расходов, динамика капитала и расчет подушки безопасности
        </p>
      </div>

      {/* Health Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Норма сбережений</span>
            <Activity size={20} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: savingsRate > 20 ? 'var(--success)' : 'var(--warning)', marginBottom: '0.25rem' }}>
            {savingsRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {monthlyIncome > 0 ? 'Доля дохода, отложенная в сбережения' : 'Нет зафиксированных доходов в этом месяце'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Подушка безопасности</span>
            <ShieldCheck size={20} color="var(--success)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.25rem' }}>
            {cushionMonths} {cushionMonths !== '—' ? 'мес.' : ''}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {avgMonthlyExpense > 0 ? 'Срок жизни на текущий капитал' : 'Рассчитывается при наличии расходов'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Средний расход в месяц</span>
            <TrendingDown size={20} color="var(--danger)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {Math.round(avgMonthlyExpense).toLocaleString('ru-RU')} ₽
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {avgMonthlyExpense > 0 ? 'На основе фактических трат' : 'Пока нет расходов для расчета'}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Category Breakdown (Donut Chart) */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieIcon size={18} color="var(--accent)" /> Структура по категориям
            </h2>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={() => setChartType('expense')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-glass)',
                  background: chartType === 'expense' ? 'var(--danger)' : 'transparent',
                  color: chartType === 'expense' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}
              >
                Расходы
              </button>
              <button
                onClick={() => setChartType('income')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-glass)',
                  background: chartType === 'income' ? 'var(--success)' : 'transparent',
                  color: chartType === 'income' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}
              >
                Доходы
              </button>
            </div>
          </div>

          {hasPieData ? (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartType === 'expense' ? categoryExpenses : categoryIncomes}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(chartType === 'expense' ? categoryExpenses : categoryIncomes).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString('ru-RU')} ₽`, 'Сумма']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '0.75rem' }}>
              <Inbox size={40} style={{ opacity: 0.3 }} />
              <span>Нет данных по {chartType === 'expense' ? 'расходам' : 'доходам'} за этот месяц</span>
            </div>
          )}
        </div>

        {/* Monthly Income vs Expense (Bar Chart) */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} color="var(--success)" /> Доходы vs Расходы (6 месяцев)
            </h2>
          </div>

          {hasBarData ? (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickFormatter={v => `${v / 1000}k`} />
                  <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString('ru-RU')} ₽`, '']} />
                  <Legend />
                  <Bar dataKey="Доходы" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Расходы" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '0.75rem' }}>
              <Inbox size={40} style={{ opacity: 0.3 }} />
              <span>Нет операций за последние 6 месяцев</span>
            </div>
          )}
        </div>
      </div>

      {/* Net Worth Dynamic Trend (Line Chart) */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} color="var(--accent)" /> Динамика общего капитала (Net Worth)
        </h2>

        {hasNetWorthData ? (
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={netWorthData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickFormatter={v => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString('ru-RU')} ₽`, 'Капитал']} />
                <Line
                  type="monotone"
                  dataKey="Капитал"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#3b82f6' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '0.75rem' }}>
            <Inbox size={40} style={{ opacity: 0.3 }} />
            <span>Капитал пока равен 0 ₽. Добавьте счет или первую операцию дохода.</span>
          </div>
        )}
      </div>
    </div>
  );
};
