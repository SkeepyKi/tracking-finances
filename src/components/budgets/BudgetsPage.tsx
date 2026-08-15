import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Plus, Edit2, ChevronLeft, ChevronRight, X, Trash2, PieChart, AlertCircle, CheckCircle } from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const { data, addBudget, updateBudget, deleteBudget } = useFinance();
  const budgets = data.budgets || [];
  const transactions = data.transactions || [];
  const categories = data.categories || [];

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);

  // Form state
  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(currentDate);

  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && t.type === 'expense';
    });
  }, [transactions, currentMonth, currentYear]);

  const spentByCategory = useMemo(() => {
    const spent: Record<string, number> = {};
    monthTransactions.forEach((t) => {
      if (t.categoryId) {
        spent[t.categoryId] = (spent[t.categoryId] || 0) + t.amount;
      }
    });
    return spent;
  }, [monthTransactions]);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !limitAmount) return;

    if (editingBudget) {
      updateBudget(editingBudget.id, {
        categoryId,
        monthlyLimit: Number(limitAmount),
        month: monthStr
      });
    } else {
      addBudget({
        categoryId,
        monthlyLimit: Number(limitAmount),
        month: monthStr
      });
    }
    closeModal();
  };

  const openModal = (budget?: any) => {
    if (budget) {
      setEditingBudget(budget);
      setCategoryId(budget.categoryId);
      setLimitAmount(budget.monthlyLimit.toString());
    } else {
      setEditingBudget(null);
      setCategoryId(categories.find(c => c.type === 'expense')?.id || '');
      setLimitAmount('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  const currentBudgets = budgets.filter((b) => b.month === monthStr);
  const totalBudgetLimit = currentBudgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalBudgetSpent = currentBudgets.reduce((sum, b) => sum + (spentByCategory[b.categoryId] || 0), 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Header with Month Navigator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Бюджеты по категориям</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Контроль расходов и предупреждения о превышении лимитов
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', padding: '0.35rem 0.75rem', borderRadius: '0.75rem', gap: '0.5rem' }}>
            <button
              onClick={handlePrevMonth}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', padding: '0.25rem' }}
            >
              <ChevronLeft size={20} />
            </button>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', textTransform: 'capitalize', minWidth: '130px', textAlign: 'center' }}>
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', padding: '0.25rem' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <button onClick={() => openModal()} className="btn btn--primary">
            <Plus size={18} /> Установить бюджет
          </button>
        </div>
      </div>

      {/* Summary Card */}
      {currentBudgets.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Суммарный лимит месяца</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {totalBudgetLimit.toLocaleString('ru-RU')} ₽
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Фактический расход по бюджетам</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: totalBudgetSpent > totalBudgetLimit ? 'var(--danger)' : 'var(--text-primary)' }}>
                {totalBudgetSpent.toLocaleString('ru-RU')} ₽
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Остаток бюджета</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: totalBudgetLimit - totalBudgetSpent >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {(totalBudgetLimit - totalBudgetSpent).toLocaleString('ru-RU')} ₽
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {currentBudgets.map((budget) => {
          const category = categories.find((c) => c.id === budget.categoryId);
          const spent = spentByCategory[budget.categoryId] || 0;
          const percentage = Math.round((spent / budget.monthlyLimit) * 100);
          const isOver = spent > budget.monthlyLimit;
          const remaining = budget.monthlyLimit - spent;

          let progressColor = 'var(--success)';
          if (isOver) {
            progressColor = 'var(--danger)';
          } else if (percentage > 80) {
            progressColor = 'var(--warning)';
          }

          return (
            <div
              key={budget.id}
              className="glass-card"
              style={{
                padding: '1.5rem',
                borderRadius: '1rem',
                border: isOver ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: isOver ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: isOver ? 'var(--danger)' : 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <PieChart size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{category?.name || 'Категория'}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Лимит на месяц</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    onClick={() => openModal(budget)}
                    title="Редактировать"
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteBudget(budget.id)}
                    title="Удалить"
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Amount values */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: isOver ? 'var(--danger)' : 'var(--text-primary)' }}>
                    {spent.toLocaleString('ru-RU')} ₽
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    из {budget.monthlyLimit.toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, percentage)}%`,
                      height: '100%',
                      background: progressColor,
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>

              {/* Status footer */}
              <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600, color: progressColor }}>{percentage}% израсходовано</span>
                {isOver ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--danger)', fontWeight: 600 }}>
                    <AlertCircle size={14} /> Перерасход +{Math.abs(remaining).toLocaleString('ru-RU')} ₽
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Осталось: <strong style={{ color: 'var(--text-primary)' }}>{remaining.toLocaleString('ru-RU')} ₽</strong>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {currentBudgets.length === 0 && (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem 1.5rem', borderRadius: '1rem' }}>
            <PieChart size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Нет бюджетов на {monthName}</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem 0', fontSize: '0.9rem' }}>
              Задайте максимальный лимит трат на выбранную категорию (например: Продукты, Развлечения, Транспорт), чтобы контролировать перерасход.
            </p>
            <button onClick={() => openModal()} className="btn btn--primary">
              <Plus size={18} /> Установить первый бюджет
            </button>
          </div>
        )}
      </div>

      {/* Modal: Add/Edit Budget */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={closeModal}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '2rem',
              borderRadius: '1.25rem',
              background: 'var(--bg-secondary)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              {editingBudget ? 'Редактировать бюджет' : 'Новый бюджет на месяц'}
            </h2>
            <form onSubmit={handleSaveBudget} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Категория расходов
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Выберите категорию</option>
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Лимит на месяц (₽)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={limitAmount}
                  onChange={e => setLimitAmount(e.target.value)}
                  className="input"
                  placeholder="20000"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn--outline"
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn--primary">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
