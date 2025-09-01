// components/Dashboard/Dashboard.tsx
import React from 'react';
import { Package, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../contexts/AuthContext';
import StatsCard from './StatsCard';
import RecentTransactions from './RecentTransactions';
import StockChart from './StockChart';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-10 text-red-600 dark:text-red-400">
          Error: {this.state.error}. Please reload the page or contact support.
        </div>
      );
    }
    return this.props.children;
  }
}

const LowStockAlerts: React.FC<{ items: { id: number; name: string; quantity: number; threshold: number }[] }> = ({ items }) => {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">{item.name}</p>
              <p className="text-sm text-red-700 dark:text-red-200">
                Quantity: {item.quantity} (Threshold: {item.threshold})
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { getSalesSummary, getLowStockItems, transactions, loading, error } = useStock();
  const summary = getSalesSummary();
  const lowStockItems = getLowStockItems();
  
  const recentTransactions = transactions
    .sort((a, b) => {
      const timeA = new Date(a.timestamp || '').getTime();
      const timeB = new Date(b.timestamp || '').getTime();
      return timeB - timeA;
    })
    .slice(0, 10);

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-600 dark:text-gray-400">
        Loading dashboard data...
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-10 text-red-600 dark:text-red-400">
      Error: {error}. Please try again later or check your connection.
    </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sales & Inventory Dashboard
          </h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Cylinders"
            value={summary.totalCylinders.toLocaleString()}
            change="+5% from last month"
            changeType="positive"
            icon={Package}
            color="blue"
          />
          <StatsCard
            title="Total Sales Value"
            value={`$${summary.totalValue.toLocaleString()}`}
            change="+3.8% from last month"
            changeType="positive"
            icon={TrendingUp}
            color="green"
          />
          <StatsCard
            title="Low Stock Cylinders"
            value={summary.lowStockItems.toLocaleString()}
            change={summary.lowStockItems > 0 ? 'Requires attention' : 'All good'}
            changeType={summary.lowStockItems > 0 ? 'negative' : 'positive'}
            icon={AlertTriangle}
            color={summary.lowStockItems > 0 ? 'red' : 'green'}
          />
          <StatsCard
            title="Recent Sales"
            value={`$${summary.totalValue.toLocaleString()}`} // Changed to totalValue to match Total Sales Value
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
              Cylinder Stock Levels
            </h3>
            {summary.productSummary.length > 0 ? (
              <StockChart data={summary.productSummary} />
            ) : (
              <div className="text-center text-gray-500">No data available</div>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Low Stock Alerts
            </h3>
            {lowStockItems.length > 0 ? (
              <LowStockAlerts items={lowStockItems} />
            ) : (
              <div className="text-center text-gray-500">All stock levels are healthy!</div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Sales Transactions
          </h3>
          {recentTransactions.length > 0 ? (
            <RecentTransactions transactions={recentTransactions} />
          ) : (
            <div className="text-center text-gray-500">No recent transactions</div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;