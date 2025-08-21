import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StockProvider } from './contexts/StockContext';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import InventoryView from './components/Inventory/InventoryView';
import AddStockForm from './components/Stock/AddStockForm';
import DistributeStockForm from './components/Stock/DistributeStockForm';
import ReportsView from './components/Reports/ReportsView';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <InventoryView />;
      case 'add-stock':
        return <AddStockForm />;
      case 'distribute-stock':
        return <DistributeStockForm />;
      case 'reports':
        return <ReportsView />;
      case 'analytics':
        return <ReportsView />;
      case 'low-stock':
        return <InventoryView />;
      case 'suppliers':
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Supplier Management</h2>
            <p className="text-gray-500 dark:text-gray-400">Feature coming soon...</p>
          </div>
        );
      case 'users':
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">User Management</h2>
            <p className="text-gray-500 dark:text-gray-400">Feature coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Settings</h2>
            <p className="text-gray-500 dark:text-gray-400">Feature coming soon...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-100 dark:bg-gray-900 ${darkMode ? 'dark' : ''}`}>
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />
          <main className="p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <StockProvider>
        <AppContent />
      </StockProvider>
    </AuthProvider>
  );
};

export default App;