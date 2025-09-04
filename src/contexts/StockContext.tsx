import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { StockItem, Transaction, SalesSummary, LowStockItem } from '../types';

interface StockContextType {
  stockItems: StockItem[];
  transactions: Transaction[];
  addStockItem: (item: Omit<StockItem, 'id' | 'lastUpdated' | 'dateAdded'>) => Promise<void>;
  updateStockItem: (id: number, updates: Partial<StockItem>, cylinderstockid?: number) => Promise<void>;
  deleteStockItem: (id: number, cylinderstockid?: number) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp' | 'createdat'>) => Promise<void>;
  getSalesSummary: () => SalesSummary;
  getLowStockItems: () => LowStockItem[];
  searchItems: (query: string) => StockItem[];
  fetchStockData: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const StockContext = createContext<StockContextType | null>(null);

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

  const fetchStockData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching stock data from cylinderstockproductwise...');
      const { data: stockData, error: stockError } = await supabase
        .from('cylinderstockproductwise')
        .select(`
          cylinderstockid,
          productid,
          transactiondate,
          physicalstock,
          products(productname, producttype, defaultunit)
        `)
        .order('transactiondate', { ascending: false });

      if (stockError) throw new Error(`Error fetching stock data: ${stockError.message}`);
      console.log('Stock data fetched:', stockData);

      const items: StockItem[] = stockData.reduce((acc: StockItem[], curr: any) => {
        const existing = acc.find(item => item.productId === curr.productid);
        if (!existing) {
          acc.push({
            id: curr.cylinderstockid,
            name: curr.products?.productname || `Product ${curr.productid}`,
            quantity: curr.physicalstock || 0,
            unit: curr.products?.defaultunit || 'cyl',
            specifications: curr.products?.producttype || 'Cylinder',
            category: curr.products?.producttype || 'Cylinder',
            pricePerUnit: 10.00,
            supplierId: null,
            addedBy: 'system',
            dateAdded: curr.transactiondate || new Date().toISOString(),
            lastUpdated: curr.transactiondate || new Date().toISOString(),
            threshold: 5,
            barcode: null,
            imageUrl: null,
            productId: curr.productid,
          });
        } else if (new Date(existing.lastUpdated) < new Date(curr.transactiondate)) {
          existing.id = curr.cylinderstockid;
          existing.quantity = curr.physicalstock;
          existing.lastUpdated = curr.transactiondate;
        }
        return acc;
      }, []);

      setStockItems(items);

      const { data: trans, error: transError } = await supabase
        .from('stocktransactions')
        .select(`
          id,
          productid,
          transactiondate,
          physicalstock,
          discrepancy_note,
          products(productname)
        `)
        .order('transactiondate', { ascending: false })
        .limit(10);

      if (transError) throw new Error(`Error fetching transactions: ${transError.message}`);
      console.log('Transaction data fetched:', trans);

      const transData: Transaction[] = trans?.map((t: any) => ({
        id: t.id,
        timestamp: t.transactiondate,
        productid: t.productid,
        productname: t.products?.productname || `Product ${t.productid}`,
        type: 'outbound',
        quantity: t.physicalstock || 0,
        userId: 'system',
        userName: 'System User',
        reason: 'Sale',
        transferredTo: 'Customer',
        department: 'N/A',
        notes: t.discrepancy_note || 'Standard transaction',
        status: 'completed',
        createdat: t.transactiondate || new Date().toISOString(),
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

  useEffect(() => {
    fetchStockData();

    // Set up real-time subscription for cylinderstockproductwise
    const subscription = supabase
      .channel('cylinderstockproductwise-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cylinderstockproductwise',
        },
        () => {
          console.log('Detected change in cylinderstockproductwise, refetching data...');
          fetchStockData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const addStockItem = async (item: Omit<StockItem, 'id' | 'lastUpdated' | 'dateAdded'>) => {
    const newItem: StockItem = {
      ...item,
      id: Math.floor(Math.random() * 1000000),
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    setStockItems(prev => [...prev, newItem]);

    // Insert into stocktransactions
    const transactionData = {
      productid: item.productId,
      transactiondate: new Date().toISOString().split('T')[0],
      stocktype: 'Cylinder',
      openingbalance: item.quantity || 0,
      purchase: 0,
      sales: 0,
      ownuse: 0,
      physicalstock: item.quantity || 0,
      discrepancy_note: null,
      createdat: new Date().toISOString(),
    };
    const { error } = await supabase.from('stocktransactions').insert(transactionData);
    if (error) console.error('Error inserting stock transaction:', error.message);

    await fetchStockData(); // Refresh data
  };

  const updateStockItem = async (id: number, updates: Partial<StockItem>, cylinderstockid?: number) => {
    setStockItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, ...updates, lastUpdated: new Date().toISOString() } : item
      )
    );

    if (cylinderstockid) {
      // Update stocktransactions
      const transactionData = {
        productid: updates.productId || stockItems.find(item => item.id === id)?.productId,
        transactiondate: new Date().toISOString().split('T')[0],
        stocktype: 'Cylinder',
        openingbalance: stockItems.find(item => item.id === id)?.quantity || 0,
        purchase: 0,
        sales: 0,
        ownuse: 0,
        physicalstock: updates.quantity || 0,
        discrepancy_note: updates.discrepancyNote || null,
        createdat: new Date().toISOString(),
      };
      const { error: transError } = await supabase.from('stocktransactions').insert(transactionData);
      if (transError) console.error('Error inserting stock transaction:', transError.message);

      // Update salesreports
      const salesReportData = {
        productid: updates.productId || stockItems.find(item => item.id === id)?.productId,
        reportdate: new Date().toISOString().split('T')[0],
        openingcylinders: stockItems.find(item => item.id === id)?.quantity || 0,
        purchasecylinders: 0,
        salecylinders: 0,
        stocktransfercylinders: 0,
        closingcylinders: updates.quantity || 0,
        physicalcylinders: updates.quantity || 0,
        createdat: new Date().toISOString(),
      };
      const { error: salesError } = await supabase.from('salesreports').insert(salesReportData);
      if (salesError) console.error('Error inserting sales report:', salesError.message);
    }

    await fetchStockData(); // Refresh data
  };

  const deleteStockItem = async (id: number, cylinderstockid?: number) => {
    setStockItems(prev => prev.filter(item => item.id !== id));

    if (cylinderstockid) {
      const { error } = await supabase
        .from('cylinderstockproductwise')
        .delete()
        .eq('cylinderstockid', cylinderstockid);
      if (error) console.error('Error deleting cylinder stock:', error.message);
    }

    await fetchStockData(); // Refresh data
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'timestamp' | 'createdat'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.floor(Math.random() * 1000000),
      timestamp: new Date().toISOString(),
      createdat: new Date().toISOString(),
    };
    setTransactions(prev => [...prev, newTransaction]);

    const transactionData = {
      productid: transaction.productid,
      transactiondate: newTransaction.timestamp.split('T')[0],
      stocktype: 'Cylinder',
      openingbalance: stockItems.find(item => item.productId === transaction.productid)?.quantity || 0,
      purchase: 0,
      sales: transaction.reason === 'Sales' ? transaction.quantity : 0,
      ownuse: transaction.reason === 'OwnUse' ? transaction.quantity : 0,
      physicalstock: stockItems.find(item => item.productId === transaction.productid)?.quantity || 0 - transaction.quantity,
      discrepancy_note: transaction.notes || null,
      createdat: newTransaction.createdat,
    };
    const { error } = await supabase.from('stocktransactions').insert(transactionData);
    if (error) console.error('Error inserting transaction:', error.message);

    await fetchStockData(); // Refresh data
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
      fetchStockData,
      loading,
      error,
    }}>
      {children}
    </StockContext.Provider>
  );
};