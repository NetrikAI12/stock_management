import React from 'react';
import { Package, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../contexts/AuthContext';
import StatsCard from './StatsCard';
import RecentTransactions from './RecentTransactions';
import StockChart from './StockChart';
import LowStockAlerts from './LowStockAlerts';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { getStockSummary, getLowStockItems, transactions } = useStock();
  const summary = getStockSummary();
  const lowStockItems = getLowStockItems();
  
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard Overview
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Items"
          value={summary.totalItems}
          change="+12% from last month"
          changeType="positive"
          icon={Package}
          color="blue"
        />
        <StatsCard
          title="Total Value"
          value={`$${summary.totalValue.toLocaleString()}`}
          change="+8.2% from last month"
          changeType="positive"
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Low Stock Items"
          value={summary.lowStockItems}
          change={summary.lowStockItems > 0 ? 'Requires attention' : 'All good'}
          changeType={summary.lowStockItems > 0 ? 'negative' : 'positive'}
          icon={AlertTriangle}
          color={summary.lowStockItems > 0 ? 'red' : 'green'}
        />
        <StatsCard
          title="Recent Transactions"
          value={summary.recentTransactions}
          change="Last 7 days"
          changeType="neutral"
          icon={Activity}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Stock Levels by Category
          </h3>
          <StockChart data={summary.categorySummary} />
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Low Stock Alerts
          </h3>
          <LowStockAlerts items={lowStockItems} />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Transactions
        </h3>
        <RecentTransactions transactions={recentTransactions} />
      </div>
    </div>
  );
};

export default Dashboard;