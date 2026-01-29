// src/app/dashboard/admin/payment-methods/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  getPaymentGatewaySettings, 
  savePaymentGatewaySettings,
  addPaymentMethod,
  updatePaymentMethod,
  removePaymentMethod,
  getTrialPeriodSettings,
  saveTrialPeriodSettings
} from '@/lib/paymentGatewayUtils';
import { checkIsAdmin } from '@/lib/adminUtils';
import { Plus, Edit2, Trash2, Save, X, CreditCard, Settings, Clock } from 'lucide-react';

export default function PaymentMethodsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [trialDays, setTrialDays] = useState(5);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'bKash',
    accountNumber: '',
    accountName: '',
    instructions: '',
    isActive: true
  });

  useEffect(() => {
    if (user) {
      checkAdminAndLoad();
    }
  }, [user]);

  const checkAdminAndLoad = async () => {
    const adminStatus = await checkIsAdmin(user.uid);
    if (!adminStatus) {
      router.push('/dashboard');
      return;
    }
    setIsAdmin(true);
    loadSettings();
  };

  const loadSettings = async () => {
    setLoading(true);
    
    const paymentResult = await getPaymentGatewaySettings();
    if (paymentResult.success) {
      setPaymentSettings(paymentResult.settings);
    }

    const trialResult = await getTrialPeriodSettings();
    if (trialResult.success) {
      setTrialDays(trialResult.trialDays);
    }
    
    setLoading(false);
  };

  const handleModeChange = async (mode) => {
    const updatedSettings = {
      ...paymentSettings,
      mode
    };
    
    const result = await savePaymentGatewaySettings(updatedSettings);
    if (result.success) {
      setPaymentSettings(updatedSettings);
    }
  };

  const handleTrialDaysUpdate = async () => {
    const result = await saveTrialPeriodSettings(trialDays);
    if (result.success) {
      alert('Trial period updated successfully');
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const methodData = {
      name: formData.name,
      type: formData.type,
      accountNumber: formData.accountNumber,
      accountName: formData.accountName,
      instructions: formData.instructions,
      isActive: formData.isActive
    };

    let result;
    if (editingMethod) {
      result = await updatePaymentMethod(editingMethod.id, methodData);
    } else {
      result = await addPaymentMethod(methodData);
    }

    if (result.success) {
      setShowModal(false);
      setEditingMethod(null);
      resetForm();
      loadSettings();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleEdit = (method) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      accountNumber: method.accountNumber || '',
      accountName: method.accountName || '',
      instructions: method.instructions || '',
      isActive: method.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (methodId) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    
    const result = await removePaymentMethod(methodId);
    if (result.success) {
      loadSettings();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'bKash',
      accountNumber: '',
      accountName: '',
      instructions: '',
      isActive: true
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMethod(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Payment Methods & Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure payment methods and trial settings</p>
      </div>

      {/* Trial Period Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <Clock className="text-blue-600 mr-2" size={24} />
          <h2 className="text-lg font-semibold text-gray-900">Trial Period</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Trial Duration (Days)
            </label>
            <input
              type="number"
              value={trialDays}
              onChange={(e) => setTrialDays(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1"
              max="30"
            />
          </div>
          <button
            onClick={handleTrialDaysUpdate}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Update
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Users will get {trialDays} days of free trial access after registration
        </p>
      </div>

      {/* Payment Mode Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <Settings className="text-blue-600 mr-2" size={24} />
          <h2 className="text-lg font-semibold text-gray-900">Payment Mode</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleModeChange('single')}
            className={`p-4 border-2 rounded-lg transition-all ${
              paymentSettings?.mode === 'single'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h3 className="font-medium text-gray-900 mb-1">Single Method</h3>
            <p className="text-sm text-gray-500">Users can only use one payment method</p>
          </button>
          
          <button
            onClick={() => handleModeChange('multiple')}
            className={`p-4 border-2 rounded-lg transition-all ${
              paymentSettings?.mode === 'multiple'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h3 className="font-medium text-gray-900 mb-1">Multiple Methods</h3>
            <p className="text-sm text-gray-500">Users can choose from multiple options</p>
          </button>
        </div>
      </div>

      {/* Payment Methods Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <CreditCard className="text-blue-600 mr-2" size={24} />
          <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add Method
        </button>
      </div>

      {/* Payment Methods List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentSettings?.methods?.map((method) => (
          <div key={method.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{method.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(method)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(method.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 text-gray-900">{method.type}</span>
              </div>
              
              {method.accountNumber && (
                <div>
                  <span className="text-gray-500">Account:</span>
                  <span className="ml-2 text-gray-900">{method.accountNumber}</span>
                </div>
              )}
              
              {method.accountName && (
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2 text-gray-900">{method.accountName}</span>
                </div>
              )}
              
              {method.instructions && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-gray-600">{method.instructions}</p>
                </div>
              )}
              
              <div className="pt-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  method.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {method.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(!paymentSettings?.methods || paymentSettings.methods.length === 0) && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CreditCard className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods yet</h3>
          <p className="text-gray-500 mb-4">Add your first payment method to accept payments</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Method
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Method Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Method Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., bKash Personal, Nagad Merchant"
                  required
                />
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Payment Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 01XXXXXXXXX"
                />
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Account holder name"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Payment Instructions
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="e.g., Send money to this number and provide transaction ID"
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active (visible to users)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save size={16} className="inline mr-2" />
                  {editingMethod ? 'Update Method' : 'Add Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}