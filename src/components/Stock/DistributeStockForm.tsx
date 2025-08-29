// components/DistributeStock/DistributeStockForm.tsx
import React, { useState, useEffect } from 'react';
import { Send, Search, AlertCircle } from 'lucide-react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';

const DistributeStockForm: React.FC = () => {
  const { addTransaction, departments } = useStock();
  const { user } = useAuth();
  
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    quantity: 0,
    transactionDate: new Date().toISOString().split('T')[0],
    stockType: 'Cylinder',
    transferredTo: '',
    department: '',
    reason: 'Sales',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [latestBalance, setLatestBalance] = useState<number>(0);

  const reasons = ['Sales', 'OwnUse'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('productid', { ascending: true });
    if (error) {
      console.error('Error fetching products:', error.message);
    } else {
      setProducts(data || []);
    }
  };

  const fetchLatestBalance = async (productId: number) => {
    const { data, error } = await supabase
      .from('stocktransactions')
      .select('closingbalance')
      .eq('productid', productId)
      .order('transactiondate', { ascending: false })
      .limit(1);
    if (error) {
      console.error('Error fetching latest balance:', error.message);
    } else if (data && data.length > 0) {
      setLatestBalance(data[0].closingbalance);
    } else {
      setLatestBalance(0);
    }
  };

  const filteredItems = products.filter(item =>
    item.productname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.producttype.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleItemSelect = async (item: any) => {
    setSelectedItem(item);
    setSearchQuery(item.productname);
    await fetchLatestBalance(item.productid);
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
      alert('Please select a product');
      return;
    }

    if (formData.quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (formData.quantity > latestBalance) {
      alert('Quantity exceeds available stock');
      return;
    }

    if (!formData.transferredTo.trim() && formData.reason === 'Sales') {
      alert('Please specify who/where the stock is being transferred to');
      return;
    }

    setIsSubmitting(true);

    try {
      const needsApproval = formData.quantity > 50;
      
      const transactionData = {
        productid: selectedItem.productid,
        transactiondate: formData.transactionDate,
        stocktype: formData.stockType,
        openingbalance: latestBalance,
        purchase: 0,
        sales: formData.reason === 'Sales' ? formData.quantity : 0,
        ownuse: formData.reason === 'OwnUse' ? formData.quantity : 0,
        physicalstock: latestBalance - formData.quantity,
        discrepancyNote: formData.notes || null,
        createdat: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('stocktransactions')
        .insert(transactionData);

      if (error) {
        throw new Error(error.message);
      }

      addTransaction({
        productid: selectedItem.productid,
        productname: selectedItem.productname,
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

      setSelectedItem(null);
      setSearchQuery('');
      setFormData({
        quantity: 0,
        transactionDate: new Date().toISOString().split('T')[0],
        stockType: 'Cylinder',
        transferredTo: '',
        department: '',
        reason: 'Sales',
        notes: '',
      });
      setLatestBalance(0);

      alert(needsApproval 
        ? 'Distribution request submitted for approval'
        : 'Stock distributed successfully!'
      );
      fetchProducts();
    } catch (error) {
      console.error('Error distributing stock:', error);
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
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Product *
            </label>
            {/* Dropdown for all products */}
            <select
              value={selectedItem ? selectedItem.productname : ''}
              onChange={(e) => {
                const selectedProduct = products.find(p => p.productname === e.target.value);
                if (selectedProduct) handleItemSelect(selectedProduct);
              }}
              className="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a product</option>
              {products.map((item) => (
                <option key={item.productid} value={item.productname}>
                  {item.productname} ({item.producttype})
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Search for products to distribute..."
              />
            </div>
            
            {searchQuery && !selectedItem && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <button
                      key={item.productid}
                      type="button"
                      onClick={() => handleItemSelect(item)}
                      className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.productname}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Type: {item.producttype} | Unit: {item.defaultunit}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="p-3 text-gray-500 dark:text-gray-400">No products found</p>
                )}
              </div>
            )}

            {selectedItem && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">{selectedItem.productname}</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Type: {selectedItem.producttype} | Unit: {selectedItem.defaultunit} | Available: {latestBalance}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(null);
                      setSearchQuery('');
                      setLatestBalance(0);
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
                    max={latestBalance}
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Maximum available: {latestBalance} {selectedItem.defaultunit}
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
                    Transaction Date *
                  </label>
                  <input
                    type="date"
                    name="transactionDate"
                    value={formData.transactionDate}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stock Type *
                  </label>
                  <select
                    name="stockType"
                    value={formData.stockType}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Cylinder">Cylinder</option>
                    <option value="Spare">Spare</option>
                  </select>
                </div>

                {formData.reason === 'Sales' && (
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
                      placeholder="Customer name or entity"
                    />
                  </div>
                )}

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
                  Discrepancy Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Any discrepancies or additional information..."
                />
              </div>

              {/* Distribution Summary */}
              {formData.quantity > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Distribution Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Product:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedItem.productname}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{formData.quantity} {selectedItem.defaultunit}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Remaining Stock:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {latestBalance - formData.quantity} {selectedItem.defaultunit}
                      </span>
                    </div>
                  </div>

                  {/* Approval Warning */}
                  {(formData.quantity > 50) && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg flex items-center">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                      <span className="text-sm text-yellow-800 dark:text-yellow-200">
                        This distribution requires admin approval due to high quantity.
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