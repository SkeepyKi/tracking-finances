import React, { useState, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  Moon, Sun, Monitor, Download, Upload, Trash2, Plus, 
  AlertTriangle, FileText, Globe, Check, Sparkles 
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { 
    data, 
    updateSettings, 
    addCategory, 
    deleteCategory, 
    importData, 
    exportData, 
    exportCSV, 
    clearAllData 
  } = useFinance();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const settings = data.settings || { currency: 'RUB', currencySymbol: '₽', theme: 'dark' };
  const categories = data.categories || [];

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const symbols: Record<string, string> = { 'RUB': '₽', 'USD': '$', 'EUR': '€', 'KZT': '₸' };
    updateSettings({ currency: val, currencySymbol: symbols[val] || '₽' });
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCategory({
      name: newCategoryName.trim(),
      type: newCategoryType,
      color: newCategoryType === 'income' ? '#10b981' : '#3b82f6',
      icon: 'tag',
    });
    setNewCategoryName('');
  };

  const handleExportJSON = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        importData(text);
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } catch (err) {
        console.error('Ошибка при импорте:', err);
        alert('Ошибка при импорте данных. Проверьте формат JSON-файла.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportCSV = () => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (showConfirmClear) {
      clearAllData();
      setShowConfirmClear(false);
    } else {
      setShowConfirmClear(true);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Настройки</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
          Оформление, валюта, категории и резервное копирование
        </p>
      </div>

      {/* 1. Theme and Currency */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.25rem' }}>Внешний вид и Валюта</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Тема оформления</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Светлый, тёмный или автоматический режим</div>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {(['dark', 'light', 'system'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleThemeChange(t)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-glass)',
                    background: settings.theme === t ? 'var(--accent)' : 'transparent',
                    color: settings.theme === t ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500
                  }}
                >
                  {t === 'dark' && <Moon size={15} />}
                  {t === 'light' && <Sun size={15} />}
                  {t === 'system' && <Monitor size={15} />}
                  <span>{t === 'dark' ? 'Тёмная' : t === 'light' ? 'Светлая' : 'Авто'}</span>
                </button>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)', margin: 0 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Основная валюта</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Используется для расчетов и отображения балансов</div>
            </div>
            <select
              value={settings.currency || 'RUB'}
              onChange={handleCurrencyChange}
              className="input"
              style={{ width: 'auto', minWidth: '160px' }}
            >
              <option value="RUB">₽ Российский рубль (RUB)</option>
              <option value="USD">$ Доллар США (USD)</option>
              <option value="EUR">€ Евро (EUR)</option>
              <option value="KZT">₸ Казахстанский тенге (KZT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Category Management */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem' }}>Управление категориями</h2>
        
        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Название новой категории..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="input"
            style={{ flex: 1, minWidth: '180px' }}
            required
          />
          <select
            value={newCategoryType}
            onChange={(e) => setNewCategoryType(e.target.value as any)}
            className="input"
            style={{ width: 'auto' }}
          >
            <option value="expense">Расход</option>
            <option value="income">Доход</option>
          </select>
          <button type="submit" className="btn btn--primary">
            <Plus size={16} /> Добавить
          </button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', maxHeight: '260px', overflowY: 'auto' }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.6rem 0.85rem',
                borderRadius: '0.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)',
                fontSize: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: cat.type === 'income' ? 'var(--success)' : 'var(--accent)'
                  }}
                />
                <span style={{ fontWeight: 500 }}>{cat.name}</span>
              </div>
              <button
                type="button"
                onClick={() => deleteCategory(cat.id)}
                title="Удалить категорию"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.2rem'
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Backups & Data Export/Import */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>Резервное копирование и Экспорт</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Все данные хранятся локально в вашем браузере. Регулярно скачивайте резервную копию для переноса на другие устройства.
        </p>

        {importSuccess && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <Check size={16} /> Данные успешно импортированы!
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button onClick={handleExportJSON} className="btn btn--outline">
            <Download size={16} /> Скачать бэкап (JSON)
          </button>

          <button onClick={() => fileInputRef.current?.click()} className="btn btn--outline">
            <Upload size={16} /> Восстановить из файла (JSON)
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            style={{ display: 'none' }}
          />

          <button onClick={handleExportCSV} className="btn btn--outline">
            <FileText size={16} /> Экспорт таблицы (CSV)
          </button>
        </div>
      </div>

      {/* 4. GitHub Pages Info Box */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Globe size={20} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Хостинг на GitHub Pages</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
          Приложение полностью автономно и работает без сервера. Для бесплатной публикации:
          загрузите репозиторий на GitHub, перейдите в <strong>Settings → Pages</strong> и выберите источник <strong>GitHub Actions</strong>.
        </p>
      </div>

      {/* 5. Danger Zone */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '0.5rem' }}>Опасная зона</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Очистка всех счетов, транзакций, целей и бюджетов. Рекомендуется сначала скачать бэкап.
        </p>

        {showConfirmClear ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>
              <AlertTriangle size={18} /> Вы точно уверены?
            </span>
            <button
              type="button"
              onClick={handleClearData}
              style={{ background: 'var(--danger)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
            >
              Да, стереть всё
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmClear(false)}
              className="btn btn--outline"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClearData}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <Trash2 size={16} /> Очистить все данные приложения
          </button>
        )}
      </div>
    </div>
  );
};
