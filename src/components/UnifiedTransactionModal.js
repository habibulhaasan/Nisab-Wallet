// src/components/UnifiedTransactionModal.js
'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

export default function UnifiedTransactionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  accounts = [], 
  categories = [],
  editingTransaction = null 
}) {
  const [transactionType, setTransactionType] = useState('Income');
  const [formData, setFormData] = useState({
    type: 'Income',
    amount: '',
    accountId: '',
    toAccountId: '', // For transfers
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        type: editingTransaction.type,
        amount: editingTransaction.amount.toString(),
        accountId: editingTransaction.accountId || '',
        toAccountId: editingTransaction.toAccountId || '',
        categoryId: editingTransaction.categoryId || '',
        date: editingTransaction.date,
        description: editingTransaction.description || ''
      });
      setTransactionType(editingTransaction.type);
    } else {
      setFormData({
        type: transactionType,
        amount: '',
        accountId: accounts[0]?.id || '',
        toAccountId: accounts[1]?.id || '',
        categoryId: categories[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
    }
  }, [editingTransaction, transactionType, isOpen]);

  useEffect(() => {
    if (isOpen && !editingTransaction) {
      setFormData(prev => ({ ...prev, type: transactionType }));
    }
  }, [transactionType, isOpen, editingTransaction]);

  if (!isOpen) return null;

  const handleTypeChange = (type) => {
    setTransactionType(type);
    setFormData(prev => ({ ...prev, type }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type Selector */}
          {!editingTransaction && (
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('Income')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  transactionType === 'Income'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingUp className={`mx-auto mb-2 ${transactionType === 'Income' ? 'text-green-600' : 'text-gray-400'}`} size={24} />
                <p className={`text-sm font-medium ${transactionType === 'Income' ? 'text-green-900' : 'text-gray-600'}`}>
                  Income
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('Expense')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  transactionType === 'Expense'
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingDown className={`mx-auto mb-2 ${transactionType === 'Expense' ? 'text-red-600' : 'text-gray-400'}`} size={24} />
                <p className={`text-sm font-medium ${transactionType === 'Expense' ? 'text-red-900' : 'text-gray-600'}`}>
                  Expense
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('Transfer')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  transactionType === 'Transfer'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <ArrowRightLeft className={`mx-auto mb-2 ${transactionType === 'Transfer' ? 'text-blue-600' : 'text-gray-400'}`} size={24} />
                <p className={`text-sm font-medium ${transactionType === 'Transfer' ? 'text-blue-900' : 'text-gray-600'}`}>
                  Transfer
                </p>
              </button>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>

          {/* For Transfer: From & To Accounts */}
          {transactionType === 'Transfer' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} (৳{account.balance})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.toAccountId}
                  onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select account</option>
                  {accounts
                    .filter(acc => acc.id !== formData.accountId)
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} (৳{account.balance})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : (
            /* For Income/Expense: Account & Category */
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} (৳{account.balance})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  {categories
                    .filter(cat => cat.type === transactionType)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Add notes..."
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingTransaction ? 'Update' : 'Add'} Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}