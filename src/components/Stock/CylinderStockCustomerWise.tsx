// components/Stock/CylinderStockCustomerWise.tsx
import React, { useState, useEffect } from 'react';
import { Save, Edit, Trash2 } from 'lucide-react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CylinderStockCustomerWise: React.FC = () => {
  const { addStockItem } = useStock();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    productid: '',
    customerid: '',
    transactiondate: '',
    openingfull: 0,
    openingempty: 0,
    openingdefective: 0,
    emptycylindersreceived: 0,
    deliverychallan: 0,
    closingfull: 0,
    closingempty: 0,
    closingdefective: 0,
  });
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [customerData, setCustomerData] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [showGraph, setShowGraph] = useState(false);
  const [selectedField, setSelectedField] = useState('closingfull');

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    const { data, error } = await supabase
      .from('cylinderstockcustomerwise')
      .select('*')
      .order('customerstockid', { ascending: true });
    if (error) {
      console.error('Error fetching customer data:', error.message);
    } else {
      setCustomerData(data || []);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!formData.productid || !formData.customerid || !formData.transactiondate) {
      alert('Please fill in required fields (Product ID, Customer ID, and Transaction Date)');
      return;
    }

    try {
      const { error } = await supabase
        .from('cylinderstockcustomerwise')
        .insert({
          productid: Number(formData.productid),
          customerid: Number(formData.customerid),
          transactiondate: formData.transactiondate,
          openingfull: formData.openingfull,
          openingempty: formData.openingempty,
          openingdefective: formData.openingdefective,
          emptycylindersreceived: formData.emptycylindersreceived,
          deliverychallan: formData.deliverychallan,
          closingfull: formData.closingfull,
          closingempty: formData.closingempty,
          closingdefective: formData.closingdefective,
        });

      if (error) {
        console.error('Error inserting customer cylinder stock:', error.message);
        alert(`Failed to add customer cylinder stock: ${error.message}`);
        return;
      }

      addStockItem({
        name: `CustomerCylinder-${formData.customerid}`,
        quantity: formData.closingfull + formData.closingempty + formData.closingdefective,
        unit: 'cylinders',
        specifications: `Transaction Date: ${formData.transactiondate}, Customer ID: ${formData.customerid}`,
        category: 'Cylinders',
        pricePerUnit: 0,
        addedBy: user?.username || 'unknown',
        threshold: 10,
      });

      setFormData({
        productid: '',
        customerid: '',
        transactiondate: '',
        openingfull: 0,
        openingempty: 0,
        openingdefective: 0,
        emptycylindersreceived: 0,
        deliverychallan: 0,
        closingfull: 0,
        closingempty: 0,
        closingdefective: 0,
      });
      setCurrentStep(1);
      fetchCustomerData();
      alert('Customer cylinder stock added successfully!');
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred while adding the customer cylinder stock');
    }
  };

  const handleEdit = (id: number) => {
    const item = customerData.find(data => data.customerstockid === id);
    if (item) {
      setEditingId(id);
      setEditData(item);
      setFormData({
        productid: String(item.productid),
        customerid: String(item.customerid),
        transactiondate: item.transactiondate,
        openingfull: item.openingfull,
        openingempty: item.openingempty,
        openingdefective: item.openingdefective,
        emptycylindersreceived: item.emptycylindersreceived,
        deliverychallan: item.deliverychallan,
        closingfull: item.closingfull,
        closingempty: item.closingempty,
        closingdefective: item.closingdefective,
      });
      setCurrentStep(2);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productid || !formData.customerid || !formData.transactiondate) {
      alert('Please fill in required fields (Product ID, Customer ID, and Transaction Date)');
      return;
    }

    if (editingId) {
      try {
        const { error } = await supabase
          .from('cylinderstockcustomerwise')
          .update({
            productid: Number(formData.productid),
            customerid: Number(formData.customerid),
            transactiondate: formData.transactiondate,
            openingfull: formData.openingfull,
            openingempty: formData.openingempty,
            openingdefective: formData.openingdefective,
            emptycylindersreceived: formData.emptycylindersreceived,
            deliverychallan: formData.deliverychallan,
            closingfull: formData.closingfull,
            closingempty: formData.closingempty,
            closingdefective: formData.closingdefective,
          })
          .eq('customerstockid', editingId);

        if (error) {
          console.error('Error updating customer cylinder stock:', error.message);
          alert(`Failed to update customer cylinder stock: ${error.message}`);
          return;
        }

        setEditingId(null);
        setFormData({
          productid: '',
          customerid: '',
          transactiondate: '',
          openingfull: 0,
          openingempty: 0,
          openingdefective: 0,
          emptycylindersreceived: 0,
          deliverychallan: 0,
          closingfull: 0,
          closingempty: 0,
          closingdefective: 0,
        });
        setCurrentStep(1);
        fetchCustomerData();
        alert('Customer cylinder stock updated successfully!');
      } catch (err) {
        console.error('Unexpected error:', err);
        alert('An unexpected error occurred while updating the customer cylinder stock');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const { error } = await supabase
          .from('cylinderstockcustomerwise')
          .delete()
          .eq('customerstockid', id);

        if (error) {
          console.error('Error deleting customer cylinder stock:', error.message);
          alert(`Failed to delete customer cylinder stock: ${error.message}`);
          return;
        }

        setCustomerData(customerData.filter(item => item.customerstockid !== id));
        alert('Customer cylinder stock deleted successfully!');
      } catch (err) {
        console.error('Unexpected error:', err);
        alert('An unexpected error occurred while deleting the customer cylinder stock');
      }
    }
  };

  const chartData = {
    labels: customerData.map(item => `ID ${item.customerstockid}`),
    datasets: [
      {
        label: selectedField,
        data: customerData.map(item => item[selectedField] || 0),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 71, 0.6)',
          'rgba(144, 238, 144, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 71, 1)',
          'rgba(144, 238, 144, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `${selectedField.charAt(0).toUpperCase() + selectedField.slice(1)} by Record ID` },
    },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add Cylinder Stock Customer Wise
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
                <input
                  type="number"
                  name="productid"
                  value={formData.productid}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter Product ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer ID *
                </label>
                <input
                  type="number"
                  name="customerid"
                  value={formData.customerid}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter Customer ID"
                />
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
                  Opening Full *
                </label>
                <input
                  type="number"
                  name="openingfull"
                  value={formData.openingfull}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Opening Empty *
                </label>
                <input
                  type="number"
                  name="openingempty"
                  value={formData.openingempty}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Opening Defective *
                </label>
                <input
                  type="number"
                  name="openingdefective"
                  value={formData.openingdefective}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Empty Cylinders Received *
                </label>
                <input
                  type="number"
                  name="emptycylindersreceived"
                  value={formData.emptycylindersreceived}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delivery Challan *
                </label>
                <input
                  type="number"
                  name="deliverychallan"
                  value={formData.deliverychallan}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Closing Full *
                </label>
                <input
                  type="number"
                  name="closingfull"
                  value={formData.closingfull}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Closing Empty *
                </label>
                <input
                  type="number"
                  name="closingempty"
                  value={formData.closingempty}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Closing Defective *
                </label>
                <input
                  type="number"
                  name="closingdefective"
                  value={formData.closingdefective}
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
                  <span className="font-medium text-gray-600 dark:text-gray-300">Customer ID:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.customerid}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Transaction Date:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.transactiondate}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Opening Full:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.openingfull}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Opening Empty:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.openingempty}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Opening Defective:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.openingdefective}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Empty Cylinders Received:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.emptycylindersreceived}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Delivery Challan:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.deliverychallan}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Closing Full:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.closingfull}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Closing Empty:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.closingempty}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Closing Defective:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.closingdefective}</span>
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

      {/* Display Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Existing Customer Cylinder Stock</h3>
        <div className="overflow-x-auto relative">
          <button
                onClick={() => setShowGraph(true)}
                className="ml-auto px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
                Show Graph
            </button>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Opening Full</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Opening Empty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Opening Defective</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Empty Received</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Delivery Challan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Closing Full</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Closing Empty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Closing Defective</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {customerData.map((item) => (
                <tr key={item.customerstockid}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.customerstockid}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.productid}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.customerid}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.transactiondate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.openingfull}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.openingempty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.openingdefective}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.emptycylindersreceived}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.deliverychallan}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.closingfull}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.closingempty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.closingdefective}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <button
                      onClick={() => handleEdit(item.customerstockid)}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.customerstockid)}
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
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-3/4 h-3/4 relative">
            <button
              onClick={() => setShowGraph(false)}
              className="mb-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Close
            </button>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="absolute bottom-4 right-4 p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="openingfull">Opening Full</option>
              <option value="openingempty">Opening Empty</option>
              <option value="openingdefective">Opening Defective</option>
              <option value="emptycylindersreceived">Empty Cylinders Received</option>
              <option value="deliverychallan">Delivery Challan</option>
              <option value="closingfull">Closing Full</option>
              <option value="closingempty">Closing Empty</option>
              <option value="closingdefective">Closing Defective</option>
            </select>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CylinderStockCustomerWise;