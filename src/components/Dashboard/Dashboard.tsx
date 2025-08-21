import React, { useEffect, useState } from 'react';
import { Package, TrendingUp, AlertTriangle, Activity, Edit2, Trash2 } from 'lucide-react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import StatsCard from './StatsCard';
import RecentTransactions from './RecentTransactions';
import StockChart from './StockChart';
import LowStockAlerts from './LowStockAlerts';
import EditStockForm from './EditStockForm';

interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  specifications?: string;
  category: string;
  price_per_unit: number;
  supplier_id?: string | null;
  added_by: string;
  date_added: string;
  last_updated: string;
  threshold: number;
  barcode?: string | null;
  image_url?: string | null;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { getStockSummary, getLowStockItems, transactions } = useStock();
  const summary = getStockSummary();
  const lowStockItems = getLowStockItems();
  
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  useEffect(() => {
    const fetchStockItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from<StockItem>('stockitems')
          .select('*')
          .order('date_added', { ascending: false });

        if (error) throw error;
        setStockItems(data || []);
      } catch (err: any) {
        console.error('Error fetching stock items:', err);
        setError(err.message || 'Failed to fetch stock items');
      } finally {
        setLoading(false);
      }
    };

    fetchStockItems();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('stockitems')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStockItems(prev => prev.filter(item => item.id !== id));
      alert('Item deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting stock item:', err);
      alert(`Failed to delete item: ${err.message}`);
    }
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
  };

  const handleUpdate = (updatedItem: StockItem) => {
    setStockItems(prev =>
      prev.map(item => (item.id === updatedItem.id ? updatedItem : item))
    );
    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {editingItem && isAdmin && (
        <EditStockForm
          item={editingItem}
          onUpdate={handleUpdate}
          onCancel={handleCancelEdit}
        />
      )}

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

      {/* Stock Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          All Stock Items
        </h3>
        
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading stock items...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : stockItems.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No stock items found.</p>
        ) : (
          <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Name</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Category</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Quantity</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Unit</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Price/Unit</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Total Value</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Added By</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Last Updated</th>
                {isAdmin && (
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {stockItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{item.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{item.category}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{item.quantity}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{item.unit}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">${item.price_per_unit.toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">${(item.quantity * item.price_per_unit).toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{item.added_by}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {new Date(item.last_updated).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;