import React, { useState } from 'react';
import { Send, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../contexts/AuthContext';
import { StockItem } from '../../types';

const DistributeStockForm: React.FC = () => {
  const { stockItems, departments, addTransaction } = useStock();
  const { user } = useAuth();
  
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    quantity: 0,
    transferredTo: '',
    department: '',
    reason: 'Internal Use',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    'Internal Use',
    'Sale',
    'Department Transfer',
    'Project Allocation',
    'Maintenance',
    'Return',
    'Loss/Damage',
    'Other'
  ];

  const filteredItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleItemSelect = (item: StockItem) => {
    setSelectedItem(item);
    setSearchQuery(item.name);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem) {
      alert('Please select an item');
      return;
    }

    if (formData.quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (formData.quantity > selectedItem.quantity) {
      alert('Quantity exceeds available stock');
      return;
    }

    if (!formData.transferredTo.trim()) {
      alert('Please specify who/where the stock is being transferred to');
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine if approval is needed (e.g., high value or quantity)
      const needsApproval = formData.quantity > 50 || (formData.quantity * selectedItem.pricePerUnit) > 1000;
      
      addTransaction({
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        type: 'outbound',
        quantity: formData.quantity,
        userId: user?.id || 'unknown',
        userName: user?.firstName + ' ' + user?.lastName || 'Unknown User',
        reason: formData.reason,
        transferredTo: formData.transferredTo,
        department: formData.department,
        notes: formData.notes,
        status: needsApproval ? 'pending' : 'completed',
      });

      // Reset form
      setSelectedItem(null);
      setSearchQuery('');
      setFormData({
        quantity: 0,
        transferredTo: '',
        department: '',
        reason: 'Internal Use',
        notes: '',
      });

      alert(needsApproval 
        ? 'Distribution request submitted for approval'
        : 'Stock distributed successfully!'
      );
    } catch (error) {
      alert('Error distributing stock. Please try again.');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Distribute Stock
      </h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Item *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Search for items to distribute..."
              />
            </div>
            
            {searchQuery && !selectedItem && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemSelect(item)}
                      className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Available: {item.quantity} {item.unit} | Category: {item.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            ${item.pricePerUnit}/unit
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="p-3 text-gray-500 dark:text-gray-400">No items found</p>
                )}
              </div>
            )}

            {selectedItem && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">{selectedItem.name}</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Available: {selectedItem.quantity} {selectedItem.unit} | 
                      Unit Price: ${selectedItem.pricePerUnit}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(null);
                      setSearchQuery('');
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedItem && (
            <>
              {/* Distribution Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity to Distribute *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    max={selectedItem.quantity}
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Maximum available: {selectedItem.quantity} {selectedItem.unit}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason *
                  </label>
                  <select
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {reasons.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transferred To *
                  </label>
                  <input
                    type="text"
                    name="transferredTo"
                    value={formData.transferredTo}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Person name, employee ID, or external entity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Any additional information about this distribution..."
                />
              </div>

              {/* Distribution Summary */}
              {formData.quantity > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Distribution Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Item:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedItem.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{formData.quantity} {selectedItem.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Value:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        ${(formData.quantity * selectedItem.pricePerUnit).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Remaining Stock:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedItem.quantity - formData.quantity} {selectedItem.unit}
                      </span>
                    </div>
                  </div>

                  {/* Approval Warning */}
                  {(formData.quantity > 50 || (formData.quantity * selectedItem.pricePerUnit) > 1000) && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg flex items-center">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                      <span className="text-sm text-yellow-800 dark:text-yellow-200">
                        This distribution requires admin approval due to high quantity or value.
                      </span>
                    </div>
                  )}

                  {/* Low Stock Warning */}
                  {(selectedItem.quantity - formData.quantity) <= selectedItem.threshold && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                      <span className="text-sm text-red-800 dark:text-red-200">
                        Warning: This will bring stock below the threshold ({selectedItem.threshold} {selectedItem.unit}).
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || formData.quantity <= 0}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  'Processing...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Distribute Stock
                  </>
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default DistributeStockForm;