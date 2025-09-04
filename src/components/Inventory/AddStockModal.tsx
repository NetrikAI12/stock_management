import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { StockItem } from '../../types';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
}

const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState<Partial<StockItem>>({
    name: '',
    category: '',
    quantity: 0,
    unit: 'units',
    threshold: 10,
    lastUpdated: new Date('2025-09-03T11:39:00+05:30').toISOString(), // Current date and time
    discrepancyNote: '',
    pricePerUnit: 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || formData.quantity <= 0 || !formData.unit) {
      alert('Please fill all required fields and ensure quantity is positive.');
      return;
    }

    try {
      const { error } = await supabase
        .from('stockitems')
        .insert({
          name: formData.name,
          category: formData.category,
          quantity: formData.quantity,
          unit: formData.unit,
          threshold: formData.threshold,
          lastUpdated: formData.lastUpdated,
          discrepancyNote: formData.discrepancyNote || '',
          pricePerUnit: formData.pricePerUnit || 0,
          productId: Math.floor(Math.random() * 1000) + 1, // Mock productId - replace with actual logic
        });

      if (error) throw error;

      alert('Item added successfully!');
      onAdd();
      onClose();
    } catch (err) {
      console.error('Error adding item:', err);
      alert('Failed to add item: ' + (err as Error).message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Item</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Item Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type *</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity *</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="1"
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unit *</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="units">Units</option>
              <option value="cyl">Cylinders</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Threshold</label>
            <input
              type="number"
              name="threshold"
              value={formData.threshold}
              onChange={handleInputChange}
              min="0"
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
              step="0.01"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discrepancy Note</label>
            <input
              type="text"
              name="discrepancyNote"
              value={formData.discrepancyNote || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockModal;