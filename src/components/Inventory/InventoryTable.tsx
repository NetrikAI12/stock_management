import React, { useState } from 'react';
import { Edit, Trash2, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../contexts/AuthContext';
import { StockItem } from '../../types';
import EditStockModal from './EditStockModal';

interface InventoryTableProps {
  searchQuery: string;
  dateRange: { start: string; end: string };
  selectedProduct: number | 'all';
  onRefetch: () => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ searchQuery, dateRange, selectedProduct, onRefetch }) => {
  const { stockItems, searchItems, deleteStockItem, updateStockItem } = useStock();
  const { user } = useAuth();
  const [sortField, setSortField] = useState<keyof StockItem>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);

  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  const filteredItems = searchQuery
    ? searchItems(searchQuery)
    : stockItems.filter((item: StockItem) => {
        const itemDate = new Date(item.lastUpdated).toISOString().split('T')[0];
        const isInDateRange = itemDate >= dateRange.start && itemDate <= dateRange.end;
        const isProductMatch = selectedProduct === 'all' || item.productId === selectedProduct;
        return isInDateRange && isProductMatch;
      });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  const handleSort = (field: keyof StockItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteStockItem(id);
      onRefetch();
    }
  };

  const handleEdit = (item: StockItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const getStockStatus = (item: StockItem) => {
    if (item.quantity === 0) {
      return { status: 'out', color: 'red', icon: AlertTriangle, label: 'Out of Stock' };
    } else if (item.quantity <= item.threshold) {
      return { status: 'low', color: 'yellow', icon: AlertTriangle, label: 'Low Stock' };
    } else {
      return { status: 'good', color: 'green', icon: CheckCircle, label: 'In Stock' };
    }
  };

  if (sortedItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {searchQuery ? 'No items found' : 'No inventory items'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {searchQuery ? 'Try adjusting your search terms' : 'Start by adding your first inventory item'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('name')}
                >
                  Item Name
                  {sortField === 'name' && <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('category')}
                >
                  Type
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('quantity')}
                >
                  Cylinders
                  {sortField === 'quantity' && <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('pricePerUnit')}
                >
                  Unit Price
                  {sortField === 'pricePerUnit' && <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Updated</th>
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedItems.map((item) => {
                const stockStatus = getStockStatus(item);
                const StatusIcon = stockStatus.icon;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.imageUrl && <img className="h-10 w-10 rounded-lg object-cover mr-3" src={item.imageUrl} alt={item.name} />}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                          {item.discrepancyNote && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">#{item.discrepancyNote}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{item.quantity} {item.unit}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Threshold: {item.threshold}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          stockStatus.color === 'green'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : stockStatus.color === 'yellow'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${item.pricePerUnit.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${(item.quantity * item.pricePerUnit).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(item.lastUpdated).toLocaleDateString()}</td>
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2 justify-end">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <EditStockModal isOpen={isEditModalOpen} onClose={handleCloseModal} item={selectedItem} onUpdate={onRefetch} />
    </>
  );
};

export default InventoryTable;