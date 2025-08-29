// components/Products/ProductsView.tsx
import React, { useState, useEffect } from 'react';
import { Save, Edit, Trash2 } from 'lucide-react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';

const ProductsView: React.FC = () => {
  const { addStockItem } = useStock();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    productname: '',
    producttype: '',
    defaultunit: 'Cylinders',
    description: '',
  });
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const [productData, setProductData] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    fetchProductData();
  }, []);

  const fetchProductData = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('productid', { ascending: true });
    if (error) {
      console.error('Error fetching product data:', error.message);
    } else {
      setProductData(data || []);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productname || !formData.producttype) {
      alert('Please fill in required fields (Product Name and Product Type)');
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .insert({
          productname: formData.productname,
          producttype: formData.producttype,
          defaultunit: formData.defaultunit,
          description: formData.description,
        });

      if (error) {
        console.error('Error inserting product:', error.message);
        alert(`Failed to add product: ${error.message}`);
        return;
      }

      addStockItem({
        name: formData.productname,
        quantity: 0,
        unit: formData.defaultunit,
        specifications: `Type: ${formData.producttype}, Description: ${formData.description || 'N/A'}`,
        category: formData.producttype,
        pricePerUnit: 0,
        addedBy: user?.username || 'unknown',
        threshold: 10,
      });

      setFormData({
        productname: '',
        producttype: '',
        defaultunit: 'Cylinders',
        description: '',
      });
      setCurrentStep(1);
      fetchProductData();
      alert('Product added successfully!');
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred while adding the product');
    }
  };

  const handleEdit = (id: number) => {
    const item = productData.find(data => data.productid === id);
    if (item) {
      setEditingId(id);
      setEditData(item);
      setFormData({
        productname: item.productname,
        producttype: item.producttype,
        defaultunit: item.defaultunit,
        description: item.description || '',
      });
      setCurrentStep(2);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productname || !formData.producttype) {
      alert('Please fill in required fields (Product Name and Product Type)');
      return;
    }

    if (editingId) {
      try {
        const { error } = await supabase
          .from('products')
          .update({
            productname: formData.productname,
            producttype: formData.producttype,
            defaultunit: formData.defaultunit,
            description: formData.description,
          })
          .eq('productid', editingId);

        if (error) {
          console.error('Error updating product:', error.message);
          alert(`Failed to update product: ${error.message}`);
          return;
        }

        setEditingId(null);
        setFormData({
          productname: '',
          producttype: '',
          defaultunit: 'Cylinders',
          description: '',
        });
        setCurrentStep(1);
        fetchProductData();
        alert('Product updated successfully!');
      } catch (err) {
        console.error('Unexpected error:', err);
        alert('An unexpected error occurred while updating the product');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('productid', id);

        if (error) {
          console.error('Error deleting product:', error.message);
          alert(`Failed to delete product: ${error.message}`);
          return;
        }

        setProductData(productData.filter(item => item.productid !== id));
        alert('Product deleted successfully!');
      } catch (err) {
        console.error('Unexpected error:', err);
        alert('An unexpected error occurred while deleting the product');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add Product
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
          <span>Review & Submit</span>
        </div>
      </div>

      <form onSubmit={editingId ? handleUpdate : handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="productname"
                  value={formData.productname}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter Product Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Type *
                </label>
                <select
                  name="producttype"
                  value={formData.producttype}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Type</option>
                  <option value="Cylinder">Cylinder</option>
                  <option value="Spare">Spare</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Unit
                </label>
                <select
                  name="defaultunit"
                  value={formData.defaultunit}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="Cylinders">Cylinders</option>
                  <option value="Pieces">Pieces</option>
                  <option value="Meters">Meters</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter Description"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Review & Submit
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Product Name:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.productname}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Product Type:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.producttype}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Default Unit:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.defaultunit}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Description:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.description || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
              {editingId ? 'Update Product' : 'Add Product'}
            </button>
          )}
        </div>
      </form>

      {/* Display Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Existing Products</h3>
        
        <div className="overflow-x-auto relative">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Default Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {productData.map((item) => (
                <tr key={item.productid}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.productid}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.productname}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.producttype}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.defaultunit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{new Date(item.createdat).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <button
                      onClick={() => handleEdit(item.productid)}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.productid)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductsView;