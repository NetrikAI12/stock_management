import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { StockItem, Transaction, Supplier, Department, StockSummary } from '../types';

interface StockContextType {
  stockItems: StockItem[];
  transactions: Transaction[];
  suppliers: Supplier[];
  departments: Department[];
  addStockItem: (item: Omit<StockItem, 'id' | 'dateAdded' | 'lastUpdated'>) => void;
  updateStockItem: (id: string, updates: Partial<StockItem>) => void;
  deleteStockItem: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  getStockSummary: () => StockSummary;
  getLowStockItems: () => StockItem[];
  searchItems: (query: string) => StockItem[];
}

const StockContext = createContext<StockContextType | null>(null);

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};

// Mock initial data for stock items, transactions, and departments
const initialStockItems: StockItem[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174004',
    name: 'Laptop Dell XPS 13',
    quantity: 45,
    unit: 'pieces',
    specifications: 'Intel i7, 16GB RAM, 512GB SSD, 13.3" Display',
    category: 'Electronics',
    pricePerUnit: 1299.99,
    supplierId: '123e4567-e89b-12d3-a456-426614174000',
    addedBy: 'admin',
    dateAdded: '2024-01-15',
    lastUpdated: '2024-01-20',
    threshold: 10,
    barcode: '1234567890123',
    imageUrl: 'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174005',
    name: 'Office Chair Ergonomic',
    quantity: 28,
    unit: 'pieces',
    specifications: 'Adjustable height, lumbar support, breathable mesh',
    category: 'Furniture',
    pricePerUnit: 299.99,
    supplierId: '123e4567-e89b-12d3-a456-426614174001',
    addedBy: 'staff',
    dateAdded: '2024-01-10',
    lastUpdated: '2024-01-18',
    threshold: 5,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174006',
    name: 'Printer Paper A4',
    quantity: 8,
    unit: 'reams',
    specifications: '80gsm, 500 sheets per ream, white',
    category: 'Consumables',
    pricePerUnit: 12.99,
    supplierId: '123e4567-e89b-12d3-a456-426614174002',
    addedBy: 'staff',
    dateAdded: '2024-01-12',
    lastUpdated: '2024-01-22',
    threshold: 15,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174007',
    name: 'Wireless Mouse Logitech',
    quantity: 67,
    unit: 'pieces',
    specifications: 'Optical sensor, 2.4GHz wireless, 3 buttons',
    category: 'Electronics',
    pricePerUnit: 49.99,
    supplierId: '123e4567-e89b-12d3-a456-426614174000',
    addedBy: 'admin',
    dateAdded: '2024-01-08',
    lastUpdated: '2024-01-19',
    threshold: 20,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174008',
    name: 'Coffee Beans Premium',
    quantity: 15,
    unit: 'kg',
    specifications: 'Arabica beans, medium roast, organic certified',
    category: 'Consumables',
    pricePerUnit: 24.99,
    supplierId: '123e4567-e89b-12d3-a456-426614174003',
    addedBy: 'staff',
    dateAdded: '2024-01-14',
    lastUpdated: '2024-01-21',
    threshold: 10,
  }
];

const initialTransactions: Transaction[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174009',
    itemId: '123e4567-e89b-12d3-a456-426614174004',
    itemName: 'Laptop Dell XPS 13',
    type: 'inbound',
    quantity: 50,
    userId: '123e4567-e89b-12d3-a456-426614174010',
    userName: 'John Admin',
    timestamp: '2024-01-15T10:30:00Z',
    supplierName: 'TechCorp Solutions',
    invoiceNumber: 'INV-2024-001',
    cost: 64999.50,
    status: 'completed',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174011',
    itemId: '123e4567-e89b-12d3-a456-426614174004',
    itemName: 'Laptop Dell XPS 13',
    type: 'outbound',
    quantity: 5,
    userId: '123e4567-e89b-12d3-a456-426614174012',
    userName: 'Jane Staff',
    timestamp: '2024-01-20T14:15:00Z',
    reason: 'Department Transfer',
    transferredTo: 'Sales Department',
    department: 'Sales',
    status: 'completed',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174013',
    itemId: '123e4567-e89b-12d3-a456-426614174006',
    itemName: 'Printer Paper A4',
    type: 'outbound',
    quantity: 12,
    userId: '123e4567-e89b-12d3-a456-426614174012',
    userName: 'Jane Staff',
    timestamp: '2024-01-22T09:45:00Z',
    reason: 'Office Use',
    transferredTo: 'HR Department',
    department: 'HR',
    status: 'completed',
  }
];

