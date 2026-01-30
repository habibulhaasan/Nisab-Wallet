// src/app/dashboard/transactions/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateId } from '@/lib/firestoreCollections';
import { getAccounts, updateAccount } from '@/lib/firestoreCollections';
import { Plus, Edit2, Trash2, Receipt, X, ArrowUpCircle, ArrowDownCircle, Calendar, Filter, ArrowRightLeft, ArrowRight } from 'lucide-react';
import { showToast } from '@/components/Toast';
import UnifiedTransactionModal from '@/components/UnifiedTransactionModal';

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filterType, setFilterType] = useState('All');
  const [modalType, setModalType] = useState('transaction'); // 'transaction' or 'transfer'
  
  const [formData, setFormData] = useState({
    type: 'Expense',
    amount: '',
    accountId: '',
    categoryId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [transferData, setTransferData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadTransactions(),
      loadAccounts(),
      loadCategories(),
    ]);
    setLoading(false);
  };

  const loadTransactions = async () => {
    try {
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const q = query(transactionsRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const trans = [];
      querySnapshot.forEach((doc) => {
        trans.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(trans);
    } catch (error) {
      console.error('Error loading transactions:', error);
      showToast('Failed to load transactions', 'error');
    }
  };

  const loadAccounts = async () => {
    const result = await getAccounts(user.uid);
    if (result.success) {
      setAccounts(result.accounts);
      if (result.accounts.length > 0 && !formData.accountId) {
        setFormData(prev => ({ ...prev, accountId: result.accounts[0].id }));
        setTransferData(prev => ({ 
          ...prev, 
          fromAccountId: result.accounts[0].id,
          toAccountId: result.accounts.length > 1 ? result.accounts[1].id : ''
        }));
      }
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesRef = collection(db, 'users', user.uid, 'categories');
      const querySnapshot = await getDocs(categoriesRef);
      const cats = [];
      querySnapshot.forEach((doc) => {
        cats.push({ id: doc.id, ...doc.data() });
      });
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
      showToast('Failed to load categories', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.accountId || !formData.categoryId) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const amount = parseFloat(formData.amount);
    const account = accounts.find(a => a.id === formData.accountId);
    
    if (!account) {
      showToast('Invalid account selected', 'error');
      return;
    }

    try {
      if (editingTransaction) {
        // Revert old transaction effect
        const oldAmount = editingTransaction.amount;
        const oldType = editingTransaction.type;
        const oldAccountId = editingTransaction.accountId;
        const oldAccount = accounts.find(a => a.id === oldAccountId);
        
        if (oldAccount) {
          const revertedBalance = oldType === 'Income' 
            ? oldAccount.balance - oldAmount 
            : oldAccount.balance + oldAmount;
          await updateAccount(user.uid, oldAccount.id, { balance: revertedBalance });
        }

        // Update transaction
        const transactionRef = doc(db, 'users', user.uid, 'transactions', editingTransaction.id);
        await updateDoc(transactionRef, {
          type: formData.type,
          amount,
          accountId: formData.accountId,
          categoryId: formData.categoryId,
          description: formData.description,
          date: formData.date,
          updatedAt: serverTimestamp(),
        });

        // Apply new transaction effect
        const newBalance = formData.type === 'Income' 
          ? account.balance + amount 
          : account.balance - amount;
        await updateAccount(user.uid, account.id, { balance: newBalance });
        
        showToast('Transaction updated successfully', 'success');
      } else {
        // Add new transaction
        const transactionId = generateId();
        await addDoc(collection(db, 'users', user.uid, 'transactions'), {
          transactionId,
          type: formData.type,
          amount,
          accountId: formData.accountId,
          categoryId: formData.categoryId,
          description: formData.description,
          date: formData.date,
          createdAt: serverTimestamp(),
        });

        // Update account balance
        const newBalance = formData.type === 'Income' 
          ? account.balance + amount 
          : account.balance - amount;
        await updateAccount(user.uid, account.id, { balance: newBalance });
        
        showToast('Transaction added successfully', 'success');
      }

      await loadData();
      closeModal();
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    
    if (!transferData.fromAccountId || !transferData.toAccountId || !transferData.amount) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (transferData.fromAccountId === transferData.toAccountId) {
      showToast('Cannot transfer to the same account', 'error');
      return;
    }

    const amount = parseFloat(transferData.amount);
    
    if (amount <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }

    const fromAccount = accounts.find(a => a.id === transferData.fromAccountId);
    const toAccount = accounts.find(a => a.id === transferData.toAccountId);

    if (!fromAccount || !toAccount) {
      showToast('Invalid accounts selected', 'error');
      return;
    }

    if (fromAccount.balance < amount) {
      showToast(`Insufficient balance in ${fromAccount.name}. Available: ৳${fromAccount.balance.toLocaleString()}`, 'error');
      return;
    }

    try {
      const transferId = generateId();
      
      // Create transfer record
      await addDoc(collection(db, 'users', user.uid, 'transfers'), {
        transferId,
        fromAccountId: transferData.fromAccountId,
        fromAccountName: fromAccount.name,
        toAccountId: transferData.toAccountId,
        toAccountName: toAccount.name,
        amount,
        description: transferData.description || '',
        date: transferData.date,
        createdAt: serverTimestamp(),
      });

      // Update FROM account (subtract)
      await updateAccount(user.uid, fromAccount.id, {
        balance: fromAccount.balance - amount
      });

      // Update TO account (add)
      await updateAccount(user.uid, toAccount.id, {
        balance: toAccount.balance + amount
      });

      showToast('Transfer completed successfully', 'success');
      await loadData();
      closeModal();
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      description: transaction.description || '',
      date: transaction.date,
    });
    setModalType('transaction');
    setShowModal(true);
  };

  const handleDelete = async (transaction) => {
    if (!confirm('Delete this transaction?')) return;

    try {
      // Revert transaction effect on account
      const account = accounts.find(a => a.id === transaction.accountId);
      if (account) {
        const newBalance = transaction.type === 'Income' 
          ? account.balance - transaction.amount 
          : account.balance + transaction.amount;
        await updateAccount(user.uid, account.id, { balance: newBalance });
      }

      await deleteDoc(doc(db, 'users', user.uid, 'transactions', transaction.id));
      showToast('Transaction deleted successfully', 'success');
      await loadData();
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    }
  };

  const openTransactionModal = () => {
    setModalType('transaction');
    setShowModal(true);
  };

  const openTransferModal = () => {
    if (accounts.length < 2) {
      showToast('You need at least 2 accounts to make a transfer', 'error');
      return;
    }
    setModalType('transfer');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTransaction(null);
    setModalType('transaction');
    setFormData({
      type: 'Expense',
      amount: '',
      accountId: accounts.length > 0 ? accounts[0].id : '',
      categoryId: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setTransferData({
      fromAccountId: accounts.length > 0 ? accounts[0].id : '',
      toAccountId: accounts.length > 1 ? accounts[1].id : '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : 'Unknown';
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#6B7280';
  };

  const getAccountBalance = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? account.balance : 0;
  };

  const filteredTransactions = filterType === 'All' 
    ? transactions 
    : transactions.filter(t => t.type === filterType);

  const availableCategories = categories.filter(c => c.type === formData.type);
  const availableToAccounts = accounts.filter(a => a.id !== transferData.fromAccountId);

  const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">Track your income and expenses</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={openTransferModal}
            disabled={accounts.length < 2}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
            title={accounts.length < 2 ? 'Need at least 2 accounts' : 'Transfer between accounts'}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Transfer</span>
          </button>
          <button
            onClick={openTransactionModal}
            disabled={accounts.length === 0 || categories.length === 0}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Income</p>
            <ArrowUpCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-green-600">৳{totalIncome.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Expense</p>
            <ArrowDownCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-semibold text-red-600">৳{totalExpense.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Net Balance</p>
            <Receipt className="w-4 h-4 text-gray-400" />
          </div>
          <p className={`text-2xl font-semibold ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ৳{(totalIncome - totalExpense).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <div className="flex space-x-2">
            {['All', 'Income', 'Expense'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                  filterType === type
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No accounts found</p>
          <p className="text-sm text-gray-400 mb-4">Create an account first to add transactions</p>
          <button
            onClick={() => window.location.href = '/dashboard/accounts'}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add Account</span>
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No categories found</p>
          <p className="text-sm text-gray-400 mb-4">Create categories first to organize transactions</p>
          <button
            onClick={() => window.location.href = '/dashboard/categories'}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add Category</span>
          </button>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No transactions yet</p>
          <p className="text-sm text-gray-400 mb-4">Start tracking your income and expenses</p>
          <button
            onClick={openTransactionModal}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add Transaction</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    transaction.type === 'Income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'Income' ? (
                      <ArrowUpCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getCategoryColor(transaction.categoryId) }}
                      ></div>
                      <p className="text-sm font-medium text-gray-900">{getCategoryName(transaction.categoryId)}</p>
                    </div>
                    <p className="text-xs text-gray-500">{getAccountName(transaction.accountId)} • {transaction.date}</p>
                    {transaction.description && (
                      <p className="text-xs text-gray-400 mt-1">{transaction.description}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'Income' ? '+' : '-'}৳{transaction.amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 ml-4">
                  <button
                    onClick={() => handleEdit(transaction)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(transaction)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[85vh] flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {modalType === 'transfer' 
                  ? 'Transfer Money' 
                  : editingTransaction 
                    ? 'Edit Transaction' 
                    : 'Add Transaction'
                }
              </h2>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <UnifiedTransactionModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSubmit={handleSubmit}
  accounts={accounts}
  categories={categories}
  editingTransaction={editingTransaction}  // optional
/>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto flex-1 p-6">
              {modalType === 'transaction' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'Income', categoryId: '' })}
                        className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                          formData.type === 'Income'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Income
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'Expense', categoryId: '' })}
                        className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                          formData.type === 'Expense'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Expense
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (৳)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  {/* Account */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Account</label>
                    <select
                      value={formData.accountId}
                      onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                      required
                    >
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} (৳{account.balance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                      required
                    >
                      <option value="">Select category</option>
                      {availableCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (Optional)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                      placeholder="Add notes..."
                      rows="2"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
                    >
                      {editingTransaction ? 'Update' : 'Add'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                  {/* From Account */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      From Account
                    </label>
                    <select
                      value={transferData.fromAccountId}
                      onChange={(e) => setTransferData({ ...transferData, fromAccountId: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                      required
                    >
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} (৳{account.balance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Visual Arrow */}
                  <div className="flex justify-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>

                  {/* To Account */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      To Account
                    </label>
                    <select
                      value={transferData.toAccountId}
                      onChange={(e) => setTransferData({ ...transferData, toAccountId: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                      required
                    >
                      <option value="">Select account</option>
                      {availableToAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} (৳{account.balance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Amount (৳)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={transferData.amount}
                      onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                      placeholder="0.00"
                      required
                    />
                    {transferData.fromAccountId && (
                      <p className="text-xs text-gray-500 mt-1">
                        Available: ৳{getAccountBalance(transferData.fromAccountId).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={transferData.date}
                      onChange={(e) => setTransferData({ ...transferData, date: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description (Optional)
                    </label>
                    <textarea
                      value={transferData.description}
                      onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                      placeholder="Add notes..."
                      rows="2"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
                    >
                      Transfer
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}