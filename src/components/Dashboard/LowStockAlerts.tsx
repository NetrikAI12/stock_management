// components/LowStockAlerts/LowStockAlerts.tsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useStock } from '../../contexts/StockContext';

const LowStockAlerts: React.FC = () => {
  const { departments } = useStock(); // Assuming departments are available in context
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  const fetchLowStockItems = async () => {
    try {
      // Fetch latest stock levels from StockTransactions joined with Products
      const { data, error } = await supabase
        .from('stocktransactions')
        .select(`
          productid,
          closingbalance,
          products (
            productid,
            productname,
            producttype,
            defaultunit
          )
        `)
        .order('transactiondate', { ascending: false })
        .limit(1); // Get the latest transaction per product

      if (error) {
        console.error('Error fetching stock transactions:', error.message);
        return;
      }

      if (data && data.length > 0) {
        // Group by productid to get the latest balance
        const latestStocks = data.reduce((acc: any[], curr: any) => {
          const existing = acc.find((item) => item.productid === curr.productid);
          if (!existing) {
            acc.push({
              id: curr.productid,
              name: curr.products.productname,
              quantity: curr.closingbalance,
              unit: curr.products.defaultunit,
              threshold: 10, // Default threshold; add to Products table if needed
            });
          }
          return acc;
        }, []);

        // Filter items below threshold
        const lowStock = latestStocks.filter((item) => item.quantity <= item.threshold);
        setLowStockItems(lowStock);
      }
    } catch (error) {
      console.error('Error in fetchLowStockItems:', error);
    }
  };

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
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {lowStockItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {item.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current: {item.quantity} {item.unit} (Threshold: {item.threshold})
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