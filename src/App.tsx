import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { TransactionsPage } from './components/transactions/TransactionsPage';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { BudgetsPage } from './components/budgets/BudgetsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { AccountsPage } from './components/accounts/AccountsPage';
import { GoalsPage } from './components/goals/GoalsPage';
import { Menu, X, RefreshCw, AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App crashed with error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}>
          <div style={{
            padding: '2.5rem',
            borderRadius: '1.25rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            maxWidth: '500px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
              <AlertCircle size={48} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Что-то пошло не так</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Произошла ошибка при отображении страницы. Попробуйте обновить страницу.
            </p>
            <button
              onClick={this.handleReset}
              className="btn btn--primary"
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
            >
              <RefreshCw size={16} /> Перезагрузить приложение
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'transactions':
        return <TransactionsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'budgets':
        return <BudgetsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'accounts':
        return <AccountsPage />;
      case 'goals':
        return <GoalsPage />;
      case 'dashboard':
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Menu Toggle Button */}
      <button 
        className="mobile-menu-toggle btn btn--outline"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 110,
          padding: '0.5rem',
          borderRadius: '0.5rem',
          backdropFilter: 'blur(10px)',
          cursor: 'pointer'
        }}
      >
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Sidebar Navigation */}
      <div className={`sidebar-container ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      </div>

      {/* Main Content View */}
      <main className="main-content">
        {renderPage()}
      </main>
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 90,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <FinanceProvider>
        <AppContent />
      </FinanceProvider>
    </ErrorBoundary>
  );
};

export default App;
