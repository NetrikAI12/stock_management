import React, { useEffect } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useStock } from '../../contexts/StockContext';
import { LowStockItem } from '../../types';

const LowStockAlerts: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { getLowStockItems, loading, error } = useStock();

  const lowStockItems: LowStockItem[] = getLowStockItems();

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'staff') {
      lowStockItems.forEach((item) => {
        addNotification({
          type: 'stock',
          message: `Low stock alert: ${item.name} has ${item.quantity} cylinders remaining`,
        });
      });
    }
  }, [lowStockItems, user, addNotification]);

  if (!user) {
    return <div className="text-center text-red-600 dark:text-red-400">Please log in to view this page.</div>;
  }

  if (user.role === 'viewer') {
    return (
      <div className="text-center text-red-600 dark:text-red-400">
        You do not have permission to view this page.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-600 dark:text-gray-400">
        <div className="text-center">
          <Package className="h-8 w-8 mx-auto mb-2 animate-spin" />
          <p>Loading stock data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-red-600 dark:text-red-400">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Error: {error}. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (lowStockItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-green-600 dark:text-green-400">
        <div className="text-center">
          <Package className="h-8 w-8 mx-auto mb-2" />
          <p>All stock levels are healthy!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto p-4">
      {lowStockItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current: {item.quantity} cylinders (Threshold: {item.threshold})
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              Low Stock
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LowStockAlerts;