import React from 'react';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Wallet, 
  Target, 
  PieChart, 
  TrendingUp, 
  Settings,
  Sparkles
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Обзор', icon: LayoutDashboard },
  { id: 'transactions', label: 'Операции', icon: ArrowRightLeft },
  { id: 'accounts', label: 'Счета', icon: Wallet },
  { id: 'goals', label: 'Цели', icon: Target },
  { id: 'budgets', label: 'Бюджеты', icon: PieChart },
  { id: 'analytics', label: 'Аналитика', icon: TrendingUp },
  { id: 'settings', label: 'Настройки', icon: Settings },
];

interface SidebarProps { 
  currentPage: string; 
  onNavigate: (page: string) => void; 
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { totalBalance } = useFinance();

  return (
    <aside
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 1rem',
      }}
    >
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem', marginBottom: '2rem' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.1rem',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)'
          }}
        >
          ₽
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            FinTrack
          </h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Личные финансы</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.7rem 0.9rem',
                background: isActive ? 'var(--accent)' : 'transparent',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                width: '100%',
                boxShadow: isActive ? '0 4px 12px var(--accent-glow)' : 'none'
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-glow)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Total Balance Card at Bottom */}
      <div 
        className="glass-card"
        style={{
          marginTop: 'auto',
          padding: '1.15rem',
          borderRadius: '0.875rem',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(16, 185, 129, 0.08))',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}
      >
        <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Баланс всех счетов
        </p>
        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {totalBalance.toLocaleString('ru-RU')} ₽
        </p>
      </div>
    </aside>
  );
};
