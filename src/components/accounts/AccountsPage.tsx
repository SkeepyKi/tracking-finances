import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Plus, CreditCard, Wallet, ArrowRightLeft, Trash2, PiggyBank, TrendingUp, Bitcoin, Building2 } from 'lucide-react';

export const AccountsPage: React.FC = () => {
  const { data, addAccount, addTransaction, deleteAccount } = useFinance();
  const accounts = data.accounts || [];
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'card' | 'cash' | 'savings' | 'investment' | 'crypto'>('card');
  const [newAccountBalance, setNewAccountBalance] = useState('');

  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    addAccount({
      name: newAccountName.trim(),
      type: newAccountType,
      balance: Number(newAccountBalance) || 0,
      currency: 'RUB',
      color: '#3b82f6',
      icon: newAccountType
    });
    setNewAccountName('');
    setNewAccountBalance('');
    setIsAddAccountModalOpen(false);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFrom || !transferTo || !transferAmount || transferFrom === transferTo) return;
    const amount = Number(transferAmount);
    if (amount <= 0) return;

    addTransaction({
      accountId: transferFrom,
      toAccountId: transferTo,
      amount,
      type: 'transfer',
      date: new Date().toISOString(),
      description: `Перевод: ${accounts.find(a => a.id === transferFrom)?.name} → ${accounts.find(a => a.id === transferTo)?.name}`
    });

    setTransferFrom('');
    setTransferTo('');
    setTransferAmount('');
    setIsTransferModalOpen(false);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'card': return <CreditCard size={22} />;
      case 'cash': return <Wallet size={22} />;
      case 'savings': return <PiggyBank size={22} />;
      case 'investment': return <TrendingUp size={22} />;
      case 'crypto': return <Bitcoin size={22} />;
      default: return <Building2 size={22} />;
    }
  };

  const getAccountTypeName = (type: string) => {
    switch (type) {
      case 'card': return 'Банковская карта';
      case 'cash': return 'Наличные деньги';
      case 'savings': return 'Накопительный счет';
      case 'investment': return 'Брокерский счет';
      case 'crypto': return 'Криптокошелек';
      default: return 'Счет';
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Счета и Кошельки</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Управление балансами карт, счетов и переводы
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {accounts.length >= 2 && (
            <button
              onClick={() => {
                setTransferFrom(accounts[0]?.id || '');
                setTransferTo(accounts[1]?.id || '');
                setIsTransferModalOpen(true);
              }}
              className="btn btn--outline"
            >
              <ArrowRightLeft size={18} /> Перевод между счетами
            </button>
          )}
          <button onClick={() => setIsAddAccountModalOpen(true)} className="btn btn--primary">
            <Plus size={18} /> Добавить счет
          </button>
        </div>
      </div>

      {/* Summary Total Card */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.35rem' }}>Суммарный баланс всех счетов</div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {totalBalance.toLocaleString('ru-RU')} ₽
        </div>
      </div>

      {/* Accounts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {accounts.map((account) => (
          <div
            key={account.id}
            className="glass-card"
            style={{
              padding: '1.5rem',
              borderRadius: '1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {getAccountIcon(account.type)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>{account.name}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {getAccountTypeName(account.type)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteAccount(account.id)}
                  title="Удалить счет"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Текущий остаток</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: account.balance >= 0 ? 'var(--text-primary)' : 'var(--danger)' }}>
                  {account.balance.toLocaleString('ru-RU')} ₽
                </div>
              </div>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem 1.5rem', borderRadius: '1rem' }}>
            <CreditCard size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>У вас пока нет добавленных счетов</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem 0', fontSize: '0.9rem' }}>
              Добавьте свои карты, наличные кошельки или вклады, чтобы учитывать операции и видеть суммарный баланс.
            </p>
            <button onClick={() => setIsAddAccountModalOpen(true)} className="btn btn--primary">
              <Plus size={18} /> Добавить первый счет
            </button>
          </div>
        )}
      </div>

      {/* Modal: Add Account */}
      {isAddAccountModalOpen && (
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
          onClick={() => setIsAddAccountModalOpen(false)}
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
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem' }}>Новый счет / кошелек</h2>
            <form onSubmit={handleAddAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Название счета
                </label>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={e => setNewAccountName(e.target.value)}
                  className="input"
                  placeholder="Например: Tinkoff Black или Наличные"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Тип счета
                </label>
                <select
                  value={newAccountType}
                  onChange={e => setNewAccountType(e.target.value as any)}
                  className="input"
                >
                  <option value="card">💳 Банковская карта</option>
                  <option value="cash">💵 Наличные</option>
                  <option value="savings">🏦 Накопительный счет / Вклад</option>
                  <option value="investment">📈 Брокерский счет</option>
                  <option value="crypto">🪙 Криптокошелек</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Начальный баланс (₽)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newAccountBalance}
                  onChange={e => setNewAccountBalance(e.target.value)}
                  className="input"
                  placeholder="0"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="btn btn--outline"
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn--primary">
                  Создать счет
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transfer Between Accounts */}
      {isTransferModalOpen && (
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
          onClick={() => setIsTransferModalOpen(false)}
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
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem' }}>Перевод между счетами</h2>
            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Откуда (списать со счета)
                </label>
                <select
                  value={transferFrom}
                  onChange={e => setTransferFrom(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Выберите счет списания</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.balance.toLocaleString('ru-RU')} ₽)</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Куда (зачислить на счет)
                </label>
                <select
                  value={transferTo}
                  onChange={e => setTransferTo(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Выберите счет зачисления</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.balance.toLocaleString('ru-RU')} ₽)</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Сумма перевода (₽)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  className="input"
                  placeholder="1000"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="btn btn--outline"
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn--primary">
                  Выполнить перевод
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
