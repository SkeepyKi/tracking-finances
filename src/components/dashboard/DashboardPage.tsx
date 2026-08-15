import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  Wallet, TrendingUp, TrendingDown, Target, PieChart, 
  ArrowRight, ShieldCheck, ArrowDownLeft, ArrowUpRight, 
  CreditCard, Plus, ArrowRightLeft 
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate = () => {} }) => {
  const { data, totalBalance, monthlyIncome, monthlyExpense, savingsRate, syncStatus, syncCloud } = useFinance();
  const transactions = data.transactions || [];
  const accounts = data.accounts || [];
  const goals = data.goals || [];
  const budgets = data.budgets || [];
  const categories = data.categories || [];

  // Calculate cushion in months
  const avgMonthlyExpense = monthlyExpense > 0 ? monthlyExpense : 1;
  const cushionMonths = (totalBalance / avgMonthlyExpense).toFixed(1);

  // Month string YYYY-MM
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthBudgets = budgets.filter(b => b.month === monthStr);

  const getAccountName = (accId: string) => {
    return accounts.find(a => a.id === accId)?.name || 'Счет';
  };

  const getCategoryName = (catId?: string) => {
    return categories.find(c => c.id === catId)?.name || 'Общее';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Финансовый обзор</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'full' }).format(now)}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {data.settings?.githubToken && data.settings?.gistId ? (
            <button
              onClick={() => syncCloud('auto')}
              className="btn btn--outline"
              title="Облачная синхронизация (GitHub Gist)"
              style={{
                fontSize: '0.85rem',
                padding: '0.5rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {syncStatus === 'syncing' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent)' }}>
                  ⏳ Синхронизация...
                </span>
              ) : syncStatus === 'synced' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success)' }}>
                  ☁️ Синхронизировано
                </span>
              ) : syncStatus === 'error' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--danger)' }}>
                  ⚠️ Ошибка синхронизации
                </span>
              ) : (
                <span>☁️ Синхронизация</span>
              )}
            </button>
          ) : (
            <button
              onClick={() => onNavigate('settings')}
              className="btn btn--outline"
              title="Настроить синхронизацию с телефоном"
              style={{
                fontSize: '0.8rem',
                padding: '0.45rem 0.75rem',
                color: 'var(--text-secondary)'
              }}
            >
              ☁️ Подключить облако
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Total Balance */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Общий капитал</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {totalBalance.toLocaleString('ru-RU')} ₽
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <ShieldCheck size={14} color="var(--success)" />
            <span>Подушка: <strong>{cushionMonths} мес.</strong> расходов</span>
          </div>
        </div>

        {/* Income */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Доходы за месяц</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.5rem' }}>
            +{monthlyIncome.toLocaleString('ru-RU')} ₽
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            За текущий календарный месяц
          </div>
        </div>

        {/* Expense */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Расходы за месяц</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.5rem' }}>
            -{monthlyExpense.toLocaleString('ru-RU')} ₽
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Все статьи расходов
          </div>
        </div>

        {/* Savings Rate */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Норма сбережений</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PieChart size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: savingsRate > 20 ? 'var(--success)' : 'var(--warning)', marginBottom: '0.5rem' }}>
            {savingsRate.toFixed(0)}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {savingsRate >= 30 ? '🔥 Отличный темп накоплений' : savingsRate > 0 ? '👍 Положительный баланс' : '— Нет сбережений'}
          </div>
        </div>
      </div>

      {/* Main Grid: Accounts + Recent Transactions + Goals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* My Accounts */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} color="var(--accent)" /> Мои счета ({accounts.length})
            </h2>
            <button
              onClick={() => onNavigate('accounts')}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}
            >
              Все счета <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {accounts.map(acc => (
              <div
                key={acc.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{acc.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {acc.type === 'card' ? 'Банковская карта' : acc.type === 'cash' ? 'Наличные' : acc.type === 'savings' ? 'Накопительный счет' : 'Счет'}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {acc.balance.toLocaleString('ru-RU')} ₽
                </div>
              </div>
            ))}

            {accounts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Счета еще не добавлены. <button onClick={() => onNavigate('accounts')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Создать счет</button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowRightLeft size={18} color="var(--accent)" /> Последние операции
            </h2>
            <button
              onClick={() => onNavigate('transactions')}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}
            >
              Все операции <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {transactions.slice(0, 4).map(t => {
              const isExpense = t.type === 'expense';
              const isIncome = t.type === 'income';
              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-glass)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isExpense ? 'rgba(239, 68, 68, 0.12)' : isIncome ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                        color: isExpense ? 'var(--danger)' : isIncome ? 'var(--success)' : 'var(--accent)'
                      }}
                    >
                      {isExpense && <ArrowDownLeft size={16} />}
                      {isIncome && <ArrowUpRight size={16} />}
                      {t.type === 'transfer' && <ArrowRightLeft size={16} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.description || getCategoryName(t.categoryId)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(t.date).toLocaleDateString('ru-RU')} • {getAccountName(t.accountId)}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isExpense ? 'var(--danger)' : isIncome ? 'var(--success)' : 'var(--text-primary)' }}>
                    {isExpense ? '-' : isIncome ? '+' : ''}{t.amount.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              );
            })}

            {transactions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Пока нет операций. <button onClick={() => onNavigate('transactions')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Добавить первую</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Goals & Budgets Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Active Goals */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={18} color="var(--success)" /> Цели и накопления ({goals.length})
            </h2>
            <button
              onClick={() => onNavigate('goals')}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}
            >
              Все цели <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {goals.slice(0, 3).map(goal => {
              const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) || 0;
              return (
                <div key={goal.id} style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{goal.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{progress}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.35rem' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: progress >= 100 ? 'var(--success)' : 'var(--accent)', borderRadius: '3px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>{goal.currentAmount.toLocaleString('ru-RU')} ₽</span>
                    <span>из {goal.targetAmount.toLocaleString('ru-RU')} ₽</span>
                  </div>
                </div>
              );
            })}

            {goals.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Цели еще не созданы. <button onClick={() => onNavigate('goals')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Поставить цель</button>
              </div>
            )}
          </div>
        </div>

        {/* Budgets */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={18} color="var(--warning)" /> Контроль бюджетов ({currentMonthBudgets.length})
            </h2>
            <button
              onClick={() => onNavigate('budgets')}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}
            >
              Все бюджеты <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentMonthBudgets.slice(0, 3).map(b => {
              const cat = categories.find(c => c.id === b.categoryId);
              // Calculate spent for this category in current month
              const spent = transactions
                .filter(t => t.type === 'expense' && t.categoryId === b.categoryId && t.date.startsWith(monthStr))
                .reduce((sum, t) => sum + t.amount, 0);
              const progress = Math.min(100, Math.round((spent / b.monthlyLimit) * 100)) || 0;
              const isOver = spent > b.monthlyLimit;

              return (
                <div key={b.id} style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cat?.name || 'Категория'}</span>
                    <span style={{ fontSize: '0.8rem', color: isOver ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: isOver ? 700 : 400 }}>
                      {spent.toLocaleString('ru-RU')} / {b.monthlyLimit.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: isOver ? 'var(--danger)' : progress > 80 ? 'var(--warning)' : 'var(--success)', borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}

            {currentMonthBudgets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Лимиты бюджетов на этот месяц еще не заданы. <button onClick={() => onNavigate('budgets')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Установить бюджет</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
