import React, { useState, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  Moon, Sun, Monitor, Download, Upload, Trash2, Plus, 
  AlertTriangle, FileText, Globe, Check, Cloud, RefreshCw, 
  Key, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle
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
    clearAllData,
    syncStatus,
    syncError,
    syncCloud,
    createCloudBackup,
    testToken
  } = useFinance();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // Cloud Sync state
  const settings = data.settings || { currency: 'RUB', currencySymbol: '₽', theme: 'dark' };
  const [githubToken, setGithubToken] = useState(settings.githubToken || '');
  const [gistId, setGistId] = useState(settings.gistId || '');
  const [tokenUser, setTokenUser] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCreatingGist, setIsCreatingGist] = useState(false);
  const [isSyncingAction, setIsSyncingAction] = useState(false);

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

  // Cloud Sync Handlers
  const handleSaveTokenAndGist = () => {
    updateSettings({
      githubToken: githubToken.trim(),
      gistId: gistId.trim(),
      autoSync: true
    });
    setSyncFeedback({ type: 'success', text: 'Настройки синхронизации сохранены!' });
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleCreateNewGist = async () => {
    if (!githubToken.trim()) {
      setSyncFeedback({ type: 'error', text: 'Сначала введите GitHub Personal Access Token' });
      return;
    }

    setIsCreatingGist(true);
    setSyncFeedback(null);
    try {
      const res = await createCloudBackup(githubToken.trim());
      if (res.success && res.gistId) {
        setGistId(res.gistId);
        setSyncFeedback({ type: 'success', text: `Приватный Gist успешно создан! (ID: ${res.gistId})` });
      } else {
        setSyncFeedback({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setSyncFeedback({ type: 'error', text: err.message || 'Ошибка создания Gist' });
    } finally {
      setIsCreatingGist(false);
    }
  };

  const handleManualSync = async (direction: 'auto' | 'push' | 'pull') => {
    setIsSyncingAction(true);
    setSyncFeedback(null);
    try {
      // Save current input fields first if changed
      if (githubToken !== settings.githubToken || gistId !== settings.gistId) {
        updateSettings({ githubToken: githubToken.trim(), gistId: gistId.trim() });
      }

      const res = await syncCloud(direction);
      if (res.success) {
        setSyncFeedback({ type: 'success', text: res.message });
      } else {
        setSyncFeedback({ type: 'error', text: res.message });
      }
    } finally {
      setIsSyncingAction(false);
    }
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
          Оформление, валюта, облачная синхронизация между устройствами и бэкапы
        </p>
      </div>

      {/* 1. Cloud Sync via GitHub Gist (MAIN SYNC SECTION) */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cloud size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Облачная синхронизация (GitHub Gist)</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Синхронизация между телефоном и ПК без сторонних баз данных
              </span>
            </div>
          </div>

          {/* Sync Status Badge */}
          <div>
            {syncStatus === 'synced' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.65rem', borderRadius: '2rem', background: 'var(--success-bg)', color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Синхронизировано
              </span>
            )}
            {syncStatus === 'syncing' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.65rem', borderRadius: '2rem', background: 'var(--accent-glow)', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600 }}>
                <RefreshCw size={14} className="animate-spin" /> Синхронизация...
              </span>
            )}
            {syncStatus === 'error' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.65rem', borderRadius: '2rem', background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600 }}>
                <AlertCircle size={14} /> Ошибка синхронизации
              </span>
            )}
          </div>
        </div>

        {syncFeedback && (
          <div style={{ padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', background: syncFeedback.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)', color: syncFeedback.type === 'success' ? 'var(--success)' : 'var(--danger)', border: `1px solid ${syncFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
            {syncFeedback.text}
          </div>
        )}

        {settings.lastSyncedAt && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Последняя синхронизация: <strong>{new Date(settings.lastSyncedAt).toLocaleString('ru-RU')}</strong>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Token Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                GitHub Personal Access Token (PAT)
              </label>
              <a
                href="https://github.com/settings/tokens/new?scopes=gist&description=Finance+Tracker+Sync"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.8rem', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                Создать токен на GitHub <ExternalLink size={12} />
              </a>
            </div>
            <input
              type="password"
              value={githubToken}
              onChange={e => setGithubToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="input"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
              Требуется только право доступа <code>gist</code> (для чтения и записи ваших приватных заметок-бэкапов).
            </span>
          </div>

          {/* Gist ID Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Gist ID (Идентификатор приватного хранилища)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={gistId}
                onChange={e => setGistId(e.target.value)}
                placeholder="например: a1b2c3d4e5f6... (или нажмите Создать)"
                className="input"
                style={{ flex: 1, minWidth: '220px' }}
              />
              <button
                type="button"
                onClick={handleCreateNewGist}
                disabled={isCreatingGist || !githubToken.trim()}
                className="btn btn--outline"
                style={{ opacity: !githubToken.trim() ? 0.5 : 1 }}
              >
                {isCreatingGist ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                Создать новый Gist
              </button>
            </div>
          </div>

          {/* Sync Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleManualSync('auto')}
              disabled={isSyncingAction || !githubToken || !gistId}
              className="btn btn--primary"
              style={{ opacity: (!githubToken || !gistId) ? 0.5 : 1 }}
            >
              <RefreshCw size={16} className={isSyncingAction ? 'animate-spin' : ''} />
              Синхронизировать сейчас
            </button>

            <button
              type="button"
              onClick={() => handleManualSync('push')}
              disabled={isSyncingAction || !githubToken || !gistId}
              className="btn btn--outline"
              title="Загрузить текущие локальные данные в облако"
              style={{ opacity: (!githubToken || !gistId) ? 0.5 : 1 }}
            >
              ⬆ В облако (Push)
            </button>

            <button
              type="button"
              onClick={() => handleManualSync('pull')}
              disabled={isSyncingAction || !githubToken || !gistId}
              className="btn btn--outline"
              title="Загрузить свежие данные из облака на это устройство"
              style={{ opacity: (!githubToken || !gistId) ? 0.5 : 1 }}
            >
              ⬇ Из облака (Pull)
            </button>

            <button
              type="button"
              onClick={handleSaveTokenAndGist}
              className="btn btn--outline"
              style={{ marginLeft: 'auto' }}
            >
              Сохранить ключи
            </button>
          </div>

          {/* Guide Note */}
          <div style={{ padding: '0.85rem', borderRadius: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            💡 <strong>Как подключить второе устройство (телефон/ноутбук):</strong>
            <ol style={{ paddingLeft: '1.25rem', marginTop: '0.35rem' }}>
              <li>На первом устройстве введите токен и нажмите <strong>«Создать новый Gist»</strong>.</li>
              <li>Скопируйте ваш <strong>Токен</strong> и получившийся <strong>Gist ID</strong>.</li>
              <li>Откройте сайт на телефоне, вставьте этот же Токен и Gist ID и нажмите <strong>«⬇ Из облака (Pull)»</strong>.</li>
              <li>Готово! Теперь все изменения синхронизируются автоматически.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* 2. Theme and Currency */}
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

      {/* 3. Category Management */}
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

      {/* 4. Backups & File Export/Import */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>Локальные файлы бэкапа</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Вы также можете вручную выгружать файл JSON или CSV таблицу.
        </p>

        {importSuccess && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', marginBottom: '1rem', fontSize: '0.875rem' }}>
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

      {/* 5. Danger Zone */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '0.5rem' }}>Опасная зона</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Очистка всех счетов, транзакций, целей и бюджетов. Рекомендуется сначала скачать бэкап.
        </p>

        {showConfirmClear ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--danger-bg)', padding: '1rem', borderRadius: '0.75rem', flexWrap: 'wrap' }}>
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
