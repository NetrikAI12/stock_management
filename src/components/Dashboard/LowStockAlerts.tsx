// components/LowStockAlerts/LowStockAlerts.tsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const LowStockAlerts: React.FC = () => {
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  const fetchLowStockItems = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all stock levels from stocktransactions joined with products
      const { data, error: fetchError } = await supabase
        .from('stocktransactions')
        .select(`
          productid,
          transactiondate,
          physicalstock,
          discrepancy_note,
          products (
            productid,
            productname,
            producttype,
            defaultunit
          )
        `)
        .order('productid, transactiondate', { ascending: [true, false] }); // Order by productid, then latest transaction

      if (fetchError) {
        throw new Error(`Error fetching stock transactions: ${fetchError.message}`);
      }

      if (data && data.length > 0) {
        // Group by productid and get the latest physicalstock
        const latestStocks = data.reduce((acc: any[], curr: any) => {
          const existing = acc.find((item) => item.productid === curr.productid);
          if (!existing) {
            acc.push({
              id: curr.productid,
              name: curr.products.productname,
              type: curr.products.producttype,
              quantity: curr.physicalstock,
              unit: curr.products.defaultunit,
              threshold: 10, // Match this with Dashboard's threshold if different
              lastUpdated: curr.transactiondate,
              discrepancyNote: curr.discrepancy_note || 'None',
            });
          } else if (new Date(existing.lastUpdated) < new Date(curr.transactiondate)) {
            // Update if a newer transaction is found for the same productid
            existing.quantity = curr.physicalstock;
            existing.lastUpdated = curr.transactiondate;
            existing.discrepancyNote = curr.discrepancy_note || 'None';
          }
          return acc;
        }, []);

        // Filter items below threshold
        const lowStock = latestStocks.filter((item) => item.quantity <= item.threshold);
        setLowStockItems(lowStock);
        console.log('Low stock items:', lowStock); // Debug log
      }
    } catch (err) {
      console.error('Error in fetchLowStockItems:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

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
                Type: {item.type} | Current: {item.quantity} {item.unit} (Threshold: {item.threshold})
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last Updated: {new Date(item.lastUpdated).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Discrepancy Note: {item.discrepancyNote}
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