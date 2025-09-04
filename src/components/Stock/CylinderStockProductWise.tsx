import React, { useState, useEffect } from 'react';
import { Save, Edit, Trash2 } from 'lucide-react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const CylinderStockProductWise: React.FC = () => {
  const { addStockItem, updateStockItem, deleteStockItem, stockItems } = useStock();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    productid: '',
    transactiondate: '',
    openingbalance: 0,
    cylindersreceived: 0,
    cylindersdelivered: 0,
    cylinderssold: 0,
    cylindersconverted: 0,
    physicalstock: 0,
  });
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [productData, setProductData] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [showGraph, setShowGraph] = useState(false);
  const [selectedField, setSelectedField] = useState('physicalstock');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [products, setProducts] = useState<{ productid: number; productname: string }[]>([]);

  useEffect(() => {
    fetchProductData();
    fetchProducts();

    // Real-time subscription for cylinderstockproductwise
    const subscription = supabase
      .channel('cylinderstockproductwise-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cylinderstockproductwise',
        },
        () => {
          console.log('Detected change in cylinderstockproductwise, refetching product data...');
          fetchProductData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchProductData = async () => {
    const { data, error } = await supabase
      .from('cylinderstockproductwise')
      .select(`
        cylinderstockid,
        productid,
        transactiondate,
        openingbalance,
        cylindersreceived,
        cylindersdelivered,
        cylinderssold,
        cylindersconverted,
        physicalstock,
        products(productname)
      `)
      .order('cylinderstockid', { ascending: true });
    if (error) {
      console.error('Error fetching product data:', error.message);
    } else {
      setProductData(data || []);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('productid, productname')
      .order('productid', { ascending: true });
    if (error) {
      console.error('Error fetching products:', error.message);
    } else {
      setProducts(data || []);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? 0 : Number(value) || value,
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

    if (!formData.productid || !formData.transactiondate) {
      alert('Please fill in required fields (Product ID and Transaction Date)');
      return;
    }

    const productCheck = products.find(p => p.productid === Number(formData.productid));
    if (!productCheck) {
      alert('Invalid Product ID. Please select a valid Product ID from the list.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cylinderstockproductwise')
        .insert({
          productid: Number(formData.productid),
          transactiondate: formData.transactiondate,
          openingbalance: formData.openingbalance,
          cylindersreceived: formData.cylindersreceived,
          cylindersdelivered: formData.cylindersdelivered,
          cylinderssold: formData.cylinderssold,
          cylindersconverted: formData.cylindersconverted,
          physicalstock: formData.physicalstock,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting cylinder stock:', error.message);
        alert(`Failed to add cylinder stock: ${error.message}`);
        return;
      }

      await addStockItem({
        id: data.cylinderstockid,
        name: productCheck.productname,
        quantity: formData.physicalstock,
        unit: 'cylinders',
        specifications: `Transaction Date: ${formData.transactiondate}`,
        category: 'Cylinders',
        pricePerUnit: 0,
        addedBy: user?.username || 'unknown',
        threshold: 5,
        productId: Number(formData.productid),
        dateAdded: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });

      setFormData({
        productid: '',
        transactiondate: '',
        openingbalance: 0,
        cylindersreceived: 0,
        cylindersdelivered: 0,
        cylinderssold: 0,
        cylindersconverted: 0,
        physicalstock: 0,
      });
      setCurrentStep(1);
      await fetchProductData(); // Refresh data after adding
      alert('Cylinder stock added successfully!');
    } catch (err) {
      console.error('Error adding cylinder stock:', err);
      alert('An unexpected error occurred while adding the cylinder stock');
    }
  };

  const handleEdit = (id: number) => {
    const item = productData.find(data => data.cylinderstockid === id);
    if (item) {
      setEditingId(id);
      setEditData(item);
      setFormData({
        productid: String(item.productid),
        transactiondate: item.transactiondate,
        openingbalance: item.openingbalance,
        cylindersreceived: item.cylindersreceived,
        cylindersdelivered: item.cylindersdelivered,
        cylinderssold: item.cylinderssold,
        cylindersconverted: item.cylindersconverted,
        physicalstock: item.physicalstock,
      });
      setCurrentStep(2);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productid || !formData.transactiondate) {
      alert('Please fill in required fields (Product ID and Transaction Date)');
      return;
    }

    const productCheck = products.find(p => p.productid === Number(formData.productid));
    if (!productCheck) {
      alert('Invalid Product ID. Please select a valid Product ID from the list.');
      return;
    }

    if (editingId) {
      try {
        // Update cylinderstockproductwise table
        const { error: updateError } = await supabase
          .from('cylinderstockproductwise')
          .update({
            productid: Number(formData.productid),
            transactiondate: formData.transactiondate,
            openingbalance: formData.openingbalance,
            cylindersreceived: formData.cylindersreceived,
            cylindersdelivered: formData.cylindersdelivered,
            cylinderssold: formData.cylinderssold,
            cylindersconverted: formData.cylindersconverted,
            physicalstock: formData.physicalstock,
          })
          .eq('cylinderstockid', editingId);

        if (updateError) {
          console.error('Error updating cylinder stock:', updateError.message);
          alert(`Failed to update cylinder stock: ${updateError.message}`);
          return;
        }

        // Find the corresponding stock item
        const stockItem = stockItems.find(item => item.productId === Number(formData.productid));
        if (stockItem) {
          await updateStockItem(stockItem.id, {
            quantity: formData.physicalstock,
            lastUpdated: new Date().toISOString(),
            productId: Number(formData.productid),
            name: productCheck.productname,
          }, editingId);
        } else {
          // If no stock item exists, create a new one
          await addStockItem({
            id: editingId,
            name: productCheck.productname,
            quantity: formData.physicalstock,
            unit: 'cylinders',
            specifications: `Transaction Date: ${formData.transactiondate}`,
            category: 'Cylinders',
            pricePerUnit: 0,
            addedBy: user?.username || 'unknown',
            threshold: 5,
            productId: Number(formData.productid),
            dateAdded: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          });
        }

        setEditingId(null);
        setFormData({
          productid: '',
          transactiondate: '',
          openingbalance: 0,
          cylindersreceived: 0,
          cylindersdelivered: 0,
          cylinderssold: 0,
          cylindersconverted: 0,
          physicalstock: 0,
        });
        setCurrentStep(1);
        await fetchProductData(); // Refresh data after updating
        alert('Cylinder stock updated successfully!');
      } catch (err) {
        console.error('Error updating cylinder stock:', err);
        alert(`An unexpected error occurred while updating the cylinder stock: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const { error } = await supabase
          .from('cylinderstockproductwise')
          .delete()
          .eq('cylinderstockid', id);

        if (error) {
          console.error('Error deleting cylinder stock:', error.message);
          alert(`Failed to delete cylinder stock: ${error.message}`);
          return;
        }

        await deleteStockItem(id, id);
        await fetchProductData(); // Refresh data after deleting
        alert('Cylinder stock deleted successfully!');
      } catch (err) {
        console.error('Error deleting cylinder stock:', err);
        alert(`An unexpected error occurred while deleting the cylinder stock: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  const chartData = {
    labels: productData.map(item => `ID ${item.cylinderstockid}`),
    datasets: [
      {
        label: selectedField,
        data: productData.map(item => item[selectedField] || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        ...(chartType === 'line' && { tension: 0.4, fill: false }),
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: `${selectedField.charAt(0).toUpperCase() + selectedField.slice(1)} by Record ID`,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Quantity' },
      },
      x: {
        title: { display: true, text: 'Record ID' },
      },
    },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add Cylinder Stock Product Wise
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
          <span>Stock Details</span>
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
                  Product ID *
                </label>
                <select
                  name="productid"
                  value={formData.productid}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a Product</option>
                  {products.map((product) => (
                    <option key={product.productid} value={product.productid}>
                      {product.productname} (ID: {product.productid})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction Date *
                </label>
                <input
                  type="date"
                  name="transactiondate"
                  value={formData.transactiondate}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Stock Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Opening Balance *
                </label>
                <input
                  type="number"
                  name="openingbalance"
                  value={formData.openingbalance}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cylinders Received *
                </label>
                <input
                  type="number"
                  name="cylindersreceived"
                  value={formData.cylindersreceived}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cylinders Delivered *
                </label>
                <input
                  type="number"
                  name="cylindersdelivered"
                  value={formData.cylindersdelivered}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cylinders Sold *
                </label>
                <input
                  type="number"
                  name="cylinderssold"
                  value={formData.cylinderssold}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cylinders Converted *
                </label>
                <input
                  type="number"
                  name="cylindersconverted"
                  value={formData.cylindersconverted}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Physical Stock *
                </label>
                <input
                  type="number"
                  name="physicalstock"
                  value={formData.physicalstock}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Review & Submit
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Product ID:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.productid}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Transaction Date:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.transactiondate}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Opening Balance:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.openingbalance}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Cylinders Received:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.cylindersreceived}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Cylinders Delivered:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.cylindersdelivered}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Cylinders Sold:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.cylinderssold}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Cylinders Converted:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.cylindersconverted}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Physical Stock:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.physicalstock}</span>
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
              {editingId ? 'Update Item' : 'Add Item'}
            </button>
          )}
        </div>
      </form>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Existing Cylinder Stock</h3>
        <div className="overflow-x-auto relative">
          <button
            onClick={() => setShowGraph(true)}
            className="ml-auto mb-4 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
          >
            Show Graph
          </button>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Opening Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cylinders Received</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cylinders Delivered</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cylinders Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cylinders Converted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Physical Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {productData.map((item) => (
                <tr key={item.cylinderstockid}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.cylinderstockid}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.products?.productname || item.productid}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.transactiondate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.openingbalance}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.cylindersreceived}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.cylindersdelivered}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.cylinderssold}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.cylindersconverted}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.physicalstock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <button
                      onClick={() => handleEdit(item.cylinderstockid)}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.cylinderstockid)}
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

      {showGraph && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-3/4 h-3/4 relative overflow-auto">
            <div className="flex justify-between mb-4">
              <button
                onClick={() => setShowGraph(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Close
              </button>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'bar' | 'line')}
                className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
              </select>
            </div>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="absolute bottom-4 right-4 p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="openingbalance">Opening Balance</option>
              <option value="cylindersreceived">Cylinders Received</option>
              <option value="cylindersdelivered">Cylinders Delivered</option>
              <option value="cylinderssold">Cylinders Sold</option>
              <option value="cylindersconverted">Cylinders Converted</option>
              <option value="physicalstock">Physical Stock</option>
            </select>
            <div className="h-full w-full">
              {chartType === 'bar' ? (
                <Bar data={chartData} options={chartOptions} />
              ) : (
                <Line data={chartData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CylinderStockProductWise;