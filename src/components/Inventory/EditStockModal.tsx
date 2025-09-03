// components/InventoryTable/EditStockModal.tsx
import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { StockItem } from '../../types';

interface EditStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StockItem | null;
  onUpdate: () => void; // Refetch callback
}

const EditStockModal: React.FC<EditStockModalProps> = ({ isOpen, onClose, item, onUpdate }) => {
  const [formData, setFormData] = useState<StockItem | null>(null);

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => prev ? ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !item) return;

    try {
      // Update in Supabase (assuming table is 'stockitems' - adjust if different)
      const { error } = await supabase
        .from('stockitems')
        .update({
          name: formData.name,
          category: formData.category,
          quantity: formData.quantity,
          pricePerUnit: formData.pricePerUnit,
          threshold: formData.threshold,
          lastUpdated: new Date().toISOString(),
          // Add other fields if needed
        })
        .eq('id', item.id);

      if (error) throw error;

      alert('Item updated successfully!');
      onUpdate(); // Refetch data
      onClose(); // Close modal
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Failed to update item: ' + (err as Error).message);
    }
  };

  if (!isOpen || !formData) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Item</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Item Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unit Price</label>
            <input
              type="number"
              name="pricePerUnit"
              value={formData.pricePerUnit}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Threshold</label>
            <input
              type="number"
              name="threshold"
              value={formData.threshold}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          {/* Add more fields as needed */}
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center">
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStockModal;