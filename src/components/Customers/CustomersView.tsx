// components/Customers/CustomersView.tsx
import React, { useState, useEffect } from 'react';
import { Save, Edit, Trash2 } from 'lucide-react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';

const CustomersView: React.FC = () => {
  const { addStockItem } = useStock();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    customername: '',
    email: '',
    phone: '',
    address: '',
    isactive: true,
  });
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const [customerData, setCustomerData] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('customerid', { ascending: true });
    if (error) {
      console.error('Error fetching customer data:', error.message);
    } else {
      setCustomerData(data || []);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

    if (!formData.customername) {
      alert('Please fill in required field (Customer Name)');
      return;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .insert({
          customername: formData.customername,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          isactive: formData.isactive,
        });

      if (error) {
        console.error('Error inserting customer:', error.message);
        alert(`Failed to add customer: ${error.message}`);
        return;
      }

      addStockItem({
        name: formData.customername,
        quantity: 0,
        unit: 'units',
        specifications: `Email: ${formData.email || 'N/A'}, Phone: ${formData.phone || 'N/A'}, Address: ${formData.address || 'N/A'}`,
        category: 'Customers',
        pricePerUnit: 0,
        addedBy: user?.username || 'unknown',
        threshold: 0,
      });

      setFormData({
        customername: '',
        email: '',
        phone: '',
        address: '',
        isactive: true,
      });
      setCurrentStep(1);
      fetchCustomerData();
      alert('Customer added successfully!');
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred while adding the customer');
    }
  };

  const handleEdit = (id: number) => {
    const item = customerData.find(data => data.customerid === id);
    if (item) {
      setEditingId(id);
      setEditData(item);
      setFormData({
        customername: item.customername,
        email: item.email || '',
        phone: item.phone || '',
        address: item.address || '',
        isactive: item.isactive,
      });
      setCurrentStep(2);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customername) {
      alert('Please fill in required field (Customer Name)');
      return;
    }

    if (editingId) {
      try {
        const { error } = await supabase
          .from('customers')
          .update({
            customername: formData.customername,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            isactive: formData.isactive,
          })
          .eq('customerid', editingId);

        if (error) {
          console.error('Error updating customer:', error.message);
          alert(`Failed to update customer: ${error.message}`);
          return;
        }

        setEditingId(null);
        setFormData({
          customername: '',
          email: '',
          phone: '',
          address: '',
          isactive: true,
        });
        setCurrentStep(1);
        fetchCustomerData();
        alert('Customer updated successfully!');
      } catch (err) {
        console.error('Unexpected error:', err);
        alert('An unexpected error occurred while updating the customer');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('customerid', id);

        if (error) {
          console.error('Error deleting customer:', error.message);
          alert(`Failed to delete customer: ${error.message}`);
          return;
        }

        setCustomerData(customerData.filter(item => item.customerid !== id));
        alert('Customer deleted successfully!');
      } catch (err) {
        console.error('Unexpected error:', err);
        alert('An unexpected error occurred while deleting the customer');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add Customer
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
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customername"
                  value={formData.customername}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter Customer Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter Email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter Phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter Address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Active
                </label>
                <input
                  type="checkbox"
                  name="isactive"
                  checked={formData.isactive}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
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
                  <span className="font-medium text-gray-600 dark:text-gray-300">Customer Name:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.customername}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Email:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Phone:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Address:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.address || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Status:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.isactive ? 'Active' : 'Inactive'}</span>
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
              {editingId ? 'Update Customer' : 'Add Customer'}
            </button>
          )}
        </div>
      </form>

      {/* Display Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Existing Customers</h3>
        
        <div className="overflow-x-auto relative">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {customerData.map((item) => (
                <tr key={item.customerid}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.customerid}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.customername}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.address || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.isactive ? 'Active' : 'Inactive'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{new Date(item.createdat).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <button
                      onClick={() => handleEdit(item.customerid)}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.customerid)}
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

export default CustomersView;