const initialDepartments: Department[] = [
  { id: '123e4567-e89b-12d3-a456-426614174014', name: 'Sales', head: 'Tom Anderson', location: 'Floor 2, East Wing' },
  { id: '123e4567-e89b-12d3-a456-426614174015', name: 'HR', head: 'Emma Thompson', location: 'Floor 1, West Wing' },
  { id: '123e4567-e89b-12d3-a456-426614174016', name: 'IT', head: 'Alex Rodriguez', location: 'Floor 3, North Wing' },
  { id: '123e4567-e89b-12d3-a456-426614174017', name: 'Finance', head: 'Maria Davis', location: 'Floor 1, East Wing' },
];

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [departments] = useState<Department[]>(initialDepartments);

  // Fetch suppliers from Supabase on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data, error } = await supabase.from('suppliers').select('*');
      if (error) {
        console.error('Error fetching suppliers:', error);
      } else {
        setSuppliers(data);
      }
    };
    fetchSuppliers();
  }, []);

  useEffect(() => {
    // Load data from localStorage or use initial data
    const storedItems = localStorage.getItem('stockItems');
    const storedTransactions = localStorage.getItem('transactions');
    
    if (storedItems) {
      setStockItems(JSON.parse(storedItems));
    } else {
      setStockItems(initialStockItems);
    }
    
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    } else {
      setTransactions(initialTransactions);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('stockItems', JSON.stringify(stockItems));
  }, [stockItems]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addStockItem = (item: Omit<StockItem, 'id' | 'dateAdded' | 'lastUpdated'>) => {
    const newItem: StockItem = {
      ...item,
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    setStockItems(prev => [...prev, newItem]);
  };

  const updateStockItem = (id: string, updates: Partial<StockItem>) => {
    setStockItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, ...updates, lastUpdated: new Date().toISOString() }
        : item
    ));
  };

  const deleteStockItem = (id: string) => {
    setStockItems(prev => prev.filter(item => item.id !== id));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    
    setTransactions(prev => [...prev, newTransaction]);
    
    // Update stock quantity
    if (transaction.status === 'completed') {
      setStockItems(prev => prev.map(item => {
        if (item.id === transaction.itemId) {
          const quantityChange = transaction.type === 'inbound' 
            ? transaction.quantity 
            : -transaction.quantity;
          return {
            ...item,
            quantity: Math.max(0, item.quantity + quantityChange),
            lastUpdated: new Date().toISOString(),
          };
        }
        return item;
      }));
    }
  };

  const getStockSummary = (): StockSummary => {
    const totalItems = stockItems.length;
    const totalValue = stockItems.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
    const lowStockItems = stockItems.filter(item => item.quantity <= item.threshold).length;
    const recentTransactions = transactions.filter(
      t => new Date(t.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    const categorySummary = stockItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.quantity;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalItems,
      totalValue,
      lowStockItems,
      recentTransactions,
      categorySummary,
    };
  };

  const getLowStockItems = (): StockItem[] => {
    return stockItems.filter(item => item.quantity <= item.threshold);
  };

  const searchItems = (query: string): StockItem[] => {
    const lowercaseQuery = query.toLowerCase();
    return stockItems.filter(item =>
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.category.toLowerCase().includes(lowercaseQuery) ||
      item.specifications.toLowerCase().includes(lowercaseQuery)
    );
  };

  return (
    <StockContext.Provider value={{
      stockItems,
      transactions,
      suppliers,
      departments,
      addStockItem,
      updateStockItem,
      deleteStockItem,
      addTransaction,
      getStockSummary,
      getLowStockItems,
      searchItems,
    }}>
      {children}
    </StockContext.Provider>
  );
};