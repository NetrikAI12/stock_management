import React, { useState, useEffect } from 'react';
import { Save, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';

const AddStockForm: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    productName: '',
    productType: 'Medical',
    defaultUnit: 'Cylinders',
    description: '',
    openingBalance: 0,
    cylindersReceived: 0,
    cylindersDelivered: 0,
    cylindersSold: 0,
    cylindersConverted: 0,
    physicalStock: 0,
    threshold: 5,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  const productTypes = ['Medical', 'Industrial'];

  const [productTypeSearch, setProductTypeSearch] = useState(formData.productType);
  const [showProductTypeDropdown, setShowProductTypeDropdown] = useState(false);

  const filteredProductTypes = productTypes.filter(type =>
    type.toLowerCase().includes(productTypeSearch.toLowerCase())
  );

  useEffect(() => {
    // Calculate physicalStock based on other fields
    const newPhysicalStock =
      formData.openingBalance +
      formData.cylindersReceived -
      (formData.cylindersDelivered + formData.cylindersSold + formData.cylindersConverted);
    setFormData(prev => ({ ...prev, physicalStock: newPhysicalStock >= 0 ? newPhysicalStock : 0 }));
  }, [
    formData.openingBalance,
    formData.cylindersReceived,
    formData.cylindersDelivered,
    formData.cylindersSold,
    formData.cylindersConverted,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleProductTypeSelect = (type: string) => {
    setFormData(prev => ({ ...prev, productType: type }));
    setProductTypeSearch(type);
    setShowProductTypeDropdown(false);
  };

  const handleProductTypeBlur = () => {
    setTimeout(() => {
      const matched = productTypes.find(type => type.toLowerCase() === productTypeSearch.toLowerCase());
      if (matched) {
        setFormData(prev => ({ ...prev, productType: matched }));
        setProductTypeSearch(matched);
      } else {
        setProductTypeSearch(formData.productType);
      }
      setShowProductTypeDropdown(false);
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productName.trim()) {
      alert('Please enter a product name');
      return;
    }

    try {
      // Check if product already exists
      const { data: existingProduct, error: checkError } = await supabase
        .from('products')
        .select('productid')
        .eq('productname', formData.productName)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
        throw checkError;
      }

      let productId;
      if (existingProduct) {
        // Product exists, use its productid
        productId = existingProduct.productid;
        alert(`Product "${formData.productName}" already exists. Updating stock...`);
      } else {
        // Insert new product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .insert({
            productname: formData.productName,
            producttype: formData.productType,
            defaultunit: formData.defaultUnit,
            description: formData.description || null,
          })
          .select('productid')
          .single();

        if (productError) throw productError;
        productId = productData.productid;
      }

      // Insert or update stock in cylinderstockproductwise
      const { error: stockError } = await supabase
        .from('cylinderstockproductwise')
        .insert({
          productid: productId,
          transactiondate: new Date().toISOString().split('T')[0],
          openingbalance: formData.openingBalance,
          cylindersreceived: formData.cylindersReceived,
          cylindersdelivered: formData.cylindersDelivered,
          cylinderssold: formData.cylindersSold,
          cylindersconverted: formData.cylindersConverted,
          physicalstock: formData.physicalStock,
          createdat: new Date().toISOString(),
        });

      if (stockError) throw stockError;

      alert('Cylinder product and stock added/updated successfully!');
      setFormData({
        productName: '',
        productType: 'Medical',
        defaultUnit: 'Cylinders',
        description: '',
        openingBalance: 0,
        cylindersReceived: 0,
        cylindersDelivered: 0,
        cylindersSold: 0,
        cylindersConverted: 0,
        physicalStock: 0,
        threshold: 5,
      });
      setProductTypeSearch('Medical');
      setCurrentStep(1);
    } catch (err) {
      console.error('Error adding/updating cylinder:', err);
      alert('Failed to add/update cylinder: ' + (err as Error).message);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add New Cylinder Product
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
          <span>Product Details</span>
          <span>Stock Information</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Step 1: Product Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Product Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter cylinder name"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Type *
                </label>
                <input
                  type="text"
                  value={productTypeSearch}
                  onChange={(e) => {
                    setProductTypeSearch(e.target.value);
                    setShowProductTypeDropdown(true);
                  }}
                  onFocus={() => setShowProductTypeDropdown(true)}
                  onBlur={handleProductTypeBlur}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Select product type"
                />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                {showProductTypeDropdown && (
                  <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-sm">
                    {filteredProductTypes.length > 0 ? (
                      filteredProductTypes.map(type => (
                        <div
                          key={type}
                          className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white"
                          onClick={() => handleProductTypeSelect(type)}
                        >
                          {type}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-gray-500 dark:text-gray-400">No matching types</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter product description"
              />
            </div>
          </div>
        )}

        {/* Step 2: Stock Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Stock Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Opening Balance
                </label>
                <input
                  type="number"
                  name="openingBalance"
                  value={formData.openingBalance}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cylinders Received
                </label>
                <input
                  type="number"
                  name="cylindersReceived"
                  value={formData.cylindersReceived}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cylinders Delivered
                </label>
                <input
                  type="number"
                  name="cylindersDelivered"
                  value={formData.cylindersDelivered}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cylinders Sold
                </label>
                <input
                  type="number"
                  name="cylindersSold"
                  value={formData.cylindersSold}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cylinders Converted
                </label>
                <input
                  type="number"
                  name="cylindersConverted"
                  value={formData.cylindersConverted}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Physical Stock
                </label>
                <input
                  type="number"
                  name="physicalStock"
                  value={formData.physicalStock}
                  readOnly
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 cursor-not-allowed text-gray-700 dark:text-gray-300"
                  placeholder="Calculated automatically"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  name="threshold"
                  value={formData.threshold}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="5"
                />
              </div>
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
              Add Cylinder
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddStockForm;