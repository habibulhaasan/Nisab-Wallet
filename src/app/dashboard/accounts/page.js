// src/app/dashboard/accounts/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAccounts, addAccount, updateAccount, deleteAccount } from '@/lib/firestoreCollections';
import { Plus, Edit2, Trash2, Wallet, CreditCard, Smartphone, Coins, X, Download, Sparkles } from 'lucide-react';
import { showToast } from '@/components/Toast';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateId } from '@/lib/firestoreCollections';

// Default accounts data
const DEFAULT_ACCOUNTS = [
  { name: 'Cash', type: 'Cash', balance: 0, isDefault: true },
  { name: 'Bank 1', type: 'Bank', balance: 0, isDefault: true },
  { name: 'bKash', type: 'Mobile Banking', balance: 0, isDefault: true },
  { name: 'Bank 2', type: 'Bank', balance: 0, isDefault: true }
];

export default function AccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Cash',
    balance: '',
  });

  const accountTypes = [
    { value: 'Cash', label: 'Cash', icon: Wallet },
    { value: 'Bank', label: 'Bank Account', icon: CreditCard },
    { value: 'Mobile Banking', label: 'Mobile Banking', icon: Smartphone },
    { value: 'Gold', label: 'Gold', icon: Coins },
    { value: 'Silver', label: 'Silver', icon: Coins },
  ];

  useEffect(() => {
    if (user) {
      loadAccounts();
    }
  }, [user]);

  const loadAccounts = async () => {
    setLoading(true);
    const result = await getAccounts(user.uid);
    if (result.success) {
      setAccounts(result.accounts);
    }
    setLoading(false);
  };

  // Load default accounts
  const loadDefaultAccounts = async () => {
    setLoadingDefaults(true);
    try {
      const accountsRef = collection(db, 'users', user.uid, 'accounts');
      
      // Get existing account names (case-insensitive)
      const existingNames = accounts.map(a => a.name.toLowerCase().trim());
      
      // Filter out accounts that already exist
      const accountsToAdd = DEFAULT_ACCOUNTS.filter(
        defAcc => !existingNames.includes(defAcc.name.toLowerCase().trim())
      );

      if (accountsToAdd.length === 0) {
        showToast('All default accounts already exist', 'info');
        setLoadingDefaults(false);
        return;
      }

      // Add new default accounts
      const promises = accountsToAdd.map(account => 
        addDoc(accountsRef, {
          accountId: generateId(),
          ...account,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      );

      await Promise.all(promises);
      
      showToast(`Added ${accountsToAdd.length} default account${accountsToAdd.length > 1 ? 's' : ''}`, 'success');
      await loadAccounts();
    } catch (error) {
      console.error('Error loading defaults:', error);
      showToast('Failed to load default accounts', 'error');
    } finally {
      setLoadingDefaults(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.balance) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    // Check for duplicate names (case-insensitive, trimmed)
    const trimmedName = formData.name.trim();
    const isDuplicate = accounts.some(account => {
      // Skip the current account when editing
      if (editingAccount && account.id === editingAccount.id) {
        return false;
      }
      return account.name.toLowerCase().trim() === trimmedName.toLowerCase();
    });

    if (isDuplicate) {
      showToast('An account with this name already exists', 'error');
      return;
    }

    if (editingAccount) {
      // Update existing account
      const result = await updateAccount(user.uid, editingAccount.id, {
        ...formData,
        name: trimmedName
      });
      if (result.success) {
        showToast('Account updated successfully', 'success');
        await loadAccounts();
        closeModal();
      } else {
        showToast('Error updating account: ' + result.error, 'error');
      }
    } else {
      // Add new account
      const result = await addAccount(user.uid, {
        ...formData,
        name: trimmedName
      });
      if (result.success) {
        showToast('Account added successfully', 'success');
        await loadAccounts();
        closeModal();
      } else {
        showToast('Error adding account: ' + result.error, 'error');
      }
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
    });
    setShowModal(true);
  };

  const handleDelete = async (account) => {
    if (confirm(`Are you sure you want to delete "${account.name}"?`)) {
      const result = await deleteAccount(user.uid, account.id);
      if (result.success) {
        showToast('Account deleted successfully', 'success');
        await loadAccounts();
      } else {
        showToast('Error deleting account: ' + result.error, 'error');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAccount(null);
    setFormData({ name: '', type: 'Cash', balance: '' });
  };

  const getAccountIcon = (type) => {
    const accountType = accountTypes.find(t => t.value === type);
    return accountType ? accountType.icon : Wallet;
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your financial accounts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadDefaultAccounts}
            disabled={loadingDefaults}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingDefaults ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span className="text-sm font-medium">Loading...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Load Defaults</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Account</span>
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl p-6 text-white">
        <p className="text-sm text-gray-300 mb-2">Total Balance</p>
        <p className="text-4xl font-bold">৳{totalBalance.toLocaleString()}</p>
        <p className="text-sm text-gray-300 mt-2">Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-3">Loading accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No accounts yet</p>
          <p className="text-sm text-gray-400 mb-4">Create your first account or load defaults to start</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadDefaultAccounts}
              disabled={loadingDefaults}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Load Defaults</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add Account</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const Icon = getAccountIcon(account.type);
            return (
              <div key={account.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors relative">
                {account.isDefault && (
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                      <span>Default</span>
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-xs text-gray-500">{account.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(account)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(account)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">৳{account.balance.toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  placeholder="e.g., Main Wallet, DBBL Savings"
                  required
                />
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Account Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  required
                >
                  {accountTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Balance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {formData.type === 'Gold' || formData.type === 'Silver' 
                    ? `Current Value (৳)` 
                    : 'Balance (৳)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  placeholder="0.00"
                  required
                />
                {(formData.type === 'Gold' || formData.type === 'Silver') && (
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the current market value in Taka
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  {editingAccount ? 'Update' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}