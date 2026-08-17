import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Filter, Trash2, Plus, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, CreditCard } from 'lucide-react';
import { CustomSelect, SelectOption } from '../common/CustomSelect';

export const TransactionsPage: React.FC = () => {
  const { data, addTransaction, deleteTransaction } = useFinance();
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [accountId, setAccountId] = useState(data.accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(data.accounts[1]?.id || data.accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const transactions = data.transactions || [];
  const accounts = data.accounts || [];
  const categories = data.categories || [];

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    const currentAccountId = accountId || accounts[0]?.id || 'default';

    addTransaction({
      amount: Number(amount),
      type,
      accountId: currentAccountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      categoryId: type !== 'transfer' ? (categoryId || categories.find(c => c.type === type)?.id || 'general') : undefined,
      date: new Date(date).toISOString(),
      description: description.trim()
    });

    setDescription('');
    setAmount('');
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      (t.description || '').toLowerCase().includes(filter.toLowerCase()) ||
      (t.categoryId || '').toLowerCase().includes(filter.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesAccount = accountFilter === 'all' || t.accountId === accountFilter || t.toAccountId === accountFilter;
    return matchesSearch && matchesType && matchesAccount;
  });

  const getAccountName = (accId: string) => {
    return accounts.find(a => a.id === accId)?.name || 'Счет';
  };

  const getCategoryInfo = (catId?: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'Без категории';
  };

  return (
    <div className="transactions-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Операции и Расходы</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            История доходов, расходов и переводов
          </p>
        </div>
      </div>

      {/* Add Transaction Card (Compact & Full-width) */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} color="var(--accent)" /> Новая операция
          </h2>

          {/* Type Switcher */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-glass)',
                  background: type === t 
                    ? (t === 'expense' ? 'var(--danger)' : t === 'income' ? 'var(--success)' : 'var(--accent)') 
                    : 'transparent',
                  color: type === t ? '#fff' : 'var(--text-secondary)',
                  fontWeight: type === t ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.15s ease'
                }}
              >
                {t === 'expense' ? 'Расход' : t === 'income' ? 'Доход' : 'Перевод'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleAddTx} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Row 1: Description, Amount, Date */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Описание
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={type === 'expense' ? 'Например: Продукты в супермаркете' : type === 'income' ? 'Зарплата за месяц' : 'С карты на вклад'}
                className="input"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Сумма (₽)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="input"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Дата
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Row 2: Account, Category/ToAccount, Submit Button */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                {type === 'transfer' ? 'Со счета' : 'Счет'}
              </label>
              <select
                value={accountId || accounts[0]?.id || ''}
                onChange={e => setAccountId(e.target.value)}
                className="input"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.balance.toLocaleString('ru-RU')} ₽)</option>
                ))}
                {accounts.length === 0 && <option value="default">Основной счет</option>}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  На счет
                </label>
                <select
                  value={toAccountId || accounts[1]?.id || accounts[0]?.id || ''}
                  onChange={e => setToAccountId(e.target.value)}
                  className="input"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Категория
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="input"
                >
                  <option value="">Выберите категорию</option>
                  {categories.filter(c => c.type === type).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="btn btn--primary"
                style={{ width: '100%', height: '38px' }}
              >
                <Plus size={16} /> Добавить операцию
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Transactions List Section */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            История операций ({filteredTransactions.length})
          </h2>
          
          {/* Filters Bar: Search + Account Filter + Type Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '180px' }}>
              <Filter size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Поиск по описанию..."
                className="input"
                style={{ paddingLeft: '32px', fontSize: '0.85rem', height: '38px', boxSizing: 'border-box' }}
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </div>

            {/* Account Filter Custom Dropdown */}
            {accounts.length > 0 && (
              <CustomSelect
                options={[
                  { value: 'all', label: 'Все счета' },
                  ...accounts.map(a => ({
                    value: a.id,
                    label: a.name,
                    subLabel: `${a.balance.toLocaleString('ru-RU')} ₽`,
                    color: a.color
                  }))
                ]}
                value={accountFilter}
                onChange={setAccountFilter}
              />
            )}

            {/* Type Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.25rem', height: '38px', alignItems: 'center' }}>
              {(['all', 'expense', 'income', 'transfer'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  style={{
                    height: '38px',
                    padding: '0 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-glass)',
                    background: typeFilter === f ? 'var(--accent)' : 'transparent',
                    color: typeFilter === f ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: typeFilter === f ? 600 : 400,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f === 'all' ? 'Все' : f === 'expense' ? 'Расходы' : f === 'income' ? 'Доходы' : 'Переводы'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredTransactions.map((t) => {
            const isExpense = t.type === 'expense';
            const isIncome = t.type === 'income';
            return (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  transition: 'all 0.2s ease',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isExpense ? 'rgba(239, 68, 68, 0.15)' : isIncome ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: isExpense ? 'var(--danger)' : isIncome ? 'var(--success)' : 'var(--accent)'
                    }}
                  >
                    {isExpense && <ArrowDownLeft size={20} />}
                    {isIncome && <ArrowUpRight size={20} />}
                    {t.type === 'transfer' && <ArrowRightLeft size={20} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t.description || 'Операция'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span>{new Date(t.date).toLocaleDateString('ru-RU')}</span>
                      <span>•</span>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        padding: '0.1rem 0.45rem', 
                        borderRadius: '0.35rem', 
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-primary)',
                        fontWeight: 500
                      }}>
                        <CreditCard size={12} style={{ opacity: 0.7 }} />
                        {getAccountName(t.accountId)}
                        {t.type === 'transfer' && t.toAccountId && ` ➔ ${getAccountName(t.toAccountId)}`}
                      </span>
                      {t.categoryId && (
                        <>
                          <span>•</span>
                          <span>{getCategoryInfo(t.categoryId)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      color: isExpense ? 'var(--danger)' : isIncome ? 'var(--success)' : 'var(--text-primary)'
                    }}
                  >
                    {isExpense ? '-' : isIncome ? '+' : ''}{t.amount.toLocaleString('ru-RU')} ₽
                  </div>
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    title="Удалить"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      padding: '0.35rem',
                      borderRadius: '0.35rem',
                      display: 'flex',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredTransactions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0, fontSize: '1rem' }}>Операций пока нет или ничего не найдено по фильтрам.</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
                {accountFilter !== 'all' || typeFilter !== 'all' || filter
                  ? 'Попробуйте сбросить фильтры поиска.'
                  : 'Добавьте первую операцию с помощью формы выше.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
