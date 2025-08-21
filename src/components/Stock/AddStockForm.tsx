import React, { useState } from 'react';
import { Save, Scan, ChevronDown } from 'lucide-react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';

const AddStockForm: React.FC = () => {
  const { addStockItem, suppliers } = useStock();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    unit: 'pieces',
    specifications: '',
    category: 'Electronics',
    pricePerUnit: 0,
    supplierId: '',
    threshold: 10,
    barcode: '',
    image_url: '',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const categories = [
    'Electronics',
    'Furniture', 
    'Consumables',
    'Tools',
    'Office Supplies',
    'Safety Equipment'
  ];

  const units = [
    'pieces',
    'kg', 
    'liters',
    'meters',
    'boxes',
    'reams',
    'bottles',
    'custom'
  ];

  const [categorySearch, setCategorySearch] = useState(formData.category);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCategorySelect = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
    setCategorySearch(category);
    setShowCategoryDropdown(false);
  };

  const handleCategoryBlur = () => {
    setTimeout(() => {
      const matched = categories.find(cat => cat.toLowerCase() === categorySearch.toLowerCase());
      if (matched) {
        setFormData(prev => ({ ...prev, category: matched }));
        setCategorySearch(matched);
      } else {
        setCategorySearch(formData.category);
      }
      setShowCategoryDropdown(false);
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter an item name');
      return;
    }

    try {
      // Insert into Supabase database
      const { data, error } = await supabase
        .from('stockitems')
        .insert([{
          name: formData.name,
          quantity: formData.quantity,
          unit: formData.unit,
          specifications: formData.specifications || null,
          category: formData.category,
          price_per_unit: formData.pricePerUnit,
          supplier_id: formData.supplierId || null,
          added_by: user?.username || 'unknown',
          threshold: formData.threshold,
          barcode: formData.barcode || null,
          image_url: formData.image_url || null,
        }]);

      if (error) {
        console.error('Error inserting stock item:', error);
        alert(`Failed to add item: ${error.message}`);
        return;
      }

      // Update local context
      addStockItem({
        ...formData,
        addedBy: user?.username || 'unknown',
      });

      // Reset form
      setFormData({
        name: '',
        quantity: 0,
        unit: 'pieces',
        specifications: '',
        category: 'Electronics',
        pricePerUnit: 0,
        supplierId: '',
        threshold: 10,
        barcode: '',
        image_url: '',
      });
      setCategorySearch('Electronics');
      
      setCurrentStep(1);
      alert('Item added successfully!');
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred while adding the item');
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBarcodeRead = () => {
    // Mock barcode functionality
    const mockBarcode = Math.random().toString().substr(2, 13);
    setFormData(prev => ({ ...prev, barcode: mockBarcode }));
    alert(`Barcode scanned: ${mockBarcode}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add New Stock Item
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Step {currentStep} of {totalSteps}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i + 1}
              className={`flex items-center ${i < totalSteps - 1 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  i + 1 <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                }`}
              >
                {i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    i + 1 < currentStep
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Basic Info</span>
          <span>Details & Pricing</span>
          <span>Review & Submit</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter item name"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => {
                    setCategorySearch(e.target.value);
                    setShowCategoryDropdown(true);
                  }}
                  onFocus={() => setShowCategoryDropdown(true)}
                  onBlur={handleCategoryBlur}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Search or select category"
                />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                {showCategoryDropdown && (
                  <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-sm">
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map(category => (
                        <div
                          key={category}
                          className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white"
                          onClick={() => handleCategorySelect(category)}
                        >
                          {category}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-gray-500 dark:text-gray-400">No matching categories</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Initial Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Unit *
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Barcode
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter or scan barcode"
                />
                <button
                  type="button"
                  onClick={handleBarcodeRead}
                  className="px-4 py-3 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 flex items-center"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Scan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Details & Pricing */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Details & Pricing
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Specifications
              </label>
              <textarea
                name="specifications"
                value={formData.specifications}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Detailed description, features, model numbers, etc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price per Unit *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                  <input
                    type="number"
                    name="pricePerUnit"
                    value={formData.pricePerUnit}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full pl-8 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Low Stock Threshold *
                </label>
                <input
                  type="number"
                  name="threshold"
                  value={formData.threshold}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Supplier
              </label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Review & Submit
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Name:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Category:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.category}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Quantity:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.quantity} {formData.unit}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Unit Price:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">${formData.pricePerUnit}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Total Value:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">${(formData.quantity * formData.pricePerUnit).toFixed(2)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Threshold:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.threshold} {formData.unit}</span>
                </div>
              </div>
              
              {formData.specifications && (
                <div className="mt-4">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Specifications:</span>
                  <p className="mt-1 text-gray-900 dark:text-white">{formData.specifications}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Add Item
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddStockForm;