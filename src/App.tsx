import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { TransactionsPage } from './components/transactions/TransactionsPage';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { BudgetsPage } from './components/budgets/BudgetsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { AccountsPage } from './components/accounts/AccountsPage';
import { GoalsPage } from './components/goals/GoalsPage';
import { Menu, X } from 'lucide-react';

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
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
};

export default App;
