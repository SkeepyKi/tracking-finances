import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Plus, Target, Calendar, Coins, Trash2, CheckCircle2, TrendingUp, Sparkles, Clock } from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const { data, addGoal, deleteGoal, contributeToGoal } = useFinance();
  const goals = data.goals || [];
  const accounts = data.accounts || [];

  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);

  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTargetAmount, setNewGoalTargetAmount] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');

  const [contributeAmount, setContributeAmount] = useState('');
  const [selectedAccountForGoal, setSelectedAccountForGoal] = useState(accounts[0]?.id || '');

  const handleContributeClick = (goal: any) => {
    setSelectedGoal(goal);
    setIsContributeModalOpen(true);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName || !newGoalTargetAmount || !newGoalDate) return;
    addGoal({
      name: newGoalName.trim(),
      targetAmount: Number(newGoalTargetAmount),
      currentAmount: 0,
      deadline: newGoalDate,
      color: '#10b981',
      icon: 'target'
    });
    setIsAddGoalModalOpen(false);
    setNewGoalName('');
    setNewGoalTargetAmount('');
    setNewGoalDate('');
  };

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !contributeAmount) return;
    const amount = Number(contributeAmount);
    if (amount <= 0) return;

    contributeToGoal(selectedGoal.id, amount);
    setContributeAmount('');
    setIsContributeModalOpen(false);
  };

  const calculateSavingsPlan = (goal: any) => {
    const deadline = new Date(goal.deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isOverdue = diffDays < 0;

    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    if (remaining === 0) {
      return { remaining: 0, perMonth: 0, perWeek: 0, diffDays: 0, isCompleted: true, isOverdue: false };
    }

    const safeDays = Math.max(1, diffDays);
    const diffMonths = Math.max(1, Math.round(safeDays / 30.44));
    const diffWeeks = Math.max(1, Math.round(safeDays / 7));

    const perMonth = Math.ceil(remaining / diffMonths);
    const perWeek = Math.ceil(remaining / diffWeeks);

    return {
      remaining,
      perMonth,
      perWeek,
      diffDays,
      isCompleted: false,
      isOverdue
    };
  };

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Финансовые цели и Копилки</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Автоматический расчет взносов, вехи и контроль прогресса
          </p>
        </div>
        <button
          onClick={() => setIsAddGoalModalOpen(true)}
          className="btn btn--primary"
          style={{ padding: '0.65rem 1.25rem' }}
        >
          <Plus size={18} /> Создать цель
        </button>
      </div>

      {/* Summary Banner */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Всего накоплено к целям</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>
              {totalSaved.toLocaleString('ru-RU')} ₽
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              из {totalTarget.toLocaleString('ru-RU')} ₽ ({overallProgress}%)
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>Общий прогресс всех целей</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{overallProgress}%</span>
            </div>
            <div style={{ height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '5px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${overallProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--accent), var(--success))',
                  borderRadius: '5px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {goals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const plan = calculateSavingsPlan(goal);
          const milestones = [25, 50, 75, 100];

          return (
            <div
              key={goal.id}
              className="glass-card"
              style={{
                padding: '1.5rem',
                borderRadius: '1rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: progress >= 100 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                      color: progress >= 100 ? 'var(--success)' : 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {progress >= 100 ? <CheckCircle2 size={24} /> : <Target size={24} />}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{goal.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      <Calendar size={13} />
                      <span>
                        {new Date(goal.deadline).toLocaleDateString('ru-RU')}
                        {plan.isOverdue && !plan.isCompleted ? ' (Дедлайн прошел)' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteGoal(goal.id)}
                  title="Удалить цель"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '0.25rem'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Amounts & Progress */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.35rem', fontWeight: 700, color: progress >= 100 ? 'var(--success)' : 'var(--text-primary)' }}>
                    {goal.currentAmount.toLocaleString('ru-RU')} ₽
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    из {goal.targetAmount.toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: progress >= 100 ? 'var(--success)' : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                      borderRadius: '5px',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>

                {/* Milestones Indicators */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {milestones.map((m) => (
                    <span
                      key={m}
                      style={{
                        fontWeight: progress >= m ? 700 : 400,
                        color: progress >= m ? 'var(--success)' : 'var(--text-secondary)'
                      }}
                    >
                      {progress >= m ? '✓ ' : ''}{m}%
                    </span>
                  ))}
                </div>
              </div>

              {/* Smart Savings Calculation Box */}
              {!plan.isCompleted && (
                <div
                  style={{
                    padding: '0.85rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-glass)',
                    marginBottom: '1.25rem',
                    fontSize: '0.825rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.35rem' }}>
                    <Sparkles size={14} /> Умный расчет накоплений:
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                    <span>Нужно в месяц:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>~{plan.perMonth.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Нужно в неделю:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>~{plan.perWeek.toLocaleString('ru-RU')} ₽</span>
                  </div>
                </div>
              )}

              {plan.isCompleted && (
                <div
                  style={{
                    padding: '0.85rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: 'var(--success)',
                    fontWeight: 600,
                    marginBottom: '1.25rem',
                    fontSize: '0.85rem',
                    textAlign: 'center'
                  }}
                >
                  🎉 Цель полностью достигнута!
                </div>
              )}

              {/* Action */}
              <div style={{ marginTop: 'auto' }}>
                <button
                  onClick={() => handleContributeClick(goal)}
                  className="btn btn--primary"
                  style={{ width: '100%', padding: '0.65rem' }}
                >
                  <Coins size={16} /> Пополнить копилку
                </button>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem 1.5rem', borderRadius: '1rem' }}>
            <Target size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>У вас пока нет финансовых целей</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem 0', fontSize: '0.9rem' }}>
              Создайте цель (например: Отпуск, Новый ноутбук, Автомобиль или Подушка безопасности) и отслеживайте прогресс!
            </p>
            <button onClick={() => setIsAddGoalModalOpen(true)} className="btn btn--primary">
              <Plus size={18} /> Создать первую цель
            </button>
          </div>
        )}
      </div>

      {/* Modal: Add Goal */}
      {isAddGoalModalOpen && (
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
          onClick={() => setIsAddGoalModalOpen(false)}
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
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem' }}>Новая финансовая цель</h2>
            <form onSubmit={handleAddGoal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Название цели
                </label>
                <input
                  type="text"
                  value={newGoalName}
                  onChange={e => setNewGoalName(e.target.value)}
                  className="input"
                  placeholder="Например: Поездка на море"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Целевая сумма (₽)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newGoalTargetAmount}
                  onChange={e => setNewGoalTargetAmount(e.target.value)}
                  className="input"
                  placeholder="100000"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Желаемая дата достижения (дедлайн)
                </label>
                <input
                  type="date"
                  value={newGoalDate}
                  onChange={e => setNewGoalDate(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddGoalModalOpen(false)}
                  className="btn btn--outline"
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn--primary">
                  Сохранить цель
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Contribute to Goal */}
      {isContributeModalOpen && selectedGoal && (
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
          onClick={() => setIsContributeModalOpen(false)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '2rem',
              borderRadius: '1.25rem',
              background: 'var(--bg-secondary)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>Пополнить копилку</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Цель: <strong style={{ color: 'var(--text-primary)' }}>{selectedGoal.name}</strong>
            </p>

            <form onSubmit={handleContribute} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Сумма пополнения (₽)
                </label>
                <input
                  type="number"
                  min="1"
                  value={contributeAmount}
                  onChange={e => setContributeAmount(e.target.value)}
                  className="input"
                  placeholder="5000"
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsContributeModalOpen(false)}
                  className="btn btn--outline"
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn--primary">
                  Пополнить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
