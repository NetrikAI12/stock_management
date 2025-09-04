import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, Plus, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useStock } from '../../contexts/StockContext';
import InventoryTable from './InventoryTable';
import AddStockModal from '../Inventory/AddStockModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { supabase } from '../../supabaseClient';

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
  pricePerUnit: number;
  lastUpdated: string;
  discrepancyNote?: string;
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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const canAdd = user?.role === 'admin' || user?.role === 'staff';

  // Debounce fetchProductsAndStock to prevent rapid calls
  const debounce = <F extends (...args: any[]) => any>(func: F, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<F>): Promise<ReturnType<F>> => {
      clearTimeout(timeout);
      return new Promise((resolve) => {
        timeout = setTimeout(() => resolve(func(...args)), wait);
      });
    };
  };

  const fetchProductsAndStock = useCallback(
    debounce(async () => {
      setFetchError(null);
      try {
        // Fetch products
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('productid, productname, producttype, defaultunit');
        if (productError) throw new Error(`Error fetching products: ${productError.message}`);
        setProducts(
          productData?.map((p: any) => ({
            ProductID: p.productid,
            ProductName: p.productname,
            ProductType: p.producttype,
            DefaultUnit: p.defaultunit,
          })) || []
        );

        // Fetch stock data
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
        setFetchError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    }, 500),
    [fetchStockData, getLowStockItems, canAdd, addNotification]
  );

  useEffect(() => {
    fetchProductsAndStock();
  }, [fetchProductsAndStock]);

  const handleExport = (format: 'csv' | 'pdf') => {
    const sortedItems = stockItems
      .filter((item: StockItem) => {
        const itemDate = new Date(item.lastUpdated).toISOString().split('T')[0];
        const isInDateRange = itemDate >= dateRange.start && itemDate <= dateRange.end;
        const isProductMatch = selectedProduct === 'all' || item.productId === selectedProduct;
        return isInDateRange && isProductMatch;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!sortedItems.length) {
      alert('No data to export.');
      return;
    }

    try {
      if (format === 'csv') {
        const csvData = Papa.unparse(
          sortedItems.map((item) => ({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            threshold: item.threshold,
            pricePerUnit: item.pricePerUnit,
            lastUpdated: new Date(item.lastUpdated).toLocaleDateString(),
            discrepancyNote: item.discrepancyNote || '-',
            productId: item.productId || '',
          })),
          { header: true }
        );
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `inventory_${new Date().toISOString().split('T')[0]}.csv`);
      } else if (format === 'pdf') {
        const doc = new jsPDF();
        doc.text('Inventory Report - ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), 10, 10);
        autoTable(doc, {
          head: [['Name', 'Type', 'Quantity', 'Unit', 'Threshold', 'Unit Price', 'Last Updated', 'Discrepancy', 'Product ID']],
          body: sortedItems.map((item) => [
            item.name,
            item.category,
            item.quantity,
            item.unit,
            item.threshold,
            `$${item.pricePerUnit.toFixed(2)}`,
            new Date(item.lastUpdated).toLocaleDateString(),
            item.discrepancyNote || '-',
            item.productId || '',
          ]),
        });
        doc.save(`inventory_${new Date().toISOString().split('T')[0]}.pdf`);
      }
      alert(`${format.toUpperCase()} exported successfully!`);
    } catch (err) {
      console.error(`Error exporting ${format}:`, err);
      alert(`Failed to export ${format}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const result = Papa.parse(text, { header: true, skipEmptyLines: true });
      if (result.errors.length) {
        throw new Error(`CSV parsing error: ${result.errors[0].message}`);
      }
      const parsedData = result.data;

      if (!parsedData.length) {
        throw new Error('No valid data found in the uploaded CSV');
      }

      // Map parsed data to StockItem and upsert in database
      const itemsToUpsert = parsedData.map((row: any) => {
        // Parse date in various formats (e.g., MM/DD/YYYY, YYYY-MM-DD)
        let lastUpdated = row.lastUpdated;
        if (lastUpdated) {
          const dateObj = new Date(lastUpdated);
          if (!isNaN(dateObj.getTime())) {
            lastUpdated = dateObj.toISOString();
          } else {
            throw new Error(`Invalid date format for row with Name: ${row.name}`);
          }
        } else {
          lastUpdated = new Date().toISOString();
        }

        return {
          name: row.name || '',
          category: row.category || 'Unknown',
          quantity: Number(row.quantity) || 0,
          unit: row.unit || products.find((p) => p.ProductID === Number(row.productId))?.DefaultUnit || 'unit',
          threshold: Number(row.threshold) || 0,
          pricePerUnit: Number(row.pricePerUnit) || 0,
          lastUpdated,
          discrepancyNote: row.discrepancyNote && row.discrepancyNote !== '-' ? row.discrepancyNote : null,
          productId: Number(row.productId) || products.find((p) => p.ProductName === row.name)?.ProductID || null,
        };
      });

      // Validate data
      const invalidRows = itemsToUpsert.filter((row) => !row.name || row.quantity < 0 || row.pricePerUnit < 0);
      if (invalidRows.length) {
        throw new Error('Some rows have invalid Name, Quantity, or PricePerUnit');
      }

      // Upsert into stock table
      const { error } = await supabase.from('stock').upsert(itemsToUpsert, { onConflict: ['productId'] });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      await fetchProductsAndStock(); // Refresh frontend data
      alert('CSV imported successfully!');
    } catch (err) {
      console.error('Import error (CSV):', err);
      alert(`Failed to import CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const triggerImport = () => {
    csvInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImport(file);
      e.target.value = ''; // Reset file input
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

  if (loading || fetchError) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-600 dark:text-gray-400">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-2 animate-spin" />
          <p>{fetchError ? `Error: ${fetchError}` : 'Loading inventory data...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
        <div className="flex items-center space-x-3">
          <select
            onChange={(e) => {
              const format = e.target.value as 'csv' | 'pdf';
              if (format) handleExport(format);
              e.target.value = ''; // Reset dropdown
            }}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <option value="">Export</option>
            <option value="csv">Export to CSV</option>
            <option value="pdf">Export to PDF</option>
          </select>
          <button
            onClick={triggerImport}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Import CSV
          </button>
          <input
            type="file"
            ref={csvInputRef}
            onChange={onFileChange}
            accept=".csv"
            style={{ display: 'none' }}
          />
          {canAdd && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product</label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
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

      <div className="relative">
        <InventoryTable
          searchQuery={searchQuery}
          dateRange={dateRange}
          selectedProduct={selectedProduct}
          onRefetch={fetchProductsAndStock}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Stock Levels Chart</h3>
        {stockItems.length > 0 ? (
          <BarChart width={600} height={300} data={stockItems}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="quantity" fill="#8884d8" />
          </BarChart>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No data available for chart</p>
        )}
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