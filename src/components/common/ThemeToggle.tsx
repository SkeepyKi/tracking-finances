import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export function ThemeToggle() {
  const { data, updateSettings } = useFinance();
  const theme = data.settings?.theme || 'system';

  const handleToggle = () => {
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    updateSettings({ theme: nextTheme });
  };

  return (
    <button
      onClick={handleToggle}
      title="Изменить тему"
      className="theme-toggle-btn"
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'inherit',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}
    >
      {theme === 'light' && <Sun size={20} />}
      {theme === 'dark' && <Moon size={20} />}
      {theme === 'system' && <Monitor size={20} />}
    </button>
  );
}
