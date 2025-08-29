// contexts/StockContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { StockItem, Transaction, SalesSummary, LowStockItem } from '../types';

interface StockContextType {
  stockItems: StockItem[];
  transactions: Transaction[];
  addStockItem: (item: Omit<StockItem, 'id' | 'lastUpdated' | 'dateAdded'>) => void;
  updateStockItem: (id: number, updates: Partial<StockItem>) => void;
  deleteStockItem: (id: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp' | 'createdat'>) => void;
  getSalesSummary: () => SalesSummary;
  getLowStockItems: () => LowStockItem[];
  searchItems: (query: string) => StockItem[];
  loading: boolean;
  error: string | null;
}

const StockContext = createContext<StockContextType | null>(null);

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching data from Supabase...');
        const { data: sales, error: salesError } = await supabase
          .from('salesreports')
          .select(`
            salesreportid,
            productid,
            reportdate,
            closingcylinders,
            closingunits,
            salecylinders,
            salesunits,
            products(productname, producttype)
          `);
        if (salesError) throw new Error(`Error fetching sales: ${salesError.message}`);
        console.log('Sales data fetched:', sales);
        const items: StockItem[] = sales?.map((report: any) => ({
          id: report.salesreportid,
          name: report.products?.productname || `Product ${report.productid}`,
          quantity: report.closingcylinders || 0,
          unit: 'cyl',
          specifications: report.products?.producttype || 'Cylinder',
          category: report.products?.producttype || 'Cylinder',
          pricePerUnit: 10.00,
          supplierId: null,
          addedBy: 'system',
          dateAdded: report.reportdate || new Date().toISOString(),
          lastUpdated: report.reportdate || new Date().toISOString(),
          threshold: 5,
          barcode: null,
          imageUrl: null,
          productId: report.productid,
        })) || [];
        setStockItems(items);

        const { data: trans, error: transError } = await supabase
          .from('salesreports')
          .select(`
            salesreportid,
            productid,
            reportdate,
            salecylinders,
            salesunits,
            products(productname)
          `)
          .order('reportdate', { ascending: false })
          .limit(10);
        if (transError) throw new Error(`Error fetching transactions: ${transError.message}`);
        console.log('Transaction data fetched:', trans);
        const transData: Transaction[] = trans?.map((t: any) => ({
          id: t.salesreportid,
          timestamp: t.reportdate,
          productid: t.productid,
          productname: t.products?.productname || `Product ${t.productid}`,
          type: 'outbound',
          quantity: t.salecylinders || 0,
          userId: 'system',
          userName: 'System User',
          reason: 'Sale',
          transferredTo: 'Customer',
          department: 'Sales',
          notes: 'Standard sale transaction',
          status: 'completed',
          createdat: t.reportdate || new Date().toISOString(),
        })) || [];
        setTransactions(transData);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
        console.log('Data fetch completed. Loading:', loading, 'Error:', error);
      }
    };
    fetchData();
  }, []);

  const addStockItem = (item: Omit<StockItem, 'id' | 'lastUpdated' | 'dateAdded'>) => {
    const newItem: StockItem = {
      ...item,
      id: Math.floor(Math.random() * 1000000),
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    setStockItems(prev => [...prev, newItem]);
  };

  const updateStockItem = (id: number, updates: Partial<StockItem>) => {
    setStockItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates, lastUpdated: new Date().toISOString() } : item
    ));
  };

  const deleteStockItem = (id: number) => {
    setStockItems(prev => prev.filter(item => item.id !== id));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp' | 'createdat'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.floor(Math.random() * 1000000),
      timestamp: new Date().toISOString(),
      createdat: new Date().toISOString(),
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const getSalesSummary = (): SalesSummary => {
    const totalCylinders = stockItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalSalesValue = transactions.reduce((sum, t) => sum + (t.quantity * 10), 0);
    const lowStockCylinders = stockItems.filter(item => item.quantity <= item.threshold).length;
    const recentSales = transactions.filter(t => 
      new Date(t.timestamp || '').getTime() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()
    ).reduce((sum, t) => sum + t.quantity, 0);
    
    const productSummary = Array.from(
      new Set(stockItems.map(item => item.name))
    ).map(name => ({
      name,
      value: stockItems.find(item => item.name === name)?.quantity || 0,
    }));

    return {
      totalItems: totalCylinders,
      totalValue: totalSalesValue,
      lowStockItems: lowStockCylinders,
      recentTransactions: recentSales,
      categorySummary: {},
      totalCylinders,
      lowStockCylinders,
      productSummary,
    };
  };

  const getLowStockItems = (): LowStockItem[] => {
    return stockItems
      .filter(item => item.quantity <= item.threshold)
      .map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        threshold: item.threshold,
      }));
  };

  const searchItems = (query: string): StockItem[] => {
    const lowercaseQuery = query.toLowerCase();
    return stockItems.filter(item =>
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.category.toLowerCase().includes(lowercaseQuery)
    );
  };

  return (
    <StockContext.Provider value={{
      stockItems,
      transactions,
      addStockItem,
      updateStockItem,
      deleteStockItem,
      addTransaction,
      getSalesSummary,
      getLowStockItems,
      searchItems,
      loading,
      error,
    }}>
      {children}
    </StockContext.Provider>
  );
};