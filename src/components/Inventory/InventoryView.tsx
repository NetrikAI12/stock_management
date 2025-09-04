import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import InventoryTable from './InventoryTable';
import AddStockModal from '../Inventory/AddStockModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { useStock } from '../../contexts/StockContext';

interface Product {
  ProductID: number;
  ProductName: string;
  ProductType: string;
  DefaultUnit: string;
}

interface StockItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  threshold: number;
  lastUpdated: string;
  discrepancyNote: string;
  pricePerUnit: number;
  productId?: number;
}

const InventoryView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { stockItems, fetchStockData, getLowStockItems, loading, error } = useStock();
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedProduct, setSelectedProduct] = useState<number | 'all'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const canAdd = user?.role === 'admin' || user?.role === 'staff';

  useEffect(() => {
    fetchProductsAndStock();
  }, [user]);

  const fetchProductsAndStock = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchStockData();

      if (canAdd) {
        const lowStock = getLowStockItems();
        lowStock.forEach((item) => {
          addNotification({
            type: 'stock',
            message: `Low stock alert: ${item.name} has ${item.quantity} ${item.unit} remaining`,
          });
        });
      }
    } catch (err) {
      console.error('Error in fetchProductsAndStock:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    const sortedItems = stockItems.filter((item: StockItem) => {
      const itemDate = new Date(item.lastUpdated).toISOString().split('T')[0];
      const isInDateRange = itemDate >= dateRange.start && itemDate <= dateRange.end;
      const isProductMatch = selectedProduct === 'all' || item.productId === selectedProduct;
      return isInDateRange && isProductMatch;
    }).sort((a, b) => a.name.localeCompare(b.name));

    if (format === 'csv') {
      const csvData = Papa.unparse(sortedItems.map(item => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        threshold: item.threshold,
        pricePerUnit: item.pricePerUnit,
        lastUpdated: new Date(item.lastUpdated).toLocaleDateString(),
      })));
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `inventory_${new Date().toISOString().split('T')[0]}.csv`);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text('Inventory Report - ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), 10, 10);
      doc.autoTable({
        head: [['Name', 'Type', 'Quantity', 'Unit', 'Threshold', 'Unit Price', 'Last Updated']],
        body: sortedItems.map(item => [
          item.name,
          item.category,
          item.quantity,
          item.unit,
          item.threshold,
          `$${item.pricePerUnit.toFixed(2)}`,
          new Date(item.lastUpdated).toLocaleDateString(),
        ]),
      });
      doc.save(`inventory_${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  if (!user) {
    return <div className="text-center text-red-600 dark:text-red-400">Please log in to view this page.</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-600 dark:text-gray-400">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-2 animate-spin" />
          <p>Loading inventory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-red-600 dark:text-red-400">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-2" />
          <p>Error: {error}. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Inventory Management
        </h1>
        <div className="flex items-center space-x-3">
          <select
            onChange={(e) => handleExport(e.target.value as 'csv' | 'pdf')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <option value="">Export</option>
            <option value="csv">Export to CSV</option>
            <option value="pdf">Export to PDF</option>
          </select>
          {canAdd && (
            <button onClick={handleOpenAddModal} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items by name, type, or specifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Products</option>
                {products.length > 0 ? (
                  products.map((product: Product) => (
                    <option key={product.ProductID} value={product.ProductID}>
                      {product.ProductName}
                    </option>
                  ))
                ) : (
                  <option disabled>No products available</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      <InventoryTable searchQuery={searchQuery} dateRange={dateRange} selectedProduct={selectedProduct} onRefetch={fetchProductsAndStock} />

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Stock Levels Chart</h3>
        <BarChart width={600} height={300} data={stockItems}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="quantity" fill="#8884d8" />
        </BarChart>
      </div>

      <AddStockModal 
        isOpen={isAddModalOpen} 
        onClose={handleCloseAddModal} 
        onAdd={fetchProductsAndStock} 
      />
    </div>
  );
};

export default InventoryView